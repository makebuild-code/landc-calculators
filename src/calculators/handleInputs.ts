import { checkInputValidity } from '$utils/checkInputValidity';
import { formatInput } from '$utils/formatInput';
import { getInputValue } from '$utils/getInputValue';
import { handleConditionalVisibility } from '$utils/handleConditionalVisibility';
import { isStaging } from '$utils/isStaging';
import { queryElements } from '$utils/queryelements';
import { setError } from '$utils/setError';

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
  inputs: Input[];
  private conditionals: HTMLDivElement[];

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
    this.conditionals = queryElements('.calculator_inputs [data-condition]', calculator.component);
  }

  init(): void {
    if (this.repeats) {
      this.repeats.forEach((repeat) => {
        repeat.init();
      });
    }

    this.handleConditionals();
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
      // eslint-disable-next-line no-console
      console.groupCollapsed(`${allPresent ? 'all inputs present' : 'inputs missing'}`);
      // eslint-disable-next-line no-console
      console.table(tableData);
      // eslint-disable-next-line no-console
      console.groupEnd();
    }

    return allPresent;
  }

  validateInput(input: Input): boolean {
    const validity = checkInputValidity(input);

    if (!validity.error) {
      setError(input);
    } else {
      setError(input, validity.error);
    }

    return validity.isValid;
  }

  validateInputs(): boolean {
    return this.inputs.every((input) => {
      return this.validateInput(input);
    });
  }

  getValues(): { [key: string]: string | boolean } {
    const values: { [key: string]: string | boolean } = {};
    this.inputs.forEach((input: Input) => {
      const calcInput = input.dataset.input;
      const value = getInputValue(input);
      if (!calcInput || !value) return;

      const { conditionsmet } = input.dataset;
      if (conditionsmet === 'false') return;

      values[calcInput] = value;
    });

    return values;
  }

  handleConditionals(): void {
    this.conditionals.forEach((item) => {
      handleConditionalVisibility(item, this.inputs);
    });
  }

  private bindEvents(): void {
    // validate inputs on value change
    this.inputs.forEach((input) => {
      input.addEventListener('change', () => {
        formatInput(input);
        this.validateInput(input);
        this.handleConditionals();
      });
    });
  }
}
