import { attr } from './constants';
import type { OutputType, ResultsOptions } from './types';
import type { Product, ProductsRequest, ProductsResponse, SummaryInfo } from 'src/mct/shared/api/types/fetchProducts';
import { MCTManager } from 'src/mct/shared/MCTManager';
import { formatNumber } from 'src/utils/formatNumber';
import type { AnswerKey, AnswerValue, StageID } from 'src/mct/shared/types';
import { Result } from './Result';
import { EXAMPLE_PRODUCTS_RESPONSE } from 'src/mct/shared/examples/exampleProductsResponse';
import { EXAMPLE_ANSWERS } from 'src/mct/shared/examples/exampleAnswers';
import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';
import { generateSummaryLines } from 'src/mct/shared/utils/generateSummaryLines';
import { FilterGroup } from './FilterGroup';
import type { InputValue } from '../form/types';
import { generateProductsAPIInput } from 'src/mct/shared/utils/generateProductsAPIInput';
import { fetchProducts } from 'src/mct/shared/api/fetchProducts';

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

const DEFAULT_OPTIONS: ResultsOptions = {
  // prefill: false,
  // autoLoad: true,
  // numberOfResults: 3,
  // showSummary: true,
  // showLenders: true,
  // showDetails: true,
  // onError: (err) => console.error(err),
};

export class ResultsManager {
  private component: HTMLElement;
  public id: StageID;
  private isInitialised: boolean = false;

  private products: Product[];
  private summaryInfo: SummaryInfo;

  private header: HTMLDivElement;
  private outputs: HTMLDivElement[] = [];
  private filterGroups: FilterGroup[] = [];

  private results: Result[] = [];
  private resultsList: HTMLElement;
  private resultsTemplate: HTMLElement;

  private loader: HTMLElement;
  private empty: HTMLElement;
  private pagination: HTMLElement;
  private paginationButton: HTMLButtonElement;

  constructor(component: HTMLElement) {
    this.component = component;
    this.id = 'results';

    // Update: get response from fetchProducts API and save to state
    const response = EXAMPLE_PRODUCTS_RESPONSE;
    this.products = response.result.Products as Product[];
    this.summaryInfo = response.result.SummaryInfo;

    this.header = queryElement(`[${attr.components}="header"]`, this.component) as HTMLDivElement;
    this.outputs = queryElements(`[${attr.output}]`, this.header) as HTMLDivElement[];

    this.resultsList = queryElement(`[${attr.components}="list"]`, this.component) as HTMLDivElement;
    this.resultsTemplate = queryElement(`[${attr.components}="template"]`, this.component) as HTMLDivElement;
    this.resultsTemplate.remove();

    this.loader = queryElement(`[${attr.components}="loader"]`, this.component) as HTMLElement;
    this.empty = queryElement(`[${attr.components}="empty"]`, this.component) as HTMLElement;
    this.pagination = queryElement(`[${attr.components}="pagination"]`, this.component) as HTMLElement;
    this.paginationButton = queryElement('button', this.pagination) as HTMLButtonElement;
  }

  public init(): void {
    if (this.isInitialised) return;
    this.isInitialised = true;

    // --- TEMP ---
    // Answers will be saved from prior stage, just temporary to avoid inputting every time
    Object.entries(EXAMPLE_ANSWERS).forEach(([key, value]) => {
      MCTManager.setAnswer(key as AnswerKey, value);
    });
    // --- END OF TEMP ---

    this.initFilterGroups();
    this.initListElements();
    this.renderOutputs();
    this.renderFilters();
    this.handleProductsAPI();
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

      // Only set the answer if we have a valid name and value
      if (name && value !== null && value !== undefined) MCTManager.setAnswer(name as AnswerKey, value as AnswerValue);
    });

    this.handleProductsAPI();
  }

  private initListElements(): void {
    this.loader.style.display = 'none';
    this.empty.style.display = 'none';
    this.pagination.style.display = 'none';
  }

  private renderOutputs(): void {
    const summaryLines = generateSummaryLines(this.summaryInfo, MCTManager.getAnswers());
    if (!summaryLines) return;

    this.outputs.forEach((output) => {
      const key = output.getAttribute(attr.output);
      const type = output.getAttribute(attr.type) as OutputType;

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
        console.log(key, type, value);
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

  private renderResults(): void {
    this.results.forEach((result) => result.remove());

    const numberOfResults = this.products.length;
    if (numberOfResults === 0) {
      this.showListUI('empty', true);
      return;
    }

    this.showListUI('empty', false);
    this.results = this.products.map((product) => {
      return new Result(this.resultsList, { template: this.resultsTemplate, product });
    });
  }

  private async fetchProducts(): Promise<ProductsResponse | null> {
    const input = generateProductsAPIInput(MCTManager.getAnswers(), {
      numberOfResults: 100, // @TODO: Maximum of 100 on the test API?
      sortColumn: 1,
    });

    try {
      const response = await fetchProducts(input);
      return response;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return null;
    }
  }

  private async handleProductsAPI() {
    console.log('handleProductsAPI');
    this.showListUI('loader', true);

    const response = await this.fetchProducts();
    if (!response) {
      this.showListUI('loader', false);
      return;
    }

    this.products = response.result.Products;
    this.summaryInfo = response.result.SummaryInfo;

    const SapValues = this.products.map((product) => product.SAP);
    console.log(SapValues);

    console.log(this.products);
    console.log(this.summaryInfo);

    this.renderResults();
    this.renderOutputs();
    this.showListUI('loader', false);
  }

  private showListUI(component: 'loader' | 'empty', show?: boolean): void {
    const componentEl = component === 'loader' ? this.loader : this.empty;
    show ? componentEl.style.removeProperty('display') : (componentEl.style.display = 'none');
    show ? (this.resultsList.style.display = 'none') : this.resultsList.style.removeProperty('display');
  }

  // public async loadAndRenderResults() {
  //   const request = this.buildProductsRequest();
  //   console.log(request);
  //   if (!request) return;
  //   try {
  //     // this.products = await fetchProducts(MCTManager.getAnswers());
  //     console.log('Products API response:', this.products);
  //     this.renderAllTemplates();
  //   } catch (error) {
  //     this.renderError(error);
  //     // if (this.options.onError) this.options.onError(error);
  //   }
  // }

  // private renderAllTemplates() {
  //   if (!this.products) return;
  //   const data: ResultsData[] = [];
  //   if (this.options.showSummary) {
  //     data.push({ key: 'summary', value: this.renderSummary() });
  //   }
  //   if (this.options.showLenders) {
  //     data.push({ key: 'lenders', value: this.renderLenders() });
  //   }
  //   if (this.options.showDetails) {
  //     data.push({ key: 'details', value: this.renderDetails() });
  //   }
  //   this.setResultsData(data);
  // }

  // private renderSummary(): string {
  //   if (!this.products) return '';
  //   const req = this.buildProductsRequest();
  //   if (!req) return '';
  //   const { RepaymentValue, TermYears, SchemePeriods, SchemeTypes } = req;
  //   const answers = MCTManager.getAnswers();
  //   const RepaymentType = answers.RepaymentType;
  //   const RepaymentValueText = formatNumber(RepaymentValue, { currency: true });
  //   const TermYearsText = `${TermYears} years`;
  //   const RepaymentTypeText =
  //     RepaymentType === 'R' ? 'repayment' : RepaymentType === 'I' ? 'interest only' : 'part repayment part interest';
  //   const SchemeTypesMap = (SchemeTypes as (1 | 2)[]).map((type) => (type === 1 ? 'fixed' : 'variable'));
  //   const SchemePeriodsMap = (SchemePeriods as (1 | 2 | 3 | 4)[]).map((period) =>
  //     period === 1 ? '2' : period === 2 ? '3' : period === 3 ? '5' : '5+'
  //   );
  //   const SchemePeriodsText =
  //     SchemePeriodsMap.length === 1
  //       ? `${SchemePeriodsMap[0]} year`
  //       : SchemePeriodsMap.length > 1
  //         ? `${SchemePeriodsMap[0]}-${SchemePeriodsMap[SchemePeriodsMap.length - 1]} year`
  //         : '';
  //   const SchemeTypesText =
  //     SchemeTypesMap.length === 1
  //       ? `${SchemeTypesMap[0]} rate`
  //       : SchemeTypesMap.length > 1
  //         ? `${SchemeTypesMap[0]} or ${SchemeTypesMap[1]} rate`
  //         : '';
  //   return `Looks like you want to borrow <span class="${classes.highlight}">${RepaymentValueText}</span> over <span class="${classes.highlight}">${TermYearsText}</span> with a <span class="${classes.highlight}">${SchemePeriodsText} ${SchemeTypesText} ${RepaymentTypeText}</span> mortgage`;
  // }

  // private renderLenders(): string {
  //   if (!this.products) return '';
  //   const info = this.products.result.SummaryInfo;
  //   return `We've found <span class="${classes.highlight}">${info.NumberOfProducts}</span> products for you across <span class="${classes.highlight}">${info.NumberOfLenders}</span> lenders.`;
  // }

  // private renderDetails(): string {
  //   if (!this.products) return '';
  //   const products = this.products.result.Products;
  //   if (!products || products.length === 0) return '<p>No products found.</p>';
  //   const rows = products
  //     .slice(0, this.options.numberOfResults)
  //     .map(
  //       (p) =>
  //         `<tr>
  //       <td>${p.LenderName}</td>
  //       <td>${formatNumber(p.Rate, { fallback: '-' })}%</td>
  //       <td>${formatNumber(p.PMT, { currency: true, fallback: '-' })}</td>
  //       <td>${formatNumber(p.AnnualCost, { currency: true, fallback: '-' })}</td>
  //       <td>${formatNumber(p.LTV, { fallback: '-' })}%</td>
  //     </tr>`
  //     )
  //     .join('');
  //   return `<table class="mct-results-table">
  //     <thead><tr><th>Lender</th><th>Rate</th><th>Monthly</th><th>Annual Cost</th><th>LTV</th></tr></thead>
  //     <tbody>${rows}</tbody>
  //   </table>`;
  // }

  // private renderError(error: unknown) {
  //   this.setResultsData([
  //     { key: 'summary', value: '<span class="error">Failed to load results.</span>' },
  //     { key: 'lenders', value: '' },
  //     { key: 'details', value: '' },
  //   ]);
  // }

  // public setResultsData(data: ResultsData[]) {
  //   this.resultsData = data;
  //   this.displayResults();
  // }

  // private displayResults() {
  //   this.resultsData.forEach((data) => {
  //     const el = this.component.querySelector(`[${attr.output}="${data.key}"]`);
  //     if (el) {
  //       el.innerHTML = data.value;
  //     }
  //   });
  // }
}
