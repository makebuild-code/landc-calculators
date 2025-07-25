import type {
  AppointmentStageOptions,
  AppointmentDay,
  DatePlanToRemoENUM,
  ICID,
  LCID,
  LogUserEventCustom,
  Inputs,
  EnquiryData,
} from '$mct/types';
import {
  CreditImpairedENUM,
  InputKeysENUM,
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
import { DatesComponent } from './Dates';
import { TimesComponent } from './Times';
import { getOrdinalSuffix } from '$utils/formatting';
import { MCTManager } from '$mct/manager';
import type { CreateLeadAndBookingRequest, EnquiryLead } from '$mct/types';
import { InputGroup } from './Form';
import { getEnumValue } from 'src/mct/shared/utils/common/getEnumValue';
import { formatToHHMM } from '$utils/formatting/formatToHHMM';
import type { StateManager, VisibilityManager } from '$mct/state';
import { removeInitialStyles } from 'src/mct/shared/utils/dom/visibility';

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

  private stateManager: StateManager = MCTManager.getStateManager();
  private visibilityManager: VisibilityManager = MCTManager.getVisibilityManager();

  private loader: HTMLElement;
  private currentPanel: (typeof PANEL_ENUM)[keyof typeof PANEL_ENUM] = PANEL_ENUM.CALENDAR;
  private backButtons: HTMLButtonElement[];
  private bookButton: HTMLButtonElement;

  private today: Date = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/London' }));
  private lastDate: Date = new Date(this.today);

  private calendarPanel: HTMLElement;
  private datesGroup: HTMLFieldSetElement;
  private dates!: DatesComponent;
  private timesGroup: HTMLFieldSetElement;
  private times!: TimesComponent;

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
    this.dates = new DatesComponent({
      element: this.datesGroup,
      debug: true,
      onChange: () => this.handleDateChange(),
      wrapper: queryElement(`[${attr.components}="content"]`, this.calendarPanel) as HTMLElement,
      onLoadMore: () => this.handleLoadMoreDates(),
      onEnter: () => this.handleEnter(),
      groupName: 'date-filters',
      indexInGroup: 0,
    });

    this.times = new TimesComponent({
      element: this.timesGroup,
      debug: true,
      onChange: () => this.handleTimeChange(),
      onEnter: () => this.handleEnter(),
      groupName: 'time-filters',
      indexInGroup: 1,
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
    if (this.isInitialised) {
      console.log('🔄 [AppointmentManager] Already initialised');
      return;
    }
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

    this.formInputGroups = inputGroups.map((input, index) => {
      const inputGroup = new InputGroup({
        element: input,
        debug: true,
        groupName: 'appointment',
        indexInGroup: index,
        onChange: () => this.handleInputChange(inputGroup),
        onEnter: () => {},
      });

      inputGroup.initialise();
      return inputGroup;
    });

    this.formInputGroups.forEach((inputGroup) => {
      const key = inputGroup.getStateValue('initialName');
      const value = inputGroup.getStateValue('value');
      MCTManager.setFormInput({ [key]: value });
    });

    // Load initial dates
    const tomorrow = new Date(this.today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.handleDays(true, tomorrow);

    this.dates.initialise();
    this.times.initialise();

    removeInitialStyles(this.component);
  }

  public start(options?: AppointmentStageOptions): void {
    if (!this.isInitialised) {
      this.init(options);
      return;
    }
  }

  private handleInputChange(inputGroup: InputGroup): void {
    const key = inputGroup.getStateValue('initialName');
    const value = inputGroup.getStateValue('value');
    MCTManager.setFormInput({ [key]: value });
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
    this.backButtons.forEach((button) => button.addEventListener('click', () => this.handleBackButtons()));
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

    const canProceed = !!date && !!time;
    if (!canProceed) return false;

    this.saveBooking();
    return true;
  }

  private saveBooking(): void {
    const date = this.dates.getValue();
    const time = this.times.getValue();

    if (!date || !time || typeof date !== 'string' || typeof time !== 'string') return;

    // Parse the time (format is "HH:MM:SS-HH:MM:SS" or "HH:MM-HH:MM")
    const timeParts = time.split('-');
    const startTime = formatToHHMM(timeParts[0]).trim(); // e.g., "09:00"
    const endTime = formatToHHMM(timeParts[1]).trim(); // e.g., "10:00"

    MCTManager.setBooking({
      bookingDate: date,
      bookingStart: startTime,
      bookingEnd: endTime,
    });
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
      return startDate!;
    } else {
      // On slider move, get the last date from the dates manager
      const lastDate = this.dates.getLastDate();
      if (!lastDate) {
        this.setLoadingState(false);
        return null;
      }
      const fetchStartDate = new Date(lastDate);
      fetchStartDate.setDate(fetchStartDate.getDate() + 1);
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
      return false;
    }
    return true;
  }

  private async fetchAppointmentSlots(startDate: Date, endDate: Date): Promise<AppointmentDay[]> {
    const dateFrom = this.formatDateForAPI(startDate);
    const dateTo = this.formatDateForAPI(endDate);

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

    const firstActiveDay = appointmentDays.find((day) => day.slots.some((slot) => slot.enabled));
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
    const date = new Date(this.selectedDate!.date);
    const slots = await this.fetchSlotsForDateRange(date, date);

    this.selectedDate ? this.times.renderTimeSlots(slots[0].slots) : (this.timesGroup.style.display = 'none');
  }

  private async handleTimeChange(): Promise<void> {
    const date = this.dates.getValue();
    const time = this.times.getValue();

    this.dateAndTimeSet = !!date && !!time;
    this.bookButton.disabled = !this.dateAndTimeSet;

    this.tags.forEach((tag) => {
      tag.textContent = this.getFormattedDateTime();
    });
  }

  private handleEnter(): void {
    if (this.canProceedToForm()) this.navigate('next');
  }

  private async handleLoadMoreDates(): Promise<void> {
    // Get the last date from the dates manager
    const lastDate = this.dates.getLastDate();
    if (!lastDate) return;

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
    const formData = MCTManager.getForm();
    if (!formData) {
      console.error('Failed to get form data');
      this.setLoadingState(false);
      return;
    }

    /**
     * @todo
     *
     * - Take VulnerableMessage and add it to the notes
     * - Remove Vulnerable and VulnerableMessage from the formData
     */

    // Get state data
    const stateData = this.getStateData();
    if (!stateData) {
      console.error('Failed to get state data');
      this.setLoadingState(false);
      return;
    } else {
      if (formData.Vulnerable === 'Yes')
        stateData.Notes = `Vulnerable: ${formData.Vulnerable} - Notes: ${formData.VulnerableMessage}`;
      stateData.ChosenMCTProduct = MCTManager.getProduct() as number;
    }

    // Get appointment data
    const bookingData = MCTManager.getBooking();
    if (!bookingData) {
      console.error('Failed to get booking data');
      this.setLoadingState(false);
      return;
    }

    const enquiry: EnquiryLead = {
      ...formData,
      ...stateData,
    };

    // Create the API request with default values for required fields
    const request: CreateLeadAndBookingRequest = {
      enquiry: {
        ...formData,
        ...stateData,
      },
      booking: bookingData,
    };

    try {
      // Call the API
      const response = await createLeadAndBookingAPI.createLeadAndBooking(request);

      // Handle successful booking
      this.form.style.display = 'none';
      this.formSuccess.style.removeProperty('display');

      this.logUserEvent(); // No await, just log the event and handle separately
    } catch (error: unknown) {
      console.error('Error submitting booking:', error);

      // Handle specific API errors
      if (error instanceof APIError) {
        console.error('API Error Status:', error.status);
        console.error('API Error Message:', error.message);

        if (error.status === 409) {
          console.error('Booking error: 409 - Slot already taken');
          this.tryAgainDialog.showModal();
          this.tryAgainButton.addEventListener('click', () => {
            this.tryAgainDialog.close();
            this.showCalendarPanel();
          });
        } else if (error.status === 400) {
          console.error('Booking error: 400 - Bad request, try again');
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

  private async logUserEvent(): Promise<void> {
    const event: LogUserEventCustom = {
      EventName: 'MCT_Appointment_Booked',
      EventValue: `${this.dates.getValue()} ${this.times.getValue()}`,
    };

    try {
      MCTManager.logUserEvent(event);
    } catch (error) {
      console.error('Error logging user event:', error);
    }
  }

  // /**
  //  * Get form data from the appointment form
  //  */
  // private getFormData(): EnquiryForm {
  //   const formData = MCTManager.getForm();

  //   return formData;
  // }

  /**
   * Get state data from the MCT manager
   */
  private getStateData(): EnquiryData {
    const state = MCTManager.getState();
    const answers = MCTManager.getAnswers();
    const calculations = MCTManager.getCalculations();

    // Map state and answers to API fields
    const stateData: EnquiryData = {
      icid: state.icid as ICID,
      lcid: state.lcid as LCID,
      PurchasePrice: this.getNumericAnswer(answers, InputKeysENUM.PropertyValue),
      RepaymentType: getEnumValue(
        RepaymentTypeENUM,
        this.getStringAnswer(answers, InputKeysENUM.RepaymentType)
      ) as RepaymentTypeENUM,
      OfferAccepted: calculations.offerAccepted as OfferAcceptedENUM,
      MortgageLength: this.getNumericAnswer(answers, InputKeysENUM.MortgageLength),
      ResiBtl: getEnumValue(ResiBtlENUM, this.getStringAnswer(answers, InputKeysENUM.ResiBtl)) as ResiBtlENUM,
      Lender: this.getStringAnswer(answers, InputKeysENUM.Lender),
      ReadinessToBuy: getEnumValue(ReadinessToBuyENUM, this.getStringAnswer(answers, InputKeysENUM.ReadinessToBuy)),
      PurchRemo: getEnumValue(PurchRemoENUM, this.getStringAnswer(answers, InputKeysENUM.PurchRemo)),
      PropertyValue: this.getNumericAnswer(answers, InputKeysENUM.PropertyValue),
      DepositAmount: this.getNumericAnswer(answers, InputKeysENUM.DepositAmount),
      LTV: calculations.LTV as number,
      CreditImpaired: getEnumValue(CreditImpairedENUM, this.getStringAnswer(answers, InputKeysENUM.CreditImpaired)),
      LoanAmount: this.getNumericAnswer(answers, InputKeysENUM.BorrowAmount),
      InterestOnlyAmount: this.getNumericAnswer(answers, InputKeysENUM.InterestOnlyValue),
      FTB: this.getBooleanAnswer(answers, InputKeysENUM.FTB),
      NewBuild: this.getBooleanAnswer(answers, InputKeysENUM.NewBuild),
      DatePlanToRemo: this.getStringAnswer(answers, InputKeysENUM.DatePlanToRemo) as DatePlanToRemoENUM,
      ChosenMCTProduct: MCTManager.getProduct() as number,
    };

    return stateData;
  }

  // /**
  //  * Get appointment data including date and time
  //  */
  // private getAppointmentData(): Booking | null {
  //   try {
  //     const booking = MCTManager.getBooking();
  //     if (!booking) return null;

  //     return booking;
  //   } catch (error) {
  //     console.error('Error getting appointment data:', error);
  //     return null;
  //   }
  // }

  /**
   * Helper method to get string answer from answers object
   */
  private getStringAnswer(answers: Inputs, key: InputKeysENUM): string {
    return answers[key]?.toString() || '';
  }

  /**
   * Helper method to get numeric answer from answers object
   */
  private getNumericAnswer(answers: Inputs, key: InputKeysENUM): number {
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

  private handleBackButtons(): void {
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

    // Format the date
    const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'long' });
    const dayNumber = dateObj.toLocaleString('en-GB', { day: 'numeric' });
    const daySuffix = getOrdinalSuffix(parseInt(dayNumber));
    const monthName = dateObj.toLocaleDateString('en-GB', { month: 'long' });

    return `${dayName} ${dayNumber}${daySuffix} ${monthName} between ${time}`;
  }
}
