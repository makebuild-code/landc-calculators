import type { APIResponse, Result } from 'src/types';

import { handleEnterInInputs } from '$utils/handleEnterInInputs';
import { isStaging } from '$utils/isStaging';
import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import { type CalculatorConfig, calculatorConfig } from './calculatorConfig';
import { HandleInputs } from './handleInputs';
import { HandleOutputs } from './handleOutputs';
import { API_ENDPOINTS } from 'src/constants';

const attr = 'data-calc';
const API_ENDPOINT = API_ENDPOINTS.calculatorTrigger;

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
      if (isStaging) console.log(result);
      if (this.result === null) {
        this.toggleLoading(false);
      } else {
        this.toggleLoading(true);
        this.outputs.displayResults(this.result);
      }

      // Check if `data-results` is set in `calculator.component` - New Mortgage Calc
      const resultsId = this.component.getAttribute("data-results");
      const calcName = this.component.getAttribute("data-calc");

      if (resultsId && calcName==='residentialborrowinglimit') {
        // Find the calculator with `data-calc="mortgagecost"` and trigger calculation
        const mortgageCalcComponent = document.querySelector('[data-calc="mortgagecost"]') as HTMLDivElement;
        if (mortgageCalcComponent) {
          const mortgageCalc = new HandleCalculator(mortgageCalcComponent);
          mortgageCalc.submit();
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
    const depositSliderAmount = parseFloat(typeof depositSliderValue === 'string' ? depositSliderValue : '0');
  
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
  
    // Adjust Result to add Calulations not brought back from API for New Mortgage Calc
    if (depositAmount > 0 && result) {
      if (result.result.BorrowingAmountLower) {
        result.result.DepositAmount = depositAmount;
        result.result.PropertyValue = parseFloat(result.result.BorrowingAmountHigher) + depositAmount;
      }
    }

    if (result.result.TotalOverTerm) {
      result.result.TotalOverTerm =  Math.round(result.result.TotalOverTerm);
      result.result.DepositAmount = depositSliderAmount;
      result.result.PropertyValue = borrowAmount + depositSliderAmount;
      result.result.BorrowingAmountHigher = borrowAmount;
    }
   

  
    return result;
  }
  
}
