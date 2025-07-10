import type { AppointmentStageOptions, AppointmentDay, ICID, LCID, InputValue } from '$mct/types';
import {
  BuyerTypeENUM,
  CreditImpairedENUM,
  OfferAcceptedENUM,
  PurchRemoENUM,
  ReadinessToBuyENUM,
  RepaymentTypeENUM,
  ResiBtlENUM,
  StageIDENUM,
} from '$mct/types';
import { queryElement, queryElements } from '$utils/dom';
import { mortgageAppointmentSlotsAPI, createLeadAndBookingAPI, APIError } from '$mct/api';
import { DOM_CONFIG, MCT_CONFIG } from '$mct/config';
import { Dates } from './Dates';
import { Times } from './Times';
import { getOrginalDate } from '$utils/formatting';
import { MCTManager } from '$mct/manager';
import type { CreateLeadAndBookingRequest, EnquiryLead, Booking } from '$mct/types';
import type { StatefulInputGroup } from '$mct/components';
import { InputGroup } from './Form';
import type { Input } from 'src/types';

const attr = DOM_CONFIG.attributes.appointment;

const PANEL_ENUM = {
  CALENDAR: 'calendar',
  FORM: 'form',
} as const;

/**
 * @todo
 * - Only show the back button if we're coming from the results stage
 */

export class AppointmentManager {
  private component: HTMLElement;
  public id: StageIDENUM;
  private isInitialised: boolean = false;

  private loader: HTMLElement;
  private currentPanel: (typeof PANEL_ENUM)[keyof typeof PANEL_ENUM] = PANEL_ENUM.CALENDAR;
  private backButtons: HTMLButtonElement[];
  private bookButton: HTMLButtonElement;

  private today: Date = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/London' }));
  private lastDate: Date = new Date(this.today);

  private calendarPanel: HTMLElement;
  private datesGroup: HTMLFieldSetElement;
  private dates!: Dates;
  private timesGroup: HTMLFieldSetElement;
  private times!: Times;
  private formPanel: HTMLElement;
  private tags: HTMLElement[];
  private form: HTMLFormElement;
  private formInputGroups: InputGroup[] = [];
  private formError: HTMLElement;
  private formSuccess: HTMLElement;
  private tryAgainDialog: HTMLDialogElement;
  private tryAgainButton: HTMLButtonElement;

  // Appointment slots data
  private appointmentDays: AppointmentDay[] = [];
  private selectedDate: AppointmentDay | null = null;
  private isLoading: boolean = false;
  private hasError: boolean = false;

  private dateAndTimeSet: boolean = false;

  constructor(component: HTMLElement) {
    this.component = component;
    this.id = StageIDENUM.Appointment;

    this.loader = queryElement(`[${attr.components}="loader"]`, this.component) as HTMLElement;
    this.backButtons = queryElements(`[${attr.components}="back"]`, this.component) as HTMLButtonElement[];
    this.bookButton = queryElement(`[${attr.components}="book"]`, this.component) as HTMLButtonElement;

    this.calendarPanel = queryElement(`[${attr.panel}="${PANEL_ENUM.CALENDAR}"]`, this.component) as HTMLElement;
    this.datesGroup = queryElement(`[${attr.components}="dates"]`, this.calendarPanel) as HTMLFieldSetElement;
    this.timesGroup = queryElement(`[${attr.components}="times"]`, this.calendarPanel) as HTMLFieldSetElement;

    // Initialize the dates manager
    this.dates = new Dates(this.datesGroup, {
      onChange: () => this.handleDateChange(),
      groupName: 'date-filters',
      wrapper: queryElement(`[${attr.components}="content"]`, this.calendarPanel) as HTMLElement,
      onLoadMore: () => this.handleLoadMoreDates(),
      onEnter: () => this.handleEnter(),
    });

    this.times = new Times(this.timesGroup, {
      onChange: () => this.handleTimeChange(),
      groupName: 'time-filters',
      onEnter: () => this.handleEnter(),
    });

    this.formPanel = queryElement(`[${attr.panel}="${PANEL_ENUM.FORM}"]`, this.component) as HTMLElement;
    this.tags = queryElements(`[${attr.components}="tag"]`, this.formPanel) as HTMLElement[];
    this.form = queryElement(`form`, this.formPanel) as HTMLFormElement;
    this.formError = queryElement(`[${attr.form}="error"]`, this.formPanel) as HTMLElement;
    this.formSuccess = queryElement(`[${attr.form}="success"]`, this.formPanel) as HTMLElement;
    this.tryAgainDialog = queryElement(`[${attr.components}="try-again"]`, this.formPanel) as HTMLDialogElement;
    this.tryAgainButton = queryElement(
      `[${attr.components}="back-to-calendar"]`,
      this.tryAgainDialog
    ) as HTMLButtonElement;
  }

  public init(options?: AppointmentStageOptions): void {
    if (this.isInitialised) return;
    this.isInitialised = true;
    this.setLoadingState(true);

    this.timesGroup.style.display = 'none';
    this.formPanel.style.display = 'none';
    this.formSuccess.style.display = 'none';

    this.bindEvents();

    const inputGroups = queryElements(
      `[${MCT_CONFIG.dom.attributes.component}="input-group"]`,
      this.formPanel
    ) as HTMLElement[];

    this.formInputGroups = inputGroups.map((input) => {
      const inputGroup = new InputGroup({
        element: input,
        groupName: 'appointment',
        onChange: () => {},
        onEnter: () => {},
      });

      inputGroup.initialise();
      return inputGroup;
    });

    console.log('formInputGroups', this.formInputGroups);

    // Load initial dates
    const tomorrow = new Date(this.today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.handleDays(true, tomorrow);
  }

  public show(scrollTo: boolean = true): void {
    this.component.style.removeProperty('display');
    if (scrollTo) this.component.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  public hide(): void {
    this.component.style.display = 'none';
  }

  private bindEvents(): void {
    this.bookButton.addEventListener('click', () => this.navigate('next'));
    this.backButtons.forEach((button) => {
      button.addEventListener('click', () => this.handleBackButtons(button));
    });

    this.form.addEventListener('submit', (event) => this.onFormSubmit(event));
  }

  private showLoader(show: boolean): void {
    if (show) {
      this.loader.style.display = 'flex';
      this.loader.style.opacity = '1';
    } else {
      this.loader.style.display = 'none';
      this.loader.style.opacity = '0';
    }
  }

  private navigate(direction: 'next' | 'previous'): void {
    try {
      if (direction === 'next') {
        this.navigateNext();
      } else if (direction === 'previous') {
        this.navigatePrevious();
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  private navigateNext(): void {
    switch (this.currentPanel) {
      case PANEL_ENUM.CALENDAR:
        if (this.canProceedToForm()) this.showFormPanel();
        break;
      case PANEL_ENUM.FORM:
        this.handleFormSubmission();
        break;
      default:
        console.warn('Unknown panel state:', this.currentPanel);
    }
  }

  private navigatePrevious(): void {
    switch (this.currentPanel) {
      case PANEL_ENUM.CALENDAR:
        this.navigateToResults();
        break;
      case PANEL_ENUM.FORM:
        this.showCalendarPanel();
        break;
      default:
        console.warn('Unknown panel state:', this.currentPanel);
    }
  }

  private canProceedToForm(): boolean {
    const date = this.dates.getValue();
    const time = this.times.getValue();

    return !!date && !!time;
  }

  private showFormPanel(): void {
    this.formError.style.display = 'none';
    this.formSuccess.style.display = 'none';
    this.calendarPanel.style.display = 'none';
    this.formPanel.style.removeProperty('display');
    this.currentPanel = PANEL_ENUM.FORM;
    this.formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private showCalendarPanel(): void {
    this.calendarPanel.style.removeProperty('display');
    this.formPanel.style.display = 'none';
    this.currentPanel = PANEL_ENUM.CALENDAR;
    this.calendarPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // refresh the dates and slots?
  }

  private navigateToResults(): void {
    console.log('Back to results');
    MCTManager.goToStage(StageIDENUM.Results);
  }

  private async handleDays(isInit: boolean, startDate?: Date): Promise<void> {
    const fetchStartDate = this.calculateFetchStartDate(isInit, startDate);
    if (!fetchStartDate) {
      this.setLoadingState(false);
      return;
    }

    const { startDate: apiStartDate, endDate: apiEndDate } = await this.calculateDateRange(isInit, fetchStartDate);

    if (!this.shouldFetchMoreDays(apiEndDate)) {
      this.setLoadingState(false);
      return;
    }

    try {
      this.lastDate = apiEndDate;
      const appointmentDays = await this.fetchAppointmentSlots(apiStartDate, apiEndDate);
      this.processAppointmentDays(appointmentDays, isInit);
    } catch (error) {
      console.error('Error fetching appointment slots:', error);
      this.hasError = true;
    } finally {
      this.setLoadingState(false);
    }
  }

  private calculateFetchStartDate(isInit: boolean, startDate?: Date): Date | null {
    if (isInit) {
      // On initial load, use the provided startDate (tomorrow)
      //   console.log('Initial load - starting from:', startDate);
      return startDate!;
    } else {
      // On slider move, get the last date from the dates manager
      const lastDate = this.dates.getLastDate();
      if (!lastDate) {
        // console.log('No dates available, cannot determine start date');
        this.setLoadingState(false);
        return null;
      }
      const fetchStartDate = new Date(lastDate);
      fetchStartDate.setDate(fetchStartDate.getDate() + 1);
      //   console.log('Slider move - starting from:', fetchStartDate);
      return fetchStartDate;
    }
  }

  private async calculateDateRange(isInit: boolean, fetchStartDate: Date): Promise<{ startDate: Date; endDate: Date }> {
    // Use ConfigManager to get the correct number of days
    const { ConfigManager } = await import('./Config');
    const configManager = ConfigManager.getInstance();
    const numberOfDaysToFetch = isInit ? configManager.getDaysPerView() * 2 - 1 : configManager.getDaysPerMove() - 1;

    const endDate = new Date(fetchStartDate);
    endDate.setDate(endDate.getDate() + numberOfDaysToFetch);

    return { startDate: fetchStartDate, endDate };
  }

  private shouldFetchMoreDays(endDate: Date): boolean {
    if (endDate <= this.lastDate) {
      //   console.log('No more days to fetch');
      return false;
    }
    return true;
  }

  private async fetchAppointmentSlots(startDate: Date, endDate: Date): Promise<AppointmentDay[]> {
    const dateFrom = this.formatDateForAPI(startDate);
    const dateTo = this.formatDateForAPI(endDate);

    // console.log('Fetching days from:', dateFrom, 'to:', dateTo);

    const response = await mortgageAppointmentSlotsAPI.getSlots(dateFrom, dateTo);
    return response.result;
  }

  /**
   * Standalone function to fetch appointment slots for given date range
   * Can be called independently without affecting the manager's state
   */
  public async fetchSlotsForDateRange(startDate: Date, endDate: Date): Promise<AppointmentDay[]> {
    return await this.fetchAppointmentSlots(startDate, endDate);
  }

  private processAppointmentDays(appointmentDays: AppointmentDay[], isInit: boolean): void {
    this.appointmentDays = appointmentDays;
    this.dates.addDays(this.appointmentDays);

    if (!isInit || appointmentDays.length === 0) return;

    // console.log('appointmentDays', appointmentDays);

    const firstActiveDay = appointmentDays.find((day) => day.slots.some((slot) => slot.enabled));
    // firstActiveDay ? this.times.renderTimeSlots(firstActiveDay.slots) : (this.timesGroup.style.display = 'none');
    firstActiveDay ? this.dates.selectFirstActiveDay(firstActiveDay.date) : (this.timesGroup.style.display = 'none');
  }

  private setLoadingState(loading: boolean): void {
    this.isLoading = loading;
    this.showLoader(loading);
  }

  private formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private async handleDateChange(): Promise<void> {
    this.selectedDate = this.dates.getSelectedDate();
    // console.log('selectedDate', this.selectedDate);

    // console.log('selectedDate', this.selectedDate);
    const date = new Date(this.selectedDate!.date);
    const slots = await this.fetchSlotsForDateRange(date, date);

    this.selectedDate ? this.times.renderTimeSlots(slots[0].slots) : (this.timesGroup.style.display = 'none');
  }

  private async handleTimeChange(): Promise<void> {
    // console.log('handleTimeChange');

    const date = this.dates.getValue();
    const time = this.times.getValue();

    this.dateAndTimeSet = !!date && !!time;
    this.bookButton.disabled = !this.dateAndTimeSet;

    this.tags.forEach((tag) => {
      tag.textContent = this.getFormattedDateTime();
    });
  }

  private handleEnter(): void {
    // console.log('Enter key pressed');
    if (this.canProceedToForm()) this.navigate('next');
  }

  private async handleLoadMoreDates(): Promise<void> {
    // Get the last date from the dates manager
    const lastDate = this.dates.getLastDate();
    if (!lastDate) {
      //   console.log('No dates available, cannot load more');
      return;
    }

    // Calculate next start date
    const nextStartDate = new Date(lastDate);
    nextStartDate.setDate(nextStartDate.getDate() + 1);

    // Load more dates
    await this.handleDays(false, nextStartDate);
  }

  /**
   * Handle form submission by collecting form data and state data, then calling the API
   * @param event - The event object
   */
  private onFormSubmit(event: Event): void {
    event.preventDefault();
    this.handleFormSubmission();
  }

  /**
   * Handle form submission by collecting form data and state data, then calling the API
   */
  private async handleFormSubmission(): Promise<void> {
    // Show loading state
    this.setLoadingState(true);

    // Get form data
    const formData = this.getFormData();
    //   console.log('formData', formData);
    if (!formData) {
      console.error('Failed to get form data');
      this.setLoadingState(false);
      return;
    }

    // Get state data
    const stateData = this.getStateData();
    const calculations = MCTManager.getCalculations();
    //   console.log('stateData', stateData);
    if (!stateData) {
      console.error('Failed to get state data');
      this.setLoadingState(false);
      return;
    }

    // Get appointment data
    const appointmentData = this.getAppointmentData();
    //   console.log('appointmentData', appointmentData);
    if (!appointmentData) {
      console.error('Failed to get appointment data');
      this.setLoadingState(false);
      return;
    }

    // Create the API request with default values for required fields
    const request: CreateLeadAndBookingRequest = {
      enquiry: {
        //   EnquiryId: 0, // Default value - should be provided by the system
        //   PartnerId: 1, // Default value - should be configurable
        icid: stateData.icid as ICID,
        lcid: stateData.lcid as LCID,
        FirstName: formData.FirstName as string,
        Surname: formData.Surname as string,
        Email: formData.Email as string,
        Mobile: formData.Mobile as string,
        PurchasePrice: stateData.PropertyValue as number,
        RepaymentType: stateData.RepaymentType as RepaymentTypeENUM,
        OfferAccepted: calculations.offerAccepted as OfferAcceptedENUM,
        MortgageLength: stateData.MortgageLength as number,
        MaximumBudget: stateData.MaximumBudget,
        BuyerType: stateData.BuyerType,
        ResiBtl: stateData.ResiBtl as ResiBtlENUM,
        Lender: stateData.Lender,
        ReadinessToBuy: stateData.ReadinessToBuy,
        PurchRemo: stateData.PurchRemo,
        PropertyValue: stateData.PropertyValue as number,
        DepositAmount: stateData.DepositAmount as number,
        LTV: calculations.LTV as number,
        Source: stateData.Source,
        SourceId: stateData.SourceId,
        CreditImpaired: stateData.CreditImpaired,
        // IsEmailMarketingPermitted: formData.IsEmailMarketingPermitted as boolean,
        // IsPhoneMarketingPermitted: formData.IsPhoneMarketingPermitted as boolean,
        // IsSMSMarketingPermitted: formData.IsSMSMarketingPermitted as boolean,
        // IsPostMarketingPermitted: formData.IsPostMarketingPermitted as boolean,
        // IsSocialMessageMarketingPermitted: formData.IsSocialMessageMarketingPermitted as boolean,
        IsEmailMarketingPermitted: true,
        IsPhoneMarketingPermitted: true,
        IsSMSMarketingPermitted: true,
        IsPostMarketingPermitted: true,
        IsSocialMessageMarketingPermitted: true,
      },
      booking: appointmentData,
    };

    console.log('Submitting booking request:', request);
    try {
      // Call the API
      const response = await createLeadAndBookingAPI.createLeadAndBooking(request);
      console.log('Booking response:', response);

      // Handle successful booking
      this.form.style.display = 'none';
      this.formSuccess.style.removeProperty('display');
    } catch (error: unknown) {
      console.error('Error submitting booking:', error);

      // Handle specific API errors
      if (error instanceof APIError) {
        console.log('API Error Status:', error.status);
        console.log('API Error Message:', error.message);

        if (error.status === 409) {
          console.log('Booking error: 409 - Slot already taken');
          this.tryAgainDialog.showModal();
          this.tryAgainButton.addEventListener('click', () => {
            this.tryAgainDialog.close();
            this.showCalendarPanel();
          });
        } else if (error.status === 400) {
          console.log('Booking error: 400 - Bad request, try again');
          // You can add specific handling for 400 errors here
          // For example, show a different dialog or message
          // alert('Unable to book this appointment. Please try again.');
          this.formError.style.display = 'block';
        } else {
          console.error('Booking failed with status:', error.status);
          alert('An error occurred while booking your appointment. Please try again.');
          this.formError.style.display = 'block';
        }
      } else {
        // Handle other types of errors
        console.error('Unexpected error:', error);
        alert('An unexpected error occurred. Please try again.');
      }
    } finally {
      this.setLoadingState(false);
    }
  }

  /**
   * Get form data from the appointment form
   */
  private getFormData(): Partial<EnquiryLead> | null {
    try {
      //   const formInputs = queryElements('input, select, textarea', this.form) as HTMLInputElement[];
      //   const formData: Record<string, any> = {};

      //   formInputs.forEach((input) => {
      //     console.log('input', input.name, input.value);
      //     if (input.name && input.value) {
      //       formData[input.name] = input.value;
      //     }
      //   });

      const formData: Record<string, any> = {};
      this.formInputGroups.forEach((group) => {
        formData[group.getStateValue('initialName')] = group.getValue() as InputValue;
      });

      console.log('formData', formData);

      // Map form fields to API fields
      const mappedData: Partial<EnquiryLead> = {
        FirstName: formData.FirstName,
        Surname: formData.Surname,
        Email: formData.Email,
        Mobile: formData.Mobile,
        IsEmailMarketingPermitted: formData.IsEmailMarketingPermitted,
        IsPhoneMarketingPermitted: formData.IsPhoneMarketingPermitted,
        IsSMSMarketingPermitted: formData.IsSMSMarketingPermitted,
        IsPostMarketingPermitted: formData.IsPostMarketingPermitted,
        IsSocialMessageMarketingPermitted: formData.IsSocialMessageMarketingPermitted,
      };

      return mappedData;
    } catch (error) {
      console.error('Error getting form data:', error);
      return null;
    }
  }

  /**
   * Get state data from the MCT manager
   */
  private getStateData(): Partial<EnquiryLead> | null {
    try {
      const state = MCTManager.getState();
      const answers = MCTManager.getAnswers();

      // Map state and answers to API fields
      const stateData: Partial<EnquiryLead> = {
        icid: state.icid || '',
        lcid: state.lcid || '',
        PurchasePrice: this.getNumericAnswer(answers, 'PropertyValue'),
        RepaymentType:
          RepaymentTypeENUM[this.getStringAnswer(answers, 'RepaymentType') as keyof typeof RepaymentTypeENUM],
        OfferAccepted:
          OfferAcceptedENUM[this.getStringAnswer(answers, 'OfferAccepted') as keyof typeof OfferAcceptedENUM],
        MortgageLength: this.getNumericAnswer(answers, 'MortgageLength'),
        MaximumBudget: this.getNumericAnswer(answers, 'MaximumBudget'), // unsure
        BuyerType: BuyerTypeENUM[this.getStringAnswer(answers, 'BuyerType') as keyof typeof BuyerTypeENUM], // unsure
        ResiBtl: ResiBtlENUM[this.getStringAnswer(answers, 'ResiBtl') as keyof typeof ResiBtlENUM],
        Lender: this.getStringAnswer(answers, 'Lender'),
        ReadinessToBuy:
          ReadinessToBuyENUM[this.getStringAnswer(answers, 'ReadinessToBuy') as keyof typeof ReadinessToBuyENUM],
        PurchRemo: PurchRemoENUM[this.getStringAnswer(answers, 'PurchRemo') as keyof typeof PurchRemoENUM],
        PropertyValue: this.getNumericAnswer(answers, 'PropertyValue'),
        DepositAmount: this.getNumericAnswer(answers, 'DepositAmount'),
        LTV: this.getNumericAnswer(answers, 'LTV'), // get from calculations
        Source: this.getStringAnswer(answers, 'Source'), // unsure
        SourceId: this.getNumericAnswer(answers, 'SourceId'), // unsure
        CreditImpaired:
          CreditImpairedENUM[this.getStringAnswer(answers, 'CreditImpaired') as keyof typeof CreditImpairedENUM],
      };

      return stateData;
    } catch (error) {
      console.error('Error getting state data:', error);
      return null;
    }
  }

  /**
   * Get appointment data including date and time
   */
  private getAppointmentData(): Booking | null {
    try {
      const date = this.dates.getValue();
      const time = this.times.getValue();

      if (!date || !time || typeof date !== 'string' || typeof time !== 'string') {
        return null;
      }

      // Parse the time (format is "HH:MM:SS-HH:MM:SS" or "HH:MM-HH:MM")
      const timeParts = time.split('-');
      // Ensure bookingStart and bookingEnd are in "HH:MM" format
      const formatToHHMM = (t: string) => {
        // Accepts "HH:MM:SS" or "HH:MM"
        const parts = t.split(':');
        return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : t;
      };
      const startTime = formatToHHMM(timeParts[0]); // e.g., "09:00"
      const endTime = formatToHHMM(timeParts[1]); // e.g., "10:00"

      const booking: Booking = {
        source: 'SYSTEM', // unsure
        bookingDate: new Date(date).toISOString(),
        bookingStart: startTime,
        bookingEnd: endTime,
        bookingProfile: 'DEFAULT', // unsure
        bookingProfileId: 1, // unsure
      };

      return booking;
    } catch (error) {
      console.error('Error getting appointment data:', error);
      return null;
    }
  }

  /**
   * Helper method to get string answer from answers object
   */
  private getStringAnswer(answers: Record<string, any>, key: string): string {
    return answers[key] || '';
  }

  /**
   * Helper method to get numeric answer from answers object
   */
  private getNumericAnswer(answers: Record<string, any>, key: string): number {
    const value = answers[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  /**
   * Helper method to get boolean answer from answers object
   */
  private getBooleanAnswer(answers: Record<string, any>, key: string): boolean {
    const value = answers[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value.toLowerCase() === 'yes' || value.toLowerCase() === 'y';
    }
    return false;
  }

  private handleBackButtons(button: HTMLButtonElement): void {
    console.log('handleBackButtons', button);
    this.navigate('previous');
  }

  /**
   * Formats the selected date and time into a human-readable string
   * @returns Formatted string like "Wednesday 28th February at 9:00 AM" or null if no date/time selected
   */
  private getFormattedDateTime(): string | null {
    const date = this.dates.getValue();
    const time = this.times.getValue();

    // Type checking for date and time values
    if (!date || !time || typeof date !== 'string' || typeof time !== 'string') return null;

    // Parse the date
    const dateObj = new Date(date);

    // Parse the time (format is "HH:MM-HH:MM")
    const timeParts = time.split('-');
    const startTime = timeParts[0]; // e.g., "09:00"

    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = startTime.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const formattedTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

    // Format the date
    const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'long' });
    const dayNumber = getOrginalDate(dateObj);
    const monthName = dateObj.toLocaleDateString('en-GB', { month: 'long' });

    return `${dayName} ${dayNumber} ${monthName} at ${formattedTime}`;
  }
}
