import { checkInputValidity } from '$utils/checkInputValidity';
import { formatInput } from '$utils/formatInput';
import { getInputValue } from '$utils/getInputValue';
import { handleConditionalVisibility } from '$utils/handleConditionalVisibility';
import { isStaging } from '$utils/isStaging';
import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';
import { setError } from '$utils/setError';

import type { Input, InputType } from '../types';
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
  all: Input[];
  private repeats?: HandleInputRepeat[];
  inputs: Input[];
  private conditionals: HTMLDivElement[];

  constructor(calculator: HandleCalculator) {
    this.calculator = calculator;
    this.config = calculator.config.inputs;

    this.all = queryElements(`[data-input]`, calculator.component);

    if (this.config.repeats) {
      this.repeats = this.config.repeats.map((repeat) => {
        return new HandleInputRepeat(this.calculator, repeat);
      });

      this.inputs = [];
      this.all.forEach((input: Input) => {
        const isRepeat = this.repeats?.some((repeat) => {
          return repeat.inputs.includes(input);
        });

        if (!isRepeat) this.inputs.push(input);
      });
    } else {
      this.inputs = queryElements(`[data-input]`, calculator.component);
    }

    this.conditionals = queryElements('.calculator_inputs [data-condition]', calculator.component);
  }

  init(): void {
    if (this.repeats) {
      this.repeats.forEach((repeat) => {
        repeat.init();
      });
    }

    

    this.minMaxValues();

    this.handleConditionals();
    this.bindEvents();
  }

  minMaxValues(): void {
    this.all.forEach((input) => {
      if (input.type === 'date') {
        const today = new Date();
        const futureMonth = new Date(today.getTime());
        futureMonth.setMonth(today.getMonth() + 1);

        const futureYear = new Date(today.getTime());
        futureYear.setFullYear(today.getFullYear() + 5);

        function formatDate(date: Date): string {
          const yyyy: string = date.getFullYear().toString();
          const mm: string = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero based, adding 1 for human readability
          const dd: string = date.getDate().toString().padStart(2, '0');
          return yyyy + '-' + mm + '-' + dd;
        }

        const nextMonthDate: string = formatDate(futureMonth);
        const fiveYearsLaterDate: string = formatDate(futureYear);

        input.setAttribute('min', nextMonthDate);
        input.setAttribute('max', fiveYearsLaterDate);
      }
    });
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
    let inputFocused = false,
      isValid = true;

    this.inputs.forEach((input) => {
      const inputValid = this.validateInput(input);
      if (!inputValid) {
        isValid = false;
        if (!inputFocused) {
          input.focus();
          inputFocused = true;
        }
      }
    });

    return isValid;
  }

  getValues(): InputType {
    const values: InputType = {};
    if (this.calculator.name === 'comparerates') {
      (values.PropertyValue = getInputValue(
        queryElement('[data-input="PropertyValue"]', this.calculator.component) as Input
      ) as string),
        (values.LoanAmount = getInputValue(
          queryElement('[data-input="LoanAmount"]', this.calculator.component) as Input
        ) as string),
        (values.Term = getInputValue(
          queryElement('[data-input="Term"]', this.calculator.component) as Input
        ) as string),
        (values.Type = getInputValue(
          queryElement('[data-input="Type"]', this.calculator.component) as Input
        ) as string),
        (values.ComparisonRates = [
          {
            Rate: getInputValue(
              queryElement('[data-input="CurrentRate"]', this.calculator.component) as Input
            ),
            Fees: getInputValue(
              queryElement('[data-input="CurrentFees"]', this.calculator.component) as Input
            ),
            Type: getInputValue(
              queryElement('[data-input="CurrentType"]', this.calculator.component) as Input
            ),
            SchemeLength: getInputValue(
              queryElement('[data-input="CurrentSchemeLength"]', this.calculator.component) as Input
            ),
            ERCAmount: getInputValue(
              queryElement('[data-input="ERCAmount"]', this.calculator.component) as Input
            ),
            ERCTerm: getInputValue(
              queryElement('[data-input="ERCTerm"]', this.calculator.component) as Input
            ),
            ERCAdd: getInputValue(
              queryElement('[data-input="ERCAdd"]', this.calculator.component) as Input
            ),
            FollowOn: getInputValue(
              queryElement('[data-input="CurrentFollowOn"]', this.calculator.component) as Input
            ),
          },
          {
            Rate: getInputValue(
              queryElement('[data-input="CompareRate"]', this.calculator.component) as Input
            ),
            Fees: getInputValue(
              queryElement('[data-input="CompareFees"]', this.calculator.component) as Input
            ),
            Type: getInputValue(
              queryElement('[data-input="CompareType"]', this.calculator.component) as Input
            ),
            SchemeLength: getInputValue(
              queryElement('[data-input="CompareSchemeLength"]', this.calculator.component) as Input
            ),
            FollowOn: getInputValue(
              queryElement('[data-input="CompareFollowOn"]', this.calculator.component) as Input
            ),
          },
        ]),
        (values.ComparisonTerm = getInputValue(
          queryElement('[data-input="ComparisonTerm"]', this.calculator.component) as Input
        ) as string),
        (values.InterestRateEnvironment = getInputValue(
          queryElement('[data-input="InterestRateEnvironment"]', this.calculator.component) as Input
        ) as string);
    } else {
      this.inputs.forEach((input: Input) => {
        const calcInput = input.dataset.input;
        const value = getInputValue(input);

        if (!calcInput || !value) return;

        const { conditionsmet } = input.dataset;
        if (conditionsmet === 'false') return;

        values[calcInput] = value;
      });

      if (this.repeats) {
        this.repeats.forEach((repeat) => {
          values[repeat.name] = repeat.getValues();
        });
      }
    }
    return values;
  }

  handleConditionals(): void {
    this.conditionals.forEach((item) => {
      handleConditionalVisibility(item, this.inputs);
    });
  }

  private bindEvents(): void {
    // validate inputs on value change
    this.all.forEach((input) => {
      const eventType = input.type === 'range' ? 'mouseup' : 'change';
      console.log(eventType)
      input.addEventListener(eventType, () => {
        formatInput(input);
        this.validateInput(input);
        this.handleConditionals();
        // New Mortgage calc out update on change
       
        if (this.calculator.name === 'mortgagecost') {
          this.calculator.submit();
        }

        
      });
    });
  }
}
