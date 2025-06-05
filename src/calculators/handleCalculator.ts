import type { APIResponse, BasicObject, Result } from 'src/types';

import { handleEnterInInputs } from '$utils/handleEnterInInputs';
import { isStaging } from '$utils/getEnvironment';
import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import { type CalculatorConfig, calculatorConfig } from './calculatorConfig';
import { HandleInputs } from './handleInputs';
import { HandleOutputs } from './handleOutputs';
import { API_ENDPOINTS } from 'src/constants';
import { syncSlider } from '$utils/syncSlider';

const attr = 'data-calc';
const API_ENDPOINT = API_ENDPOINTS.calculatorTrigger;
const API_ENDPOINT_PRODUCT = API_ENDPOINTS.productsTrigger;

export class HandleCalculator {
  name: string;
  component: HTMLDivElement;
  config: CalculatorConfig;
  inputs: HandleInputs;
  private outputs: HandleOutputs;
  private conditionals: HTMLElement[];
  private button: HTMLButtonElement;
  private buttonText: HTMLDivElement;
  private buttonLoader: HTMLDivElement;
  private isLoading: boolean;
  private result?: Result;
  private isSyncing: boolean;

  constructor(component: HTMLDivElement) {
    this.name = component.dataset.calc as string;
    this.component = component;
    this.config = calculatorConfig[this.name];
    this.inputs = new HandleInputs(this);
    this.outputs = new HandleOutputs(this);
    this.conditionals = queryElements(`[data-condition]`, this.component);
    this.button = queryElement(`[${attr}-el="button"]`, this.component) as HTMLButtonElement;
    this.buttonText = queryElement(`[${attr}-el="button-text"]`, this.button) as HTMLDivElement;
    this.buttonLoader = queryElement(`[${attr}-el="button-loader"]`, this.button) as HTMLDivElement;
    this.isLoading = false;
    this.isSyncing = false;
  }

  init(): void {
    this.inputs.init();
    if (isStaging) {
      this.inputs.check();
      this.outputs.check();
      console.groupEnd();
    }

    this.bindEvents();
  }

  private bindEvents(): void {
    this.inputs.all.forEach((input) => {
      handleEnterInInputs(input, () => {
        this.submit();
      });
    });

    this.button.addEventListener('click', () => {
      this.submit();
    });
  }

  submit(): void {
    this.toggleLoading();
    const isValid = this.inputs.validateInputs();
    const allPresent = this.inputs.check();
    // cancel if inputs are invalid or not all present
    if (!isValid || !allPresent) {
      if (isStaging) console.log('inputs not valid or not all present');
      this.toggleLoading(false);
      return;
    }
    this.handleAzureRequest();
  }

  private toggleLoading(success?: boolean): void {
    this.isLoading = !this.isLoading;
    if (this.isLoading) {
      this.buttonText.style.opacity = '0';
      this.buttonLoader.style.opacity = '1';
    } else if (success) {
      this.buttonText.textContent = 'Recalculate';
      this.buttonText.style.opacity = '1';
      this.buttonLoader.style.opacity = '0';
    } else {
      this.buttonText.textContent = 'Try again...';
      this.buttonText.style.opacity = '1';
      this.buttonLoader.style.opacity = '0';
    }
  }

  private async handleAzureRequest(): Promise<void> {
    if (isStaging) {
      console.groupCollapsed('API Call');
      console.time('API Request');
    }
    try {
      const result = await this.makeAzureRequest();
      this.result = result.result;

      // --- MORT v2 -- Check if `data-results` is set in `calculator.component` - New Mortgage Calc
      const resultsId = this.component.getAttribute('data-results');
      const calcName = this.component.getAttribute('data-calc');

      if (resultsId && calcName === 'residentialborrowinglimit') {
        // Find the calculator with `data-calc="mortgagecost"` and trigger calculation
        const mortgageCalcComponent = document.querySelector(
          '[data-calc="mortgagecost"]'
        ) as HTMLDivElement;
        if (mortgageCalcComponent) {
          const mortgageCalc = new HandleCalculator(mortgageCalcComponent);
          mortgageCalc.submit();

          // To return single product
          const mortInputs = mortgageCalc.inputs.getValues();
          const calcInputs = this.inputs.getValues();

          const DepositAmount = parseFloat((calcInputs['DepositAmount'] as string) || '0');
          const RepaymentValue = parseFloat((mortInputs['RepaymentValue'] as string) || '0');
          const PropertyValue = RepaymentValue + DepositAmount;

          syncSlider('DepositAmountSlider', DepositAmount);
          syncSlider('RepaymentValue', RepaymentValue);
          // Get Product Update

          const prodresult = await this.makeAzureRequestProduct({
            PropertyValue,
            RepaymentValue,
            TermYears: parseFloat((mortInputs['TermYears'] as string) || '0'),
            PropertyType: 1,
            MortgageType: 1,
          });

          if (prodresult) {
            this.populateProductCard(prodresult.result);

            const mortPickTitle = document.querySelector('#mortPickTitle');
            const mortPickArea = document.querySelector('#mortPickArea');
            if (prodresult.result.success) {
              if (mortPickTitle && mortPickArea) {
                (mortPickTitle as HTMLElement).style.display = 'flex';
                (mortPickArea as HTMLElement).style.display = 'flex';
              }
            } else {
              if (mortPickTitle && mortPickArea) {
                (mortPickTitle as HTMLElement).style.display = 'none';
                (mortPickArea as HTMLElement).style.display = 'none';
              }
            }
          }
        }
      }

      if (this.result === null) {
        this.toggleLoading(false);
      } else {
        this.toggleLoading(true);
        this.outputs.displayResults(this.result);
      }
      if (resultsId && calcName === 'residentialborrowinglimit') {
        if (this.result) {
          this.scrollToDiv(resultsId);
        }
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

  private scrollToDiv(id: string): void {
    const targetElement = document.querySelector('#' + id);

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth', // Smooth scroll
        block: 'start', // Align to the top of the viewport
      });
    }
  }

  private populateProductCard(results: Result): void {
    if (!results.data || !Array.isArray(results.data)) return;

    document.querySelectorAll('[data-calc-output]').forEach((output) => {
      const key = output.getAttribute('data-calc-output');
      if (!key || !(key in results.data[0])) return;

      const value = results.data[0][key];
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

      if (output instanceof HTMLImageElement) {
        output.src = stringValue;
        output.alt = key;
      } else {
        output.textContent = stringValue;
      }
    });
  }

  private calculateMonthlyPayment(borrowAmount: number, termYears: any, annualRate: any) {
    const n = termYears * 12; // Total number of monthly payments
    const r = annualRate / 100 / 12; // Convert annual rate to monthly rate

    if (r === 0) {
      // If interest rate is 0, simple division
      return borrowAmount / n;
    }

    return (borrowAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  private async makeAzureRequest(): Promise<APIResponse> {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    // New Mortgage Calcu
    const values = this.inputs.getValues(); // Get input values
    const depositValue = values['DepositAmount'];
    const depositAmount = parseFloat(typeof depositValue === 'string' ? depositValue : '0');
    const borrowValue = values['RepaymentValue'];
    const borrowAmount = parseFloat(typeof borrowValue === 'string' ? borrowValue : '0');
    const depositSliderValue = values['DepositAmountSlider'];
    const depositSliderAmount = parseFloat(
      typeof depositSliderValue === 'string' ? depositSliderValue : '0'
    );

    const body = JSON.stringify({ calculator: this.name, input: values });

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const result = await response.json();
    let monthlyRepayment;

    // Adjust Result to add Calulations not brought back from API for New Mortgage Calc
    if (depositAmount > 0 && result) {
      if (result.result.BorrowingAmountLower) {
        //monthlyRepayment = this.calculateMonthlyPayment(borrowAmount, 25, 4.65)
        result.result.DepositAmount = depositAmount;
        result.result.PropertyValue =
          parseFloat(result.result.BorrowingAmountHigher) + depositAmount;
        result.result.RepaymentValue = parseFloat(result.result.BorrowingAmountHigher);
        result.result.TermYears = 25;
        //result.result.FutureMonthlyPayment = monthlyRepayment
      }
    }

    if (result.result.TotalOverTerm) {
      monthlyRepayment = this.calculateMonthlyPayment(
        borrowAmount,
        values['TermYears'],
        values['Rate']
      );

      result.result.TotalOverTerm = Math.round(result.result.TotalOverTerm);
      result.result.DepositAmount = depositSliderAmount;
      result.result.PropertyValue = borrowAmount + depositSliderAmount;
      result.result.RepaymentValue = borrowAmount;
      result.result.TermYears = values['TermYears'];
      result.result.FutureMonthlyPayment = monthlyRepayment
        ? Math.round(monthlyRepayment)
        : Math.round(result.result.FutureMonthlyPayment);
    }

    return result;
  }

  private async makeAzureRequestProduct({
    PropertyValue,
    PropertyType = 1,
    MortgageType = 1,
    RepaymentValue,
    TermYears,
    NumberOfResults = 1,
  }: {
    PropertyValue: number;
    PropertyType?: number;
    MortgageType?: number;
    RepaymentValue: number;
    TermYears: number;
    NumberOfResults?: number;
  }): Promise<APIResponse> {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    // Construct request body using function parameters
    const body = JSON.stringify({
      input: {
        PropertyValue, // Market value of property
        PropertyType, // 1 for house; 2 for flat
        MortgageType, // 1 for Residential; 2 for Buy to Let
        RepaymentValue, // Repayment amount
        InterestOnlyValue: '0', // Interest-only value
        TermYears, // Mortgage term in whole years
        SchemePurpose: '1', // 1 for Purchase; 2 for Remortgage
        SchemePeriods: ['1'], // Array of mortgage scheme durations (1, 2, 3, 4)
        SchemeTypes: ['1'], // Array of scheme types (Fixed = 1, Variable = 2)
        NumberOfResults, // Total number of products to return
        Features: {
          Erc: false, // ERC feature flag
          Offset: false, // Offset feature flag
          NewBuild: false, // New Build feature flag
        },
        SortColumn: '1', // Sorting column for results (1-6)
        UseStaticApr: false, // Whether to use a static APR
      },
    });

    const response = await fetch(API_ENDPOINT_PRODUCT, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const result = await response.json();

    if (result.result.data[0].FutureMonthlyPayment) {
      result.result.data[0].FutureMonthlyPayment = Math.round(
        result.result.data[0].FutureMonthlyPayment
      );
      result.result.data[0].InitialRate = result.result.data[0].Rate;
      result.result.data[0].TermYears = result.result.data[0].TermYears;
    }

    const rateSlider = document.querySelector('[data-input="Rate"]') as HTMLInputElement | null;
    if (rateSlider) {
      rateSlider.setAttribute('value', result.result.data[0].Rate);
      rateSlider.setAttribute('placeholder', result.result.data[0].Rate);
    }

    return result;
  }
}
