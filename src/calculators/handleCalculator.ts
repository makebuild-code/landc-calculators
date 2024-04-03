import type { APIResponse } from 'src/types';

import { isStaging } from '$utils/isStaging';
import { queryElement } from '$utils/queryElement';

import { type CalculatorConfig, calculatorConfig } from './calculatorConfig';
import { HandleInputs } from './handleInputs';
import { HandleOutputs } from './handleOutputs';

export type BasicObject = {
  [key: string]: string | number;
};

export interface Result {
  [key: string]: string | number | BasicObject[];
}

const attr = 'data-calc';
const API_ENDPOINT = 'https://landc-website.azurewebsites.net/api/calculatorhttptrigger';

export class HandleCalculator {
  private name: string;
  component: HTMLDivElement;
  config: CalculatorConfig;
  private inputs: HandleInputs;
  private outputs: HandleOutputs;
  private button: HTMLButtonElement;
  private buttonText: HTMLDivElement;
  private buttonLoader: HTMLDivElement;
  private isLoading: boolean;
  private result?: Result;

  constructor(name: string) {
    this.name = name;
    this.component = queryElement(`[${attr}="${this.name}"]`) as HTMLDivElement;
    this.config = calculatorConfig[this.name];
    this.inputs = new HandleInputs(this);
    this.outputs = new HandleOutputs(this);
    this.button = queryElement(`[${attr}-el="button"]`, this.component) as HTMLButtonElement;
    this.buttonText = queryElement(`[${attr}-el="button-text"]`, this.button) as HTMLDivElement;
    this.buttonLoader = queryElement(`[${attr}-el="button-loader"]`, this.button) as HTMLDivElement;
    this.isLoading = false;
  }

  init(): void {
    this.inputs.init();
    if (isStaging) {
      console.groupCollapsed(this.name);
      console.log(this);
      this.inputs.check();
      this.outputs.check();
      console.groupEnd();
    }
    this.onSubmit();
  }

  private onSubmit(): void {
    this.button.addEventListener('click', () => {
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
    });
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
      this.toggleLoading(true);
      this.outputs.displayResults(this.result);
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

    const body = JSON.stringify({ calculator: this.name, input: this.inputs.getValues() });

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
}
