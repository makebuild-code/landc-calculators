import type { APIResponse, Input } from 'src/types';

import { checkInputValidity } from '$utils/checkInputValidity';
import { formatInput } from '$utils/formatInput';
import { getInputValue } from '$utils/getInputValue';
import { isStaging } from '$utils/isStaging';
import { numberToCurrency } from '$utils/numberToCurrency';
import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';
import { setError } from '$utils/setError';

import type { BestBuyResult, Inputs, PropertyType, SortColumn } from './types';

const attr = 'data-bb';
const API_ENDPOINT = 'https://landc-website.azurewebsites.net/api/productshttptrigger';

export class HandleTable {
  component: HTMLDivElement;
  private template: HTMLDivElement;
  private clone: HTMLDivElement;
  private inputs: Input[];
  private conditionals: HTMLDivElement[];
  // private outputs: Outputs;
  private buttons: HTMLButtonElement[];
  private resultsList: HTMLDivElement;
  private loading: HTMLDivElement;
  private noResults: HTMLDivElement;
  private isLoading: boolean;
  private result?: BestBuyResult;

  constructor(component: HTMLDivElement) {
    this.component = component;
    this.template = queryElement(`[${attr}-el="template"]`, component) as HTMLDivElement;
    this.clone = this.template.cloneNode(true) as HTMLDivElement;
    this.clone.removeAttribute('data-bb-el');
    this.inputs = queryElements(`[data-input], input, select`, component);
    this.conditionals = queryElements(`[data-conditions]`, component);
    this.buttons = queryElements(`[${attr}-el="button"]`, component);
    this.resultsList = queryElement(`[${attr}-el="results-list"]`) as HTMLDivElement;
    this.loading = queryElement(`[${attr}-el="loading"]`, component) as HTMLDivElement;
    this.noResults = queryElement(`[${attr}-el="no-results"]`, component) as HTMLDivElement;
    this.isLoading = false;
  }

  init(): void {
    this.bindEvents();
  }

  private bindEvents(): void {
    this.inputs.forEach((input) => {
      input.addEventListener('change', () => {
        formatInput(input);
        this.validateInput(input);
      });
    });

    this.isLoading = true;
    this.conditionalVisibility();
    this.handleAzureRequest();

    this.buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const valid = this.validateInputs();
        if (!valid) return;
        this.toggleLoading();
        this.handleAzureRequest();
      });
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
    this.isLoading = !this.isLoading;
    if (this.isLoading) {
      this.loading.style.display = 'block';
      this.noResults.style.display = 'none';
      this.resultsList.style.display = 'none';
    } else if (success) {
      this.loading.style.display = 'none';
      this.noResults.style.display = 'none';
      this.resultsList.style.display = 'flex';
    } else if (!success) {
      this.loading.style.display = 'none';
      this.noResults.style.display = 'flex';
      this.resultsList.style.display = 'none';
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
      NumberOfResults: '50',
      Features: {
        Erc: preFormattedValues.Erc as boolean,
        Offset: preFormattedValues.Offset as boolean,
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

    return formattedValues;
  }

  private async handleAzureRequest(): Promise<void> {
    if (isStaging) {
      console.groupCollapsed('API Call');
      console.time('API Request');
    }

    try {
      const result = await this.makeAzureRequest();
      this.result = result.result as unknown as BestBuyResult;
      if (isStaging) console.log(result);
      if (
        !this.result ||
        this.result === null ||
        !this.result.success ||
        this.result.data.length === 0
      ) {
        this.toggleLoading(false);
      } else {
        this.displayResults();
        this.toggleLoading(true);
      }
    } catch (error) {
      console.error('Error retrieving calculation', error);
      this.toggleLoading(false);
    }

    if (isStaging) {
      console.timeEnd('API Request');
      console.groupEnd();
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

  private displayResults(): void {
    this.clearResults();
    if (!this.result) return;

    this.result.data.forEach((item) => {
      const clone = this.clone.cloneNode(true) as HTMLDivElement;
      clone.style.removeProperty('display');

      const outputs = queryElements(`[${attr}-output]`, clone) as HTMLDivElement[];
      outputs.forEach((output) => {
        const key = output.dataset.bbOutput;
        if (!key) return;

        const value = item[key];
        if (value === 0 || item[key]) {
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

      this.resultsList.appendChild(clone);
    });
  }
}
