import { API_CONFIG, DOM_CONFIG, EVENTS_CONFIG, FILTERS_CONFIG } from '$mct/config';
import {
  APIEventNames,
  CalculationKeysENUM,
  MCTEventNames,
  RepaymentTypeENUM,
  SortColumnENUM,
  type InputData,
  type InputKey,
  type Inputs,
  type InputValue,
  type LogUserEventCustom,
  type Product,
  type ProductsResponse,
  type ResultsStageOptions,
  type SummaryInfo,
} from '$mct/types';
import { OutputTypeENUM, StageIDENUM } from '$mct/types';
import { MCTManager } from 'src/mct/shared/MCTManager';
import { formatNumber } from '$utils/formatting';
import { Result } from './Result';
import { queryElement } from '$utils/dom/queryElement';
import { queryElements } from '$utils/dom/queryelements';
import { generateSummaryLines, generateProductsAPIInput } from '$mct/utils';
import { FilterComponent } from './FilterGroup';
import { productsAPI } from '$mct/api';
import { removeInitialStyles } from 'src/mct/shared/utils/dom/visibility';
import { EventBus } from '$mct/components';
import { Sidebar } from './Sidebar';
import { debugError, debugLog } from '$utils/debug';

const attr = DOM_CONFIG.attributes.results;
const sidebarAttr = DOM_CONFIG.attributes.sidebar;

export class ResultsManager {
  private component: HTMLElement;
  public id: StageIDENUM;
  private eventBus: EventBus;
  private state: 'idle' | 'loading' | 'loaded' | 'error' = 'idle';
  private isInitialised: boolean = false;
  private isProceedable: boolean = false;

  private sidebar: Sidebar;

  private products: Product[] = [];
  private product: Product | null = null;
  private summaryInfo: SummaryInfo | null = null;
  private updateAnswersButton: HTMLButtonElement;

  private header: HTMLDivElement;
  private outputs: HTMLDivElement[] = [];
  private filters: FilterComponent[] = [];

  private showIfProceedable: HTMLElement[];

  private goToAppointmentButtons: HTMLButtonElement[] = [];
  private goToOEFButtons: HTMLButtonElement[] = [];
  private goToLenderButtons: HTMLButtonElement[] = [];

  // private appointmentButton: HTMLButtonElement;
  private howToApplyDialog: HTMLDialogElement;
  private howToApplyDialogClose: HTMLButtonElement;

  private getFreeAdvice: HTMLElement;
  // private getFreeAdviceButton: HTMLButtonElement;
  private getADecision: HTMLElement;
  // private getADecisionButtons: HTMLButtonElement[];
  private applyDirect: HTMLElement | null = null;
  // private applyDirectButton: HTMLButtonElement | null = null;
  private applyDirectDialog: HTMLDialogElement | null = null;
  private allowApplyDirect: boolean = false;

  private results: Result[] = [];
  private resultsList: HTMLElement;
  private resultsTemplate: HTMLElement;
  private resultsButton: HTMLButtonElement;
  private resultsButtonText: string;

  private loader: HTMLElement;
  private empty: HTMLElement;
  private pagination: HTMLElement;
  private paginationButton: HTMLButtonElement;
  private numberOfResults: number = 0;

  constructor(component: HTMLElement) {
    this.component = component;
    this.id = StageIDENUM.Results;
    this.eventBus = EventBus.getInstance();

    const sidebar = queryElement(`[${sidebarAttr.components}="component"]`, this.component) as HTMLElement;
    this.sidebar = Sidebar.getInstance(sidebar);
    this.sidebar.init();

    this.header = queryElement(`[${attr.components}="header"]`, this.component) as HTMLDivElement;
    this.outputs = queryElements(`[${attr.output}]`, this.header) as HTMLDivElement[];
    this.updateAnswersButton = queryElement(`[${attr.components}="update-answers"]`, this.header) as HTMLButtonElement;

    this.showIfProceedable = queryElements(`[${attr.showIfProceedable}]`, this.component) as HTMLElement[];

    this.goToAppointmentButtons = queryElements(
      `[${attr.components}="go-to-appointment"]`,
      this.header
    ) as HTMLButtonElement[];
    this.goToOEFButtons = queryElements(`[${attr.components}="go-to-oef"]`, this.header) as HTMLButtonElement[];
    this.goToLenderButtons = queryElements(`[${attr.components}="go-to-lender"]`, this.header) as HTMLButtonElement[];

    // this.appointmentButton = queryElement(
    //   `[${attr.components}="book-an-appointment"]`,
    //   this.header
    // ) as HTMLButtonElement;

    this.howToApplyDialog = queryElement(
      `[${attr.components}="how-to-apply-dialog"]`,
      this.component
    ) as HTMLDialogElement;

    this.howToApplyDialogClose = queryElement(
      `[${attr.components}="how-to-apply-dialog-close"]`,
      this.howToApplyDialog
    ) as HTMLButtonElement;

    this.getFreeAdvice = queryElement(`[${attr.components}="get-free-advice"]`, this.howToApplyDialog) as HTMLElement;
    // this.getFreeAdviceButton = queryElement('button', this.getFreeAdvice) as HTMLButtonElement;
    this.getADecision = queryElement(`[${attr.components}="get-a-decision"]`, this.howToApplyDialog) as HTMLElement;
    // this.getADecisionButtons = [
    //   queryElement('button', this.getADecision) as HTMLButtonElement,
    //   queryElement(`[${attr.components}="get-a-decision-button"]`, this.header) as HTMLButtonElement,
    // ];

    this.applyDirect = queryElement(`[${attr.components}="apply-direct"]`, this.howToApplyDialog) as HTMLElement | null;
    if (this.applyDirect) {
      // this.applyDirectButton = queryElement('button', this.applyDirect) as HTMLButtonElement;
      this.applyDirectDialog = queryElement(
        `[${attr.components}="apply-direct-redirect"]`,
        this.component
      ) as HTMLDialogElement;
    }

    this.allowApplyDirect = true; // Force the modal to show
    // this.allowApplyDirect = !!this.applyDirect; // Only show if apply direct exists

    this.resultsList = queryElement(`[${attr.components}="list"]`, this.component) as HTMLDivElement;
    this.resultsTemplate = queryElement(`[${attr.components}="template"]`, this.component) as HTMLDivElement;
    this.resultsButton = queryElement(`[${attr.element}="template-cta"]`, this.resultsTemplate) as HTMLButtonElement;
    this.resultsButtonText = this.resultsButton.textContent as string;
    this.resultsTemplate.remove();

    this.loader = queryElement(`[${attr.components}="loader"]`, this.component) as HTMLElement;
    this.empty = queryElement(`[${attr.components}="empty"]`, this.component) as HTMLElement;
    this.pagination = queryElement(`[${attr.components}="pagination"]`, this.component) as HTMLElement;
    this.paginationButton = queryElement('button', this.pagination) as HTMLButtonElement;

    this.eventBus.on(APIEventNames.REQUEST_SUCCESS, (event) => {
      if (event.endpoint.includes(API_CONFIG.endpoints.products)) {
        this.summaryInfo = event.response.result.SummaryInfo;
        this.renderOutputs();
      }
    });
  }

  public init(options?: ResultsStageOptions): void {
    if (this.isInitialised) return;
    this.isInitialised = true;

    const calculations = MCTManager.getCalculations();
    this.isProceedable = !!calculations.isProceedable;

    this.handleUpdateAnswers();
    this.initFilters();
    this.initAppointmentDialog();
    this.initListElements();
    this.renderOutputs();
    this.renderFilters();
    this.saveFilterValues();
    this.handleProductsAPI();

    // // Only auto-load products if explicitly requested or if autoLoad is true
    // if (options?.autoLoad === true) this.handleProductsAPI();

    this.handleButtons();
    this.handleShowIfProceedable();
    removeInitialStyles(this.component);
  }

  public start(options?: ResultsStageOptions): void {
    if (!this.isInitialised) {
      this.init(options);
      return;
    }

    const calculations = MCTManager.getCalculations();
    this.isProceedable = !!calculations.isProceedable;

    this.syncFiltersStateToQuestions();
    this.initAppointmentDialog();
    this.renderOutputs();
    this.renderFilters();
    this.handleProductsAPI();
    this.handleShowIfProceedable();
  }

  private syncFiltersStateToQuestions(): void {
    const answers = MCTManager.getAnswers();

    this.filters.forEach((filter) => {
      const answer = answers[filter.getStateValue('initialName') as InputKey];
      if (!answer) return;

      filter.setValue(answer);
      MCTManager.setFilter({
        key: filter.getStateValue('initialName') as InputKey,
        name: filter.getStateValue('finalName'),
        value: answer,
        valid: filter.isValid(),
        location: 'filter',
        source: 'user',
      });
    });
  }

  private handleProduct(action: 'set' | 'clear', product?: Product): void {
    if (action === 'set' && product) {
      this.product = product;
      MCTManager.setProduct(this.product.ProductId);
    } else {
      MCTManager.clearProduct();
      this.product = null;
    }
  }

  public show(scrollTo: boolean = true): void {
    this.handleShowIfProceedable();
    this.component.style.removeProperty('display');
    if (scrollTo) this.component.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  public hide(): void {
    this.component.style.display = 'none';
  }

  private handleUpdateAnswers(): void {
    this.updateAnswersButton.addEventListener('click', () => {
      console.log('handleUpdateAnswers: ', this.sidebar);
      this.sidebar.show();
    });
  }

  private initFilters(): void {
    const filters = queryElements(`[${attr.components}="filter-group"]`, this.component) as HTMLElement[];
    this.filters = filters.map((element, index) => {
      const filter = new FilterComponent({
        element,
        debug: true,
        indexInGroup: index,
        onEnter: () => {},
        onChange: () => this.handleChange(),
        groupName: 'filterGroup',
      });

      filter.initialise();
      return filter;
    });
  }

  private saveFilterValues(): void {
    const filterDataArray: InputData[] = this.filters.map((filter) => {
      const key = filter.getStateValue('initialName') as keyof Inputs;
      const name = filter.getStateValue('finalName');
      const value = filter.getStateValue('value') as InputValue;

      const data: InputData = { key, name, value, source: 'user', valid: filter.isValid(), location: 'filter' };
      MCTManager.setAnswer(data);
      return data;
    });

    MCTManager.setFilters(filterDataArray);
  }

  public handleChange(): void {
    this.saveFilterValues();
    this.handleProductsAPI();
  }

  private initAppointmentDialog(): void {
    /**
     * If proceedable:
     * ✓ show 'Get free advice', hide 'Get a decision'
     * × hide 'Get free advice', show 'Get a decision'
     */

    // Show/Hide buttons based on proceedability
    this.isProceedable
      ? this.getFreeAdvice.style.removeProperty('display')
      : (this.getFreeAdvice.style.display = 'none');
    this.isProceedable ? (this.getADecision.style.display = 'none') : this.getADecision.style.removeProperty('display');

    // Hide apply direct by default (only show if product has ApplyDirectLink)
    if (this.applyDirect) this.applyDirect.style.display = 'none';

    // Close dialog on button click and clear product (user is cancelling)
    this.howToApplyDialogClose.addEventListener('click', () => {
      this.handleProduct('clear');
      this.howToApplyDialog.close();
    });

    // Reset UI on dialog close (but don't clear product - it may be needed for appointment booking)
    this.howToApplyDialog.addEventListener('close', () => {
      if (this.applyDirect) this.applyDirect.style.display = 'none';
    });
  }

  private initListElements(): void {
    this.loader.style.display = 'none';
    this.empty.style.display = 'none';
    this.pagination.style.display = 'none';
  }

  private renderOutputs(): void {
    if (!this.summaryInfo) return;

    const summaryLines = generateSummaryLines(this.summaryInfo, MCTManager.getAnswers());
    const calculations = MCTManager.getCalculations();
    if (!summaryLines || !calculations) return;

    this.outputs.forEach((output) => {
      const key = output.getAttribute(attr.output);
      const type = output.getAttribute(attr.type) as OutputTypeENUM;

      /**
       * IF:
       *
       * type is 'sentence'
       * - get the text value from summaryLines based on the key
       * - set the innerHTML of the output
       *
       * type is 'currency'
       * - get the value from MCT answers based on the key
       * - set textContent to the formatted value
       *
       * edge case: is LTV
       * - calculate the LTV
       * - set textContent to formatted value if percentage
       * - otherwise set style.width to the value
       */

      if (key === 'LTV') {
        const ltv = calculations[CalculationKeysENUM.LTV];
        if (!ltv) return;

        if (type === 'percentage') output.textContent = formatNumber(ltv, { type: 'percent', decimals: 0 });
        else if (type === 'progress-bar') output.style.width = `${ltv}%`;
        return;
      } else if (key === 'MortgageAmount') {
        const mortgageAmount = calculations[CalculationKeysENUM.MortgageAmount];
        if (!mortgageAmount) return;

        if (type === 'currency') output.textContent = formatNumber(mortgageAmount, { type: 'currency' });
        else output.textContent = mortgageAmount.toString();
        return;
      }

      if (type === 'sentence') {
        const text = summaryLines[key as keyof typeof summaryLines];
        if (text) output.innerHTML = text;
      } else if (type === 'currency') {
        const value = MCTManager.getAnswer(key as InputKey) as number;
        if (value) output.textContent = formatNumber(value, { type: 'currency' });
      } else if (type === 'percentage') {
        const value = MCTManager.getAnswer(key as InputKey) as number;
        if (value) output.textContent = formatNumber(value, { type: 'percent' });
      } else if (type === 'progress-bar') {
        const value = MCTManager.getAnswer(key as InputKey) as number;
        if (value) output.style.width = `${value}%`;
      }
    });
  }

  private renderFilters(): void {
    const answers = MCTManager.getAnswers();
    const filters = { ...FILTERS_CONFIG, ...MCTManager.getFilters() };

    this.filters.forEach((filterGroup) => {
      const answer = (answers as any)[filterGroup.getStateValue('initialName')]; // @TODO: look into types here
      const config = filters[filterGroup.getStateValue('initialName') as keyof typeof filters];

      if (answer) filterGroup.setValue(answer as InputValue);
      else if (config) filterGroup.setValue(config as InputValue);
    });
  }

  private initiateResults(): void {
    this.results.forEach((result) => result.remove());
    this.numberOfResults = 0;
    this.showListUI('pagination', false);

    if (this.products.length === 0) {
      this.showListUI('empty', true);
      return;
    }

    /**
     * If allowDirect?
     * - use the normal button text
     *
     * If not?
     * & isProceedable?
     * - use goToAppointment text
     *
     * & is not proceedable?
     * - use goToOEF text
     */
    const buttonText =
      this.allowApplyDirect && this.isProceedable
        ? this.resultsButtonText
        : this.allowApplyDirect && !this.isProceedable
          ? 'Continue online'
          : this.isProceedable
            ? (this.goToAppointmentButtons[0].textContent as string)
            : (this.goToOEFButtons[0].textContent as string);

    this.results = this.products.map((product) => {
      return new Result(this.resultsList, {
        template: this.resultsTemplate,
        product,
        onClick: (product) => this.handleProductCTA(product),
        buttonText,
      });
    });

    this.renderResults(10);
    this.showListUI('empty', false);
  }

  private handleButtons(): void {
    // Close the dialog and go to appointment
    this.goToAppointmentButtons.forEach((button) =>
      button.addEventListener('click', () => {
        this.howToApplyDialog.close();
        this.eventBus.emit(MCTEventNames.STAGE_COMPLETE, { stageId: StageIDENUM.Results });
      })
    );

    // Close the dialog and go to OEF
    this.goToOEFButtons.forEach((button) =>
      button.addEventListener('click', () => {
        this.howToApplyDialog.close();
        this.handleDirectToBroker();
      })
    );

    // Close the dialog and go to lender
    this.goToLenderButtons.forEach((button) =>
      button.addEventListener('click', () => {
        this.howToApplyDialog.close();
        this.handleDirectToLender();
      })
    );

    // Render the next 10 results
    this.paginationButton.addEventListener('click', () => this.renderResults(10));
  }

  private handleShowIfProceedable(): void {
    this.showIfProceedable.forEach((element) => {
      const showIfProceedable = element.getAttribute(attr.showIfProceedable) === 'true';
      if ((this.isProceedable && showIfProceedable) || (!this.isProceedable && !showIfProceedable))
        element.style.removeProperty('display');
      else element.style.display = 'none';
    });
  }

  private renderResults(number: number = 10): void {
    // Calculate the range of results to render
    const startFromIndex = this.numberOfResults;
    const endAtIndex = startFromIndex + number - 1;

    // Render the results within the calculated range
    let renderedCount = 0;
    this.results.forEach((result, index) => {
      if (index < startFromIndex || index > endAtIndex) return;
      result.render();
      renderedCount++;
    });

    this.numberOfResults += number;
    this.showListUI('pagination', this.numberOfResults < this.products.length);
  }

  private handleProductCTA(product: Product): void {
    this.handleProduct('set', product);
    const { ApplyDirectLink } = product;

    // If apply direct is allowed, show the box
    if (this.allowApplyDirect) {
      if (this.applyDirect)
        !!ApplyDirectLink
          ? this.applyDirect.style.removeProperty('display')
          : (this.applyDirect.style.display = 'none');
      this.howToApplyDialog.showModal();
    } else if (this.isProceedable) {
      this.eventBus.emit(MCTEventNames.STAGE_COMPLETE, { stageId: StageIDENUM.Results });
    } else if (!this.isProceedable) {
      this.handleDirectToBroker();
    }
  }

  private getSortColumnValue(): SortColumnENUM {
    const sortColumnInput = this.filters.find((group) => group.getStateValue('initialName') === 'SortColumn');
    if (!sortColumnInput) return SortColumnENUM.Rate;

    const sortColumnValue = sortColumnInput.getStateValue('value') as SortColumnENUM;
    if (!sortColumnValue) return SortColumnENUM.Rate;

    return sortColumnValue;
  }

  private async fetchProducts(): Promise<ProductsResponse | null> {
    const input = generateProductsAPIInput({
      NumberOfResults: 100,
      SortColumn: this.getSortColumnValue(),
    });
    if (!input) return null;

    try {
      debugLog('🔄 [ResultsManager] fetchProducts', input);
      const response = await productsAPI.search(input);
      return response;
    } catch (error) {
      debugError('🔄 [ResultsManager] fetchProducts', error);
      return null;
    }
  }

  private async handleProductsAPI() {
    this.state = 'loading';
    this.showListUI('loader', true);
    this.showListUI('pagination', false);

    const response = await this.fetchProducts();
    if (!response) {
      this.showListUI('loader', false);
      this.state = 'error';
      return;
    }

    this.products = response.result.Products;
    this.summaryInfo = response.result.SummaryInfo;

    this.allowApplyDirect = true; // Force the modal to show
    // this.allowApplyDirect = !!this.applyDirect && !!this.products.find((product) => product.ApplyDirectLink); // Only show if apply direct exists and there are products with apply direct links

    this.initiateResults();
    this.renderOutputs();
    this.state = 'loaded';
    this.showListUI('loader', false);
  }

  private showListUI(component: 'loader' | 'empty' | 'pagination', show?: boolean): void {
    const componentEl =
      component === 'loader'
        ? this.loader
        : component === 'empty'
          ? this.empty
          : component === 'pagination'
            ? this.pagination
            : null;
    if (!componentEl) return;

    show ? componentEl.style.removeProperty('display') : (componentEl.style.display = 'none');

    // Hide/Show the results list depending on the component being shown, always show for pagination
    const showResultsList =
      this.state === 'loaded'
        ? true
        : this.state === 'loading'
          ? false
          : component === 'loader' || component === 'empty'
            ? !show
            : true;

    showResultsList ? this.resultsList.style.removeProperty('display') : (this.resultsList.style.display = 'none');
  }

  // private handleGetFreeAdvice(): void {
  //   this.howToApplyDialog.close();
  //   this.eventBus.emit(MCTEventNames.STAGE_COMPLETE, { stageId: StageIDENUM.Results });
  // }

  private async handleDirectToBroker(): Promise<void> {
    await this.handleLogUserEvents(EVENTS_CONFIG.directToBroker, 'OEF');

    /**
     * @todo
     * - populate the redirect URL with parameters
     */
    const { origin } = window.location;
    const baseUrl = `${origin}/online/populate`;

    const icid = MCTManager.getICID();
    const lcid = MCTManager.getLCID();
    const answers = MCTManager.getAnswersAsLandC();
    const calculations = MCTManager.getCalculations();

    const { PurchRemo, ResiBtl, CreditImpaired, PropertyValue, RepaymentType, MortgageLength, ReadinessToBuy } =
      answers;

    const { offerAccepted, MortgageAmount } = calculations;

    const params: Record<string, string> = {};

    if (icid) params.Icid = icid;
    if (lcid) params.LcId = lcid;
    if (PurchRemo) params.PurchaseOrRemortgage = PurchRemo;
    if (ResiBtl) params.ResidentialOrBuyToLet = ResiBtl;
    if (CreditImpaired) params.CreditIssues = CreditImpaired;
    if (PropertyValue) params.PropertyValue = PropertyValue.toString();
    if (MortgageAmount) params.LoanAmount = MortgageAmount.toString();
    if (MortgageLength) params.Term = MortgageLength.toString();
    if (RepaymentType)
      params.MortgageRepaymentType =
        RepaymentType === RepaymentTypeENUM.Repayment ? 'R' : RepaymentType === RepaymentTypeENUM.Both ? 'P' : 'I';
    if (offerAccepted) params.OfferAccepted = offerAccepted.toString();
    if (ReadinessToBuy) params.StageOfJourney = ReadinessToBuy;

    const oefParams = new URLSearchParams(params);
    const url = `${baseUrl}?${oefParams.toString()}`;

    window.open(url, '_blank');
  }

  private async handleDirectToLender(): Promise<void> {
    // Return if apply direct is not available
    if (!this.applyDirect || !this.applyDirectDialog) return;

    try {
      // Wait for the log user events API call to complete
      await this.handleLogUserEvents(EVENTS_CONFIG.directToLender, this.product?.LenderName);

      const lender = this.product?.LenderName;
      const title = queryElement(
        `[${attr.components}="apply-direct-redirect-title"]`,
        this.applyDirectDialog
      ) as HTMLHeadingElement;
      title.textContent = `We're connecting you to ${lender}`;
      this.applyDirectDialog?.showModal();

      setTimeout(() => {
        window.open(this.product?.ApplyDirectLink || '', '_blank');
        this.applyDirectDialog?.close();
      }, 3000);
    } catch (error) {
      debugError('🔄 [ResultsManager] handleDirectToLender', error);
      // Optionally, you could still redirect even if logging fails
      // Or handle the error differently based on your requirements
      window.open(this.product?.ApplyDirectLink || '', '_blank');
      this.applyDirectDialog?.close();
    }
  }

  private handleLogUserEvents(EventName: string, lender: string = ''): void {
    const payload: LogUserEventCustom = {
      EventName,
      EventValue: lender,
    };

    MCTManager.logUserEvent(payload);
  }

  /**
   * @plan for buttons
   *
   * If proceedable:
   * [X] show 'Get free advice' button
   * [X] hide 'Get a decision' button
   * [X] hide 'Apply direct' link by default
   *
   * Dialog open:
   * [X] save mortgage ID to state
   *
   * Dialog close:
   * [X] clear mortgage ID from state
   *
   * 'Get free advice' button:
   * [] do something with the mortgage ID?
   * [X] go to appointment stage
   *
   * 'Get a decision' button:
   * [] make sure LCID is saved to state
   * [X] send user to OEF
   *
   * 'Apply direct' link:
   * [x] send user data to LogUserEvents API
   * [x] show loading modal (3 seconds?)
   * [x] redirect to ApplyDirectLink
   */
}
