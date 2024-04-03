import { checkInputValidity } from '$utils/checkInputValidity';
import { getInputValue } from '$utils/getInputValue';
import { isStaging } from '$utils/isStaging';
import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import type { Input } from '../types';
import type { CalculatorInputs } from './calculatorConfig';
import type { HandleCalculator } from './handleCalculator';
import { HandleInputRepeat } from './handleInputRepeat';

/**
 * @todo check input values are integer
 * @todo focus the first incorrect input
 * @todo show error messages
 * @todo account for radio inputs
 * @todo only submit the inputs that match those from the config
 * - e.g. don't submit radio button on savings calculator
 * @todo check() to report on repeats better
 */

export class HandleInputs {
  calculator: HandleCalculator;
  config: CalculatorInputs;
  private repeats?: HandleInputRepeat[];
  private all: Input[];
  private inputs: Input[];

  constructor(calculator: HandleCalculator) {
    this.calculator = calculator;
    this.config = calculator.config.inputs;

    if (this.config.repeats) {
      this.repeats = this.config.repeats.map((repeat) => {
        return new HandleInputRepeat(this.calculator, repeat);
      });
    }

    this.all = queryElements(`[data-input]`, calculator.component);
    // this.inputs = this.all.filter((input) => !this.repeats.inputs.includes(input));
    this.inputs = queryElements(`[data-input]`, calculator.component);
  }

  init(): void {
    if (this.repeats) {
      console.log('repeats:');
      console.log(this.repeats);
      this.repeats.forEach((repeat) => {
        repeat.init();
      });
    }
    this.bindEvents();
  }

  check(): boolean {
    const tableData: { input: string; present: boolean }[] = [];
    let allPresent = true;

    // check which inputs are/aren't present
    this.config.names.forEach((name) => {
      const input = this.all.find((input) => input.dataset.input === name);
      tableData.push({
        input: name,
        present: !!input,
      });

      if (!input) allPresent = false;
    });

    if (isStaging) {
      console.groupCollapsed(`${allPresent ? 'all inputs present' : 'inputs missing'}`);
      console.table(tableData);
      console.groupEnd();
    }

    return allPresent;
  }

  private getWrapper(input: Input): HTMLElement | undefined {
    let child = input as HTMLElement,
      inputWrapper: HTMLElement | undefined;

    while (child) {
      if (
        child.parentElement &&
        child.parentElement.classList &&
        child.parentElement.classList.contains('calculator-field_component')
      ) {
        inputWrapper = child.parentElement;
        break;
      } else if (child.parentElement) {
        child = child.parentElement;
      } else {
        break;
      }
    }

    return inputWrapper;
  }

  private setMessage(input: Input, message?: string): void {
    const inputWrapper = this.getWrapper(input);
    if (!inputWrapper) return;

    const inputMessage = queryElement('.calculator-field_message', inputWrapper);
    if (!inputMessage) return;

    const { originalMessage } = inputMessage.dataset;
    if (!originalMessage && inputMessage.textContent) {
      inputMessage.dataset.originalMessage = inputMessage.textContent;
    }

    if (message) {
      inputMessage.textContent = message;
    } else if (inputMessage.dataset.originalMessage) {
      inputMessage.textContent = inputMessage.dataset.originalMessage;
    }
  }

  validateInput(input: Input): boolean {
    const validity = checkInputValidity(input);

    if (!validity.error) {
      this.setMessage(input);
    } else {
      this.setMessage(input, validity.error);
    }

    return validity.isValid;
  }

  validateInputs(): boolean {
    return this.inputs.every((input) => {
      return this.validateInput(input);
    });
  }

  getValues(): { [key: string]: string | boolean } {
    const inputValues: { [key: string]: string | boolean } = {};
    this.inputs.forEach((input: Input) => {
      const calcInput = input.dataset.input;
      const value = getInputValue(input);
      if (!calcInput || !value) return;

      inputValues[calcInput] = value;
    });

    return inputValues;
  }

  private bindEvents(): void {
    // validate inputs on value change
    this.inputs.forEach((input) => {
      input.addEventListener('change', () => {
        this.validateInput(input);
      });
    });
  }
}
