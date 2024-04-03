import { cloneNode } from '@finsweet/ts-utils';
import type { BasicObject } from 'src/calculators/handleCalculator';
import type { APIResponse, Input } from 'src/types';

import { getInputValue } from '$utils/getInputValue';
import { isStaging } from '$utils/isStaging';
import { numberToCurrency } from '$utils/numberToCurrency';
import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

type PropertyType = '1' | '2';
type MortgageType = '1' | '2';
type SchemePurpose = '1' | '2';
type SchemePeriods = '1' | '2' | '3' | '4';
type SchemeTypes = '1' | '2';
type SortColumn = '1' | '2' | '3' | '4' | '5' | '6';

interface Inputs {
  PropertyValue: string; // Market value of property
  PropertyType: PropertyType; // 1 for house; 2 for flat
  MortgageType: MortgageType; // 1 for Residential; 2 for Buy to Let
  RepaymentValue: string; // Repayment amount
  InterestOnlyValue: string; // Interest only value
  TermYears: string; // Mortgage term in whole years
  SchemePurpose: SchemePurpose; // Mortgage purpose - 1 for Purchase; 2 for Remortgage
  SchemePeriods: SchemePeriods[]; // Array of mortgage scheme durations to include one or more options
  SchemeTypes: SchemeTypes[]; // Array of scheme types to include. Fixed (1); Variable (2)
  NumberOfResults: string; // Total number of products to return. Defaults to 10.
  Features: {
    Erc: boolean;
    Offset: boolean;
  }; // Any additional product features to include or use
  SortColumn: SortColumn; // Numeric representations for sort columns
  UseStaticApr: boolean; // Indicating whether to use a static APR (driven from the database).
}

interface Outputs {
  ProductId: number;
  LenderName: string;
  LenderURL: URL;
  ProductSchemeFriendlyName: string;
  Rate: number;
  FollowOnRate: string;
  PMT: number;
  FutureValue: number;
  FutureMonthlyPayment: number;
  TotalFees: number;
  AnnualCost: number;
  ApplicationFee: number;
  CompletionFee: number;
  ValuationFee: number;
  OtherFees: number;
  Cashback: number;
  BrokerFee: number;
  OverpaymentLimit: string;
  ERC: string;
  ERCText: string;
  ExitFee: number;
  Legals: string;
  MinimumMortgageAmount: number;
  MaximumMortgageAmount: number;
  LTV: number;
  APR: number;
  FollowOnRateValue: number;
  SchemeLength: number;
  SchemeTypeRefId: number;
  IsRemortgage: boolean;
  RepresentativeExample: string;
}

export interface Result {
  [key: string]: string | number | BasicObject[];
}

const attr = 'data-bb';
const API_ENDPOINT = 'https://landc-website.azurewebsites.net/api/productshttptrigger';

export class HandleTable {
  component: HTMLDivElement;
  private template: HTMLDivElement;
  private clone: HTMLDivElement;
  private list: HTMLDivElement;
  private inputs: Input[];
  private conditionals: HTMLDivElement[];
  // private outputs: Outputs;
  private buttons: HTMLButtonElement[];
  private isLoading: boolean;
  private result?: Result;

  constructor(component: HTMLDivElement) {
    this.component = component;
    this.template = queryElement(`[${attr}-el="template"]`, component) as HTMLDivElement;
    this.clone = this.template.cloneNode(true) as HTMLDivElement;
    this.list = this.template.parentElement as HTMLDivElement;
    // this.template.remove();
    this.inputs = queryElements(`[data-input], input, select`, component);
    this.conditionals = queryElements(`[data-conditions]`, component);
    this.buttons = queryElements(`[${attr}-el="button"]`, component);
    this.isLoading = false;
  }

  init(): void {
    console.log(this.inputs);
    console.log(this.conditionals);

    this.bindEvents();
  }

  bindEvents(): void {
    this.conditionalVisibility();
    this.handleAzureRequest();
    this.buttons.forEach((button) => {
      button.addEventListener('click', () => {
        this.handleAzureRequest();
      });
    });
  }

  conditionalVisibility(): void {
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

  getValues(): Inputs {
    console.log('get values');
    const preFormattedValues: { [key: string]: string | boolean } = {};
    this.inputs.forEach((input) => {
      if (input.dataset.conditionsmet && input.dataset.conditionsmet === 'false') {
        console.log('conditions not met');
        console.log(input);
        return;
      }
      const key = input.dataset.input;
      const value = getInputValue(input);

      if (!key || !value) return;

      preFormattedValues[key] = value;
    });

    const formattedValues: Inputs = {
      PropertyValue: preFormattedValues.PropertyValue as string,
      RepaymentValue: preFormattedValues.RepaymentValue as string,
      PropertyType: preFormattedValues.PropertyType as PropertyType,
      MortgageType: preFormattedValues.MortgageType as MortgageType,
      InterestOnlyValue: preFormattedValues.InterestOnlyValue as string,
      TermYears: preFormattedValues.TermYears as string,
      SchemePurpose: preFormattedValues.SchemePurpose as SchemePurpose,
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
      this.result = result.result;
      if (isStaging) console.log(result);
      // this.toggleLoading(true);
      this.displayResults(result.result);
    } catch (error) {
      console.error('Error retrieving calculation', error);
      // this.toggleLoading(false);
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

  clearResults(): void {
    this.list.innerHTML = '';
  }

  displayResults(result: Result): void {
    this.result = result;

    this.clearResults();

    result.data.forEach((item) => {
      const clone = this.clone.cloneNode(true) as HTMLDivElement;
      clone.style.removeProperty('display');

      const outputs = queryElements(`[${attr}-output]`, clone) as HTMLDivElement[];
      outputs.forEach((output) => {
        const key = output.dataset.bbOutput;
        if (!key) return;

        const value = item[key];
        console.log(output);
        if (value === 0 || item[key]) {
          if (typeof value === 'number') {
            output.textContent = numberToCurrency(value);
          } else if (output.nodeName === 'IMG') {
            console.log(output);
            output.src = value;
          } else {
            console.log('else');
            output.textContent = value;
          }
        }
      });

      this.list.appendChild(clone);
    });
  }
}
