import { API_ENDPOINTS } from 'src/constants';
import type { APIResponse } from 'src/types';

import { isStaging } from '$utils/isStaging';
import { numberToCurrency } from '$utils/numberToCurrency';
import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';
import { setSearchParameter } from '$utils/setSearchParameter';

import type {
  BestBuyResult,
  Inputs,
  MortgageType,
  PropertyType,
  SchemePeriods,
  SchemePurpose,
  SchemeTypes,
  SortColumn,
} from './types';

const attr = 'data-mini';
const API_ENDPOINT = API_ENDPOINTS.productsTrigger;

export class HandleMini {
  component: HTMLDivElement;
  private values: Inputs;
  private rows: HTMLDivElement[];
  private loader: HTMLDivElement;
  private isLoading: boolean;
  private result?: BestBuyResult;

  constructor(component: HTMLDivElement) {
    this.component = component;
    this.values = this.getValues();
    this.rows = queryElements(`[${attr}-el="row"]`, component);
    this.loader = queryElement(`[${attr}-el="loader"]`, component) as HTMLDivElement;
    this.isLoading = true;
  }

  init(): void {
    this.handleAzureRequest();
  }

  private toggleLoading(success?: boolean): void {
    this.isLoading = !this.isLoading;
    if (this.isLoading) {
      this.loader.style.display = 'block';
    } else if (success) {
      this.loader.style.display = 'none';
    } else if (!success) {
      this.loader.style.display = 'none';
    }
  }

  private getValues(): Inputs {
    const PropertyValue = this.component.dataset.propertyvalue,
      RepaymentValue = this.component.dataset.repaymentvalue,
      PropertyType = this.component.dataset.propertytype as PropertyType,
      MortgageType = this.component.dataset.mortgagetype as MortgageType,
      InterestOnlyValue = this.component.dataset.interestonlyvalue,
      TermYears = this.component.dataset.termyears,
      SchemePurpose = this.component.dataset.schemepurpose as SchemePurpose,
      SchemePeriods = this.component.dataset.schemeperiods as string,
      SchemeTypes = this.component.dataset.schemetypes as string,
      Erc = this.component.dataset.erc,
      Offset = this.component.dataset.offset,
      SortColumn = this.component.dataset.sortcolumn as SortColumn,
      UseStaticApr = this.component.dataset.usestaticapr;

    function convertStringToArray<T>(string: string): T[] {
      // replace single quotes with double quotes to make it valid JSON
      const jsonString = string.replace(/'/g, '"');

      // Convert JSON string to an Array
      const array = JSON.parse(jsonString);
      return array;
    }

    const formattedValues: Inputs = {
      PropertyValue: PropertyValue ?? '250000',
      RepaymentValue: RepaymentValue ?? '125000',
      PropertyType: PropertyType ?? '1',
      MortgageType: MortgageType ?? '1',
      InterestOnlyValue: InterestOnlyValue ?? '0',
      TermYears: TermYears ?? '25',
      SchemePurpose: SchemePurpose ?? '1',
      SchemePeriods: convertStringToArray<SchemePeriods>(SchemePeriods) ?? ['1', '2', '3', '4'],
      SchemeTypes: convertStringToArray<SchemeTypes>(SchemeTypes) ?? ['1', '2'],
      NumberOfResults: '3',
      Features: {
        EarlyRepaymentCharge: Erc === 'true' ? false : true,
        Offset: Offset === 'true' ? true : false,
        NewBuild: false,
      },
      SortColumn: SortColumn ?? '1',
      UseStaticApr: UseStaticApr === 'true' ? true : false,
    };

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

    const body = JSON.stringify({ input: this.values });

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

  displayResults(): void {
    if (!this.result) return;

    this.result.data.forEach((item, index) => {
      const row = this.rows[index];
      const outputs = queryElements(`[${attr}-output]`, row) as HTMLDivElement[];

      outputs.forEach((output) => {
        const key = output.dataset.miniOutput;
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

      const button = queryElement('a', row) as HTMLLinkElement;
      setSearchParameter(button, [{ key: 'productId', value: item.ProductId as string }]);
    });
  }
}
