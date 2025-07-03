import { attr } from './constants';
import type {
  AnswerID,
  AnswerKey,
  AnswerValue,
  InputValue,
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
import { productsAPI } from '$mct/api';
import { simulateEvent } from '@finsweet/ts-utils';

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
  private summaryInfo: SummaryInfo | null = null;

  private header: HTMLDivElement;
  private outputs: HTMLDivElement[] = [];
  private filterGroups: FilterGroup[] = [];

  private appointmentDialogButton: HTMLButtonElement;
  private appointmentDialog: HTMLDialogElement;
  private appointmentDialogClose: HTMLButtonElement;

  private getFreeAdvice: HTMLElement;
  private getFreeAdviceButton: HTMLButtonElement;
  private getADecision: HTMLElement;
  private getADecisionButton: HTMLButtonElement;
  private applyDirect: HTMLElement;
  private applyDirectLink: HTMLLinkElement;

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
    this.applyDirect = queryElement(`[${attr.components}="apply-direct"]`, this.appointmentDialog) as HTMLElement;
    this.applyDirectLink = queryElement('a', this.applyDirect) as HTMLLinkElement;

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

    // // --- TEMP ---
    // // Answers will be saved from prior stage, just temporary to avoid inputting every time
    // Object.entries(EXAMPLE_ANSWERS).forEach(([key, value]) => {
    //   MCTManager.setAnswer(key as AnswerKey, value);
    // });
    // // --- END OF TEMP ---

    this.initFilterGroups();
    this.initAppointmentDialog();
    this.initListElements();
    this.renderOutputs();
    this.renderFilters();
    this.handleProductsAPI();

    // // Only auto-load products if explicitly requested or if autoLoad is true
    // if (options?.autoLoad === true) this.handleProductsAPI();

    this.handlePagination();
  }

  public show(): void {
    this.component.style.removeProperty('display');
  }

  public hide(): void {
    this.component.style.display = 'none';
  }

  private initFilterGroups(): void {
    const filterEls = queryElements(`[${attr.components}="filter-group"]`, this.component) as HTMLElement[];
    this.filterGroups = filterEls.map((el) => {
      return new FilterGroup(el, {
        onChange: () => this.handleChange(),
        groupName: 'filterGroup',
      });
    });
  }

  public handleChange(): void {
    // Get all filter group values and merge them into MCTManager answers
    this.filterGroups.forEach((group) => {
      const value = group.getValue();
      const name = group.name;
      const id = group.id;

      // Only set the answer if we have a valid name and value
      if (name && value !== null && value !== undefined && id)
        MCTManager.setAnswer({
          key: name as AnswerKey,
          id: id as AnswerID,
          value: value as AnswerValue,
          source: 'user',
        });
    });

    this.handleProductsAPI();
  }

  private initAppointmentDialog(): void {
    const answers = MCTManager.getAnswers();
    const { ReadinessToBuy } = answers;

    const proceedable = ReadinessToBuy === 'C' || ReadinessToBuy === 'D';
    proceedable ? this.getFreeAdvice.style.removeProperty('display') : (this.getFreeAdvice.style.display = 'none');
    proceedable ? (this.getADecision.style.display = 'none') : this.getADecision.style.removeProperty('display');
    this.applyDirect.style.display = 'none';

    this.appointmentDialogButton.addEventListener('click', () => this.appointmentDialog.showModal());
    this.appointmentDialogClose.addEventListener('click', () => this.appointmentDialog.close());
    this.appointmentDialog.addEventListener('close', () => (this.applyDirect.style.display = 'none'));
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
    this.filterGroups.forEach((filterGroup) => {
      const prefillValue = answers[filterGroup.name];
      if (prefillValue) filterGroup.setValue(prefillValue as InputValue);
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

  private handlePagination(): void {
    this.paginationButton.addEventListener('click', () => this.renderResults(10));
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
    const { ApplyDirectLink } = product;

    if (ApplyDirectLink) {
      this.applyDirect.style.removeProperty('display');
      this.applyDirectLink.href = ApplyDirectLink;
    } else {
      this.applyDirect.style.display = 'none';
    }

    simulateEvent(this.appointmentDialogButton, 'click');
  }

  private async fetchProducts(): Promise<ProductsResponse | null> {
    const input = generateProductsAPIInput(MCTManager.getAnswers(), {
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

    // Hide/Show the results list depending on the component being shown
    const showResultsList = component === 'loader' || component === 'empty' ? !show : show;
    showResultsList ? this.resultsList.style.removeProperty('display') : (this.resultsList.style.display = 'none');
  }
}
