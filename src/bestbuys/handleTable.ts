import { simulateEvent } from '@finsweet/ts-utils';
import { dialogs } from 'src/components/dialogs';
import { API_ENDPOINTS } from 'src/constants';
import type { APIResponse, Input } from 'src/types';

import { checkInputValidity, formatInput, getInputValue, setError } from '$utils/input';
import { isStaging } from '$utils/environment';
import { numberToCurrency } from '$utils/formatting';
import { queryElement, queryElements } from '$utils/dom';
import { setSearchParameter } from '$utils/storage';

import type { BestBuyResult, Inputs, PropertyType, SortColumn } from './types';

const attr = 'data-bb';
const API_ENDPOINT = API_ENDPOINTS.productsTrigger;

export class HandleTable {
  component: HTMLDivElement;
  private template: HTMLDivElement;
  private trigger: 'onload' | 'onclick' = 'onload';
  private clone: HTMLDivElement;
  private inputs: Input[];
  private conditionals: HTMLDivElement[];
  private sort: HTMLSelectElement;
  private buttons: HTMLButtonElement[];
  private resultsList: HTMLDivElement;
  private loading: HTMLDivElement;
  private noResults: HTMLDivElement;
  private isLoading: boolean;
  private loadMoreWrapper: HTMLDivElement;
  private loadMore: HTMLButtonElement;
  private scaffoldWrapper: HTMLDivElement;
  private scaffoldCover: HTMLDivElement;
  private scaffoldResult: HTMLDivElement;
  private removeScaffold: boolean = true;
  private numberOfResultsShown: number;
  private productId: string | null;
  private formattedValues: Inputs;
  private result?: BestBuyResult;

  constructor(component: HTMLDivElement) {
    this.component = component;
    this.trigger = component.dataset.bbTrigger === 'onclick' ? 'onclick' : 'onload';
    this.template = queryElement(`[${attr}-el="template"]`, component) as HTMLDivElement;
    this.clone = this.template.cloneNode(true) as HTMLDivElement;
    this.clone.removeAttribute('data-bb-el');
    this.inputs = queryElements(`[data-input], input, select`, component);
    this.conditionals = queryElements(`[data-conditions]`, component);
    this.buttons = queryElements(`[${attr}-el="button"]`, component);
    this.sort = queryElement(`[data-input="SortColumn"]`, component) as HTMLSelectElement;
    this.resultsList = queryElement(`[${attr}-el="results-list"]`) as HTMLDivElement;
    this.loading = queryElement(`[${attr}-el="loading"]`, component) as HTMLDivElement;
    this.noResults = queryElement(`[${attr}-el="no-results"]`, component) as HTMLDivElement;
    this.isLoading = false;
    this.loadMoreWrapper = queryElement(`[${attr}-el="load-more"]`, component) as HTMLDivElement;
    this.loadMore = queryElement('button', this.loadMoreWrapper) as HTMLButtonElement;
    this.scaffoldWrapper = queryElement(`[${attr}-el="scaffold-wrapper"]`, component) as HTMLDivElement;
    this.scaffoldCover = queryElement(`[${attr}-el="scaffold-cover"]`, this.scaffoldWrapper) as HTMLDivElement;
    this.scaffoldResult = queryElement(`[${attr}-el="scaffold-result"]`, this.scaffoldWrapper) as HTMLDivElement;
    this.numberOfResultsShown = 0;

    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    this.productId = params.get('productId') ?? null;
    this.formattedValues = this.getValues();
  }

  private hideScaffold(): void {
    this.scaffoldWrapper.classList.remove(...this.scaffoldWrapper.classList);
    this.scaffoldCover.remove();
    this.scaffoldResult.remove();
  }

  async init(): Promise<void> {
    this.conditionalVisibility();
    if (this.trigger === 'onload') {
      this.isLoading = true;
      if (this.productId) this.scrollIntoView();
      await this.handleAzureRequest();
      if (this.productId) this.scrollIntoView(this.productId);
    } else if (this.trigger === 'onclick') {
      this.loading.style.display = 'none';
      this.noResults.style.display = 'none';
      this.resultsList.style.display = 'none';
      this.loadMoreWrapper.style.display = 'none';
    }

    this.bindEvents();
  }

  private bindEvents(): void {
    this.inputs.forEach((input) => {
      input.addEventListener('change', () => {
        formatInput(input);
        this.validateInput(input);
      });
    });

    this.buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const valid = this.validateInputs();
        if (!valid) return;
        this.toggleLoading();
        this.numberOfResultsShown = 0;
        this.handleAzureRequest();
      });
    });

    this.sort.addEventListener('change', () => {
      const valid = this.validateInputs();
      if (!valid) return;
      this.toggleLoading();
      this.numberOfResultsShown = 0;
      this.handleAzureRequest();
    });

    this.loadMore.addEventListener('click', () => {
      this.displayResults(this.numberOfResultsShown, 10);
    });
  }

  private validateInput(input: Input): boolean {
    const validity = checkInputValidity(input);

    if (!validity.error) {
      setError(input);
    } else {
      setError(input, validity.error);
    }

    return validity.isValid;
  }

  private validateInputs(): boolean {
    return this.inputs.every((input) => {
      return this.validateInput(input);
    });
  }

  private conditionalVisibility(): void {
    this.conditionals.forEach((item) => {
      const { conditions } = item.dataset;
      if (!conditions) return;

      const parsedConditions = JSON.parse(conditions);

      const input = this.inputs.find((input) => input.dataset.input === parsedConditions.dependsOn);
      if (!input) return;

      let conditionsMet = false;

      switch (parsedConditions.operator) {
        case 'equal':
          conditionsMet = getInputValue(input) === parsedConditions.value;
          break;
        case 'notequal':
          conditionsMet = getInputValue(input) !== parsedConditions.value;
          break;
      }

      const itemInput = queryElement('[data-input]', item) as Input;
      itemInput.dataset.conditionsmet = conditionsMet.toString();
      item.style.display = conditionsMet ? 'block' : 'none';

      input.addEventListener('change', () => {
        switch (parsedConditions.operator) {
          case 'equal':
            conditionsMet = getInputValue(input) === parsedConditions.value;
            break;
          case 'notequal':
            conditionsMet = getInputValue(input) !== parsedConditions.value;
            break;
        }

        itemInput.dataset.conditionsmet = conditionsMet.toString();
        item.style.display = conditionsMet ? 'block' : 'none';
      });
    });
  }

  private toggleLoading(success?: boolean): void {
    if (this.removeScaffold) {
      this.hideScaffold();
      this.removeScaffold = false;
    }
    this.isLoading = !this.isLoading;
    if (this.isLoading) {
      this.loading.style.display = 'block';
      this.noResults.style.display = 'none';
      this.resultsList.style.display = 'none';
      this.loadMoreWrapper.style.display = 'none';
    } else if (success) {
      this.loading.style.display = 'none';
      this.noResults.style.display = 'none';
      this.resultsList.style.display = 'flex';
      this.loadMoreWrapper.style.display = 'flex';
    } else if (!success) {
      this.loading.style.display = 'none';
      this.noResults.style.display = 'flex';
      this.resultsList.style.display = 'none';
      this.loadMoreWrapper.style.display = 'none';
    }
  }

  private getValues(): Inputs {
    const preFormattedValues: { [key: string]: string | boolean } = {};
    this.inputs.forEach((input) => {
      if (input.dataset.conditionsmet && input.dataset.conditionsmet === 'false') return;
      const key = input.dataset.input;
      const value = getInputValue(input);

      if (!key || !value) return;

      preFormattedValues[key] = value;
    });

    const formattedValues: Inputs = {
      PropertyValue: preFormattedValues.PropertyValue as string,
      RepaymentValue: preFormattedValues.RepaymentValue as string,
      PropertyType: preFormattedValues.PropertyType as PropertyType,
      MortgageType: preFormattedValues.MortgageType === 'Residential' ? '1' : '2',
      InterestOnlyValue: preFormattedValues.InterestOnlyValue as string,
      TermYears: preFormattedValues.TermYears as string,
      SchemePurpose: preFormattedValues.SchemePurpose === 'Purchase' ? '1' : '2',
      SchemePeriods: [],
      SchemeTypes: [],
      NumberOfResults: '100',
      Features: {
        EarlyRepaymentCharge: preFormattedValues.Erc as boolean,
        Offset: preFormattedValues.Offset as boolean,
        NewBuild: preFormattedValues.NewBuild as boolean,
      },
      SortColumn: preFormattedValues.SortColumn as SortColumn,
      UseStaticApr: false,
    };

    if (preFormattedValues.ShowAsTwoYear) formattedValues.SchemePeriods.push('1');
    if (preFormattedValues.ShowAsThreeYear) formattedValues.SchemePeriods.push('2');
    if (preFormattedValues.ShowAsFiveYear) formattedValues.SchemePeriods.push('3');
    if (preFormattedValues.ShowAsLongTerm) formattedValues.SchemePeriods.push('4');

    if (preFormattedValues.ShowAsFix) formattedValues.SchemeTypes.push('1');
    if (preFormattedValues.ShowAsVar) formattedValues.SchemeTypes.push('2');

    this.formattedValues = formattedValues;

    return formattedValues;
  }

  private async handleAzureRequest(): Promise<void> {
    if (isStaging) {
      console.groupCollapsed('API Call');
      console.time('API Request');
      console.log(this);
    }

    try {
      const result = await this.makeAzureRequest();
      this.result = result.result as unknown as BestBuyResult;
      if (isStaging) console.log(result);
      if (!this.result || this.result === null || !this.result.success || this.result.data.length === 0) {
        this.toggleLoading(false);
      } else {
        this.clearResults();
        this.displayResults(0, 10);
        this.toggleLoading(true);
      }
    } catch (error) {
      console.error('Error retrieving calculation', error);
      this.toggleLoading(false);
    }

    if (isStaging) {
      console.timeEnd('API Request');
      console.groupEnd();
      console.log(this);
    }
  }

  private async makeAzureRequest(): Promise<APIResponse> {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    const body = JSON.stringify({ input: this.getValues() });

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    return response.json();
  }

  private clearResults(): void {
    this.resultsList.innerHTML = '';
  }

  private displayResults(startIndex: number, show: number): void {
    if (!this.result) return;

    this.result.data.forEach((item, index) => {
      if (index < startIndex || index > startIndex + show - 1) return;

      const clone = this.clone.cloneNode(true) as HTMLDivElement;
      clone.style.removeProperty('display');
      clone.setAttribute('data-productId', item.ProductId);

      const outputs = queryElements(`[${attr}-output]`, clone) as HTMLDivElement[];
      outputs.forEach((output) => {
        const key = output.dataset.bbOutput;
        if (!key) return;

        const value = item[key];
        if (value === 0 || value === '' || item[key]) {
          if (typeof value === 'number') {
            output.textContent = numberToCurrency(value);
          } else if (output.nodeName === 'IMG' && output instanceof HTMLImageElement) {
            output.src = value as string;
          } else {
            output.textContent = value as string;
          }
        }
      });

      const moreToggle = queryElement(`[${attr}-el="more-toggle"]`, clone);
      const moreText = queryElement(`[${attr}-el="more-text"]`, clone);
      const moreIcon = queryElement(`[${attr}-el="more-icon"]`, clone);
      const moreContent = queryElement(`[${attr}-el="more-content"]`, clone);

      if (moreToggle && moreText && moreIcon && moreContent) {
        let isOpen = false;

        moreToggle.addEventListener('click', () => {
          moreText.textContent = isOpen ? 'More info' : 'Less info';
          moreIcon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(45deg)';
          moreContent.style.display = isOpen ? 'none' : 'block';

          isOpen = !isOpen;
        });
      }

      const button = queryElement('.button', clone) as HTMLLinkElement;
      if (button) {
        setSearchParameter(button, [
          {
            key: 'purchaseOrRemortgage',
            value: this.formattedValues.SchemePurpose === '1' ? 'p' : 'r',
          },
          {
            key: 'residentialOrBuyToLet',
            value: this.formattedValues.MortgageType === '1' ? 'r' : 'b',
          },
        ]);
      }

      this.resultsList.appendChild(clone);
    });

    this.numberOfResultsShown += show;

    if (this.numberOfResultsShown < this.result.data.length) {
      this.loadMoreWrapper.style.display = 'flex';
    } else {
      this.loadMoreWrapper.style.removeProperty('display');
    }

    dialogs();
  }

  private scrollIntoView(productId?: string): void {
    let component;

    if (!productId) {
      component = queryElement('.best-buy_main');
    } else {
      component = queryElement(`.bb-result_component[data-productId="${productId}"]`, this.resultsList);
      const moreToggle = queryElement(`[${attr}-el="more-toggle"]`, component);
      if (!moreToggle) return;
      simulateEvent(moreToggle, 'click');
    }

    if (!component) return;

    component.scrollIntoView({ behavior: 'instant' });
    window.scrollBy(0, -32);
  }
}
