import { DOM_CONFIG, FILTERS_CONFIG } from '$mct/config';
import type {
  AnswerKey,
  AnswerName,
  AnswerValue,
  ICID,
  InputValue,
  LCID,
  LogUserEventCustom,
  LogUserEventResponse,
  Product,
  ProductsResponse,
  ResultsStageOptions,
  SummaryInfo,
} from '$mct/types';
import { OutputTypeENUM, StageIDENUM } from '$mct/types';
import { MCTManager } from 'src/mct/shared/MCTManager';
import { formatNumber } from '$utils/formatting';
import { Result } from './Result';
import { queryElement } from '$utils/dom/queryElement';
import { queryElements } from '$utils/dom/queryelements';
import { generateSummaryLines, generateProductsAPIInput } from '$mct/utils';
import { FilterGroup } from './FilterGroup';
import { logUserEventsAPI, productsAPI } from '$mct/api';
import { simulateEvent } from '@finsweet/ts-utils';

const attr = DOM_CONFIG.attributes.results;

/**
 * @plan
 *
 * When initialised by MCTManager after completing the form:
 * - Render outputs to header
 *    - borrowOverTerm, dealsAndRates
 *    - purchase price
 *    - LTV (calculated)
 *    - borrowing
 *    - deposit
 * - Apply values to the filters
 * - Call products API based on the filters and the answers
 *
 * Misc:
 * - Initialise dialogs
 * - Initialise sidebar form
 * - Bind events:
 *    - on input change
 *    - on select change
 *    - pagination / load more
 *    - reset filters
 */

export class ResultsManager {
  private component: HTMLElement;
  public id: StageIDENUM;
  private isInitialised: boolean = false;

  private products: Product[] = [];
  private product: Product | null = null;
  private summaryInfo: SummaryInfo | null = null;
  private updateAnswersButton: HTMLButtonElement;

  private header: HTMLDivElement;
  private outputs: HTMLDivElement[] = [];
  private filterGroups: FilterGroup[] = [];

  private showIfProceedable: HTMLElement[];

  private appointmentDialogButton: HTMLButtonElement;
  private appointmentDialog: HTMLDialogElement;
  private appointmentDialogClose: HTMLButtonElement;

  private getFreeAdvice: HTMLElement;
  private getFreeAdviceButton: HTMLButtonElement;
  private getADecision: HTMLElement;
  private getADecisionButton: HTMLButtonElement;
  private applyDirect: HTMLElement | null;
  private applyDirectLink: HTMLLinkElement | undefined;
  private applyDirectDialog: HTMLDialogElement | undefined;

  private results: Result[] = [];
  private resultsList: HTMLElement;
  private resultsTemplate: HTMLElement;

  private loader: HTMLElement;
  private empty: HTMLElement;
  private pagination: HTMLElement;
  private paginationButton: HTMLButtonElement;
  private numberOfResults: number = 0;

  constructor(component: HTMLElement) {
    this.component = component;
    this.id = StageIDENUM.Results;

    this.header = queryElement(`[${attr.components}="header"]`, this.component) as HTMLDivElement;
    this.outputs = queryElements(`[${attr.output}]`, this.header) as HTMLDivElement[];
    this.updateAnswersButton = queryElement(`[${attr.components}="update-answers"]`, this.header) as HTMLButtonElement;

    this.showIfProceedable = queryElements(`[${attr.showIfProceedable}]`, this.component) as HTMLElement[];

    this.appointmentDialogButton = queryElement(
      `[${attr.components}="book-an-appointment"]`,
      this.header
    ) as HTMLButtonElement;
    this.appointmentDialog = queryElement(
      `[${attr.components}="appointment-dialog"]`,
      this.component
    ) as HTMLDialogElement;
    this.appointmentDialogClose = queryElement(
      `[${attr.components}="close-appointment-dialog"]`,
      this.appointmentDialog
    ) as HTMLButtonElement;

    this.getFreeAdvice = queryElement(`[${attr.components}="get-free-advice"]`, this.appointmentDialog) as HTMLElement;
    this.getFreeAdviceButton = queryElement('button', this.getFreeAdvice) as HTMLButtonElement;
    this.getADecision = queryElement(`[${attr.components}="get-a-decision"]`, this.appointmentDialog) as HTMLElement;
    this.getADecisionButton = queryElement('button', this.getADecision) as HTMLButtonElement;
    this.applyDirect = queryElement(
      `[${attr.components}="apply-direct"]`,
      this.appointmentDialog
    ) as HTMLElement | null;
    if (this.applyDirect) this.applyDirectLink = queryElement('a', this.applyDirect) as HTMLLinkElement;
    if (this.applyDirect)
      this.applyDirectDialog = queryElement(
        `[${attr.components}="apply-direct-redirect"]`,
        this.component
      ) as HTMLDialogElement;

    this.resultsList = queryElement(`[${attr.components}="list"]`, this.component) as HTMLDivElement;
    this.resultsTemplate = queryElement(`[${attr.components}="template"]`, this.component) as HTMLDivElement;
    this.resultsTemplate.remove();

    this.loader = queryElement(`[${attr.components}="loader"]`, this.component) as HTMLElement;
    this.empty = queryElement(`[${attr.components}="empty"]`, this.component) as HTMLElement;
    this.pagination = queryElement(`[${attr.components}="pagination"]`, this.component) as HTMLElement;
    this.paginationButton = queryElement('button', this.pagination) as HTMLButtonElement;
  }

  public init(options?: ResultsStageOptions): void {
    if (this.isInitialised) return;
    this.isInitialised = true;

    // if (options?.exampleData) {
    //   // Answers will be saved from prior stage, just temporary to avoid inputting every time
    //   Object.entries(EXAMPLE_ANSWERS).forEach(([key, value]) => {
    //     MCTManager.setAnswer({
    //       key: key as AnswerKey,
    //       name: key as AnswerName,
    //       value: value as AnswerValue,
    //       source: 'user',
    //     });
    //   });
    // }

    this.handleUpdateAnswers();
    this.initFilterGroups();
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
  }

  public show(scrollTo: boolean = true): void {
    this.component.style.removeProperty('display');
    if (scrollTo) this.component.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  public hide(): void {
    this.component.style.display = 'none';
  }

  private handleUpdateAnswers(): void {
    this.updateAnswersButton.addEventListener('click', () => {
      MCTManager.goToStage(StageIDENUM.Questions);
    });
  }

  private initFilterGroups(): void {
    const filterGroups = queryElements(`[${attr.components}="filter-group"]`, this.component) as HTMLElement[];
    this.filterGroups = filterGroups.map((el) => {
      return new FilterGroup(el, {
        onChange: () => this.handleChange(),
        groupName: 'filterGroup',
      });
    });
  }

  private saveFilterValues(): void {
    // Get all filter group values and merge them into MCTManager answers
    this.filterGroups.forEach((group) => {
      const value = group.getValue();
      const key = group.initialName;
      const name = group.finalName;

      // Only set the answer if we have a valid key, value and name
      if (key && value !== null && value !== undefined && name)
        MCTManager.setAnswer({
          key: key as AnswerKey,
          name: name as AnswerName,
          value: value as AnswerValue,
          source: 'user',
        });
    });
  }

  public handleChange(): void {
    this.saveFilterValues();
    this.handleProductsAPI();
  }

  private initAppointmentDialog(): void {
    const calculations = MCTManager.getCalculations();
    const { isProceedable } = calculations;

    isProceedable ? this.getFreeAdvice.style.removeProperty('display') : (this.getFreeAdvice.style.display = 'none');
    isProceedable ? (this.getADecision.style.display = 'none') : this.getADecision.style.removeProperty('display');
    if (this.applyDirect) this.applyDirect.style.display = 'none';

    this.appointmentDialogButton.addEventListener('click', () => this.appointmentDialog.showModal());
    this.appointmentDialogClose.addEventListener('click', () => {
      MCTManager.setMortgageId(null);
      this.product = null;
      this.appointmentDialog.close();
    });
    this.appointmentDialog.addEventListener('close', () => {
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
    if (!summaryLines) return;

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
        const propertyValue = MCTManager.getAnswer('PropertyValue') as number;
        const depositAmount = MCTManager.getAnswer('DepositAmount') as number;
        const ltv = ((propertyValue - depositAmount) / propertyValue) * 100;

        if (type === 'percentage') {
          if (ltv) output.textContent = formatNumber(ltv, { type: 'percent', decimals: 0 });
        } else if (type === 'progress-bar') {
          if (ltv) output.style.width = `${ltv}%`;
        }

        return;
      } else if (key === 'MortgageAmount') {
        const propertyValue = MCTManager.getAnswer('PropertyValue') as number;
        const depositAmount = MCTManager.getAnswer('DepositAmount') as number;
        const mortgageAmount = propertyValue - depositAmount;

        if (type === 'currency') {
          if (mortgageAmount) output.textContent = formatNumber(mortgageAmount, { type: 'currency' });
        }

        return;
      }

      if (type === 'sentence') {
        const text = summaryLines[key as keyof typeof summaryLines];
        if (text) output.innerHTML = text;
      } else if (type === 'currency') {
        const value = MCTManager.getAnswer(key as AnswerKey) as number;
        if (value) output.textContent = formatNumber(value, { type: 'currency' });
      } else if (type === 'percentage') {
        const value = MCTManager.getAnswer(key as AnswerKey) as number;
        if (value) output.textContent = formatNumber(value, { type: 'percent' });
      } else if (type === 'progress-bar') {
        const value = MCTManager.getAnswer(key as AnswerKey) as number;
        if (value) output.style.width = `${value}%`;
      }
    });
  }

  private renderFilters(): void {
    const answers = MCTManager.getAnswers();
    const filters = FILTERS_CONFIG;
    this.filterGroups.forEach((filterGroup) => {
      const answer = answers[filterGroup.initialName];
      const config = filters[filterGroup.initialName as keyof typeof filters];

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

    this.results = this.products.map((product) => {
      return new Result(this.resultsList, {
        template: this.resultsTemplate,
        product,
        onClick: (product) => this.handleProductCTA(product),
      });
    });

    this.renderResults(10);
    this.showListUI('empty', false);
  }

  private handleButtons(): void {
    this.getFreeAdviceButton.addEventListener('click', () => this.handleGetFreeAdvice());
    this.getADecisionButton.addEventListener('click', () => this.handleGetADecision());
    if (this.applyDirectLink) this.applyDirectLink.addEventListener('click', () => this.handleApplyDirect());
    this.paginationButton.addEventListener('click', () => this.renderResults(10));
  }

  private handleShowIfProceedable(): void {
    const calculations = MCTManager.getCalculations();
    const { isProceedable } = calculations;

    this.showIfProceedable.forEach((element) => {
      const showIfProceedable = element.getAttribute(attr.showIfProceedable) === 'true';
      if ((isProceedable && showIfProceedable) || (!isProceedable && !showIfProceedable))
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
    MCTManager.setMortgageId(product.ProductId);
    this.product = product;
    const { ApplyDirectLink } = product;

    if (this.applyDirect)
      ApplyDirectLink ? this.applyDirect.style.removeProperty('display') : (this.applyDirect.style.display = 'none');
    simulateEvent(this.appointmentDialogButton, 'click');
  }

  private async fetchProducts(): Promise<ProductsResponse | null> {
    const input = generateProductsAPIInput({
      numberOfResults: 100, // @TODO: Maximum of 100 on the test API?
      sortColumn: 1,
    });

    try {
      const response = await productsAPI.search(input);
      return response;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return null;
    }
  }

  private async handleProductsAPI() {
    this.showListUI('loader', true);
    this.showListUI('pagination', false);

    const response = await this.fetchProducts();
    if (!response) {
      this.showListUI('loader', false);
      return;
    }

    this.products = response.result.Products;
    this.summaryInfo = response.result.SummaryInfo;

    this.initiateResults();
    this.renderOutputs();
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
    const showResultsList = component === 'loader' || component === 'empty' ? !show : true;
    showResultsList ? this.resultsList.style.removeProperty('display') : (this.resultsList.style.display = 'none');
  }

  private handleGetFreeAdvice(): void {
    this.appointmentDialog.close();
    MCTManager.goToStage(StageIDENUM.Appointment);
  }

  private handleGetADecision(): void {
    window.location.href = 'https://www.landc.co.uk/online/mortgage-finder';
  }

  private async handleApplyDirect(): Promise<void> {
    if (!this.applyDirect) return;
    try {
      // Wait for the log user events API call to complete
      await this.handleLogUserEvents(true, this.product?.LenderName);

      const lender = this.product?.LenderName;
      const title = queryElement(
        `[${attr.components}="apply-direct-redirect-title"]`,
        this.applyDirectDialog
      ) as HTMLHeadingElement;
      title.textContent = `We're connecting you to ${lender}`;
      this.applyDirectDialog?.showModal();

      setTimeout(() => {
        window.location.href = this.product?.ApplyDirectLink || '';
      }, 3000);
    } catch (error) {
      console.error('Failed to log user events before redirect:', error);
      // Optionally, you could still redirect even if logging fails
      // Or handle the error differently based on your requirements
    }
  }

  private handleLogUserEvents(applyDirect: boolean, lender: string = ''): void {
    const eventName = applyDirect ? 'Direct_To_Lender' : 'Get_Free_Advice';
    const payload: LogUserEventCustom = {
      EventName: eventName,
      EventValue: lender,
      FieldName: eventName,
      FieldValue: lender,
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
