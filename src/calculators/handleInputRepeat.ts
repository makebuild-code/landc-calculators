import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import type { HandleCalculator } from './handleCalculator';

type Input = HTMLInputElement | HTMLSelectElement;
// type Input = HTMLInputElement | HTMLSelectElement | HTMLFieldSetElement;

const attr = 'data-calc';

/**
 * How to handle input repeats
 * 1. for each repeat, we need to:
 * - get the template (first item)
 * - get the button
 * - duplicate the template on button click
 * - remove templates on click (second phase)
 * - get all inputs and output them in the correct way (e.g. array of objects)
 */

/**
 * @todo update inputs when added/removed
 */

export class HandleInputRepeat {
  private calculator: HandleCalculator;
  private name: string;
  private template: HTMLDivElement;
  private templateWrapper: HTMLDivElement;
  private inputs: Input[];
  private clone: HTMLDivElement;
  private groups: HTMLDivElement[];
  private max: number;
  private button: HTMLButtonElement;

  constructor(calculator: HandleCalculator, name: string) {
    this.calculator = calculator;
    this.name = name;
    this.template = queryElement(`[${attr}-input-repeat]`, calculator.component) as HTMLDivElement;
    this.templateWrapper = this.template.parentElement as HTMLDivElement;
    this.inputs = queryElements(`[data-input]`, this.template);
    this.clone = this.template.cloneNode(true) as HTMLDivElement;
    this.groups = [this.template];
    this.max = Number(this.template.dataset.calcInputRepeatMax);
    this.button = queryElement(
      `[${attr}-input-repeat-duplicate="${name}"]`,
      calculator.component
    ) as HTMLButtonElement;
  }

  init(): void {
    this.button.addEventListener('click', () => {
      this.addTemplate();
    });
  }

  addTemplate(): void {
    // check if this should go ahead
    const maxGroups = this.maxGroupsCheck();
    if (maxGroups) return;

    // clone the clone and add it as a child
    const newItem = this.clone.cloneNode(true) as HTMLDivElement;
    this.templateWrapper.appendChild(newItem);
    this.groups.push(newItem);

    // check if the maximum number of items have been entered
    this.maxGroupsCheck();
  }

  maxGroupsCheck(): boolean {
    if (this.groups.length === this.max) {
      this.button.disabled;
      return true;
    }

    return false;
  }

  bindInputEvents(inputs: Input[]): void {
    inputs.forEach((input) => {
      input.addEventListener('change', () => {});
    });
  }

  // check(): boolean {
  //   const tableData: { input: string; present: boolean }[] = [];
  //   let allPresent = true;

  //   // check which inputs are/aren't present
  //   this.config.names.forEach((name) => {
  //     const input = this.inputs.find((input) => input.dataset.input === name);
  //     tableData.push({
  //       input: name,
  //       present: !!input,
  //     });

  //     if (!input) allPresent = false;
  //   });

  //   if (isStaging) {
  //     console.groupCollapsed(`${allPresent ? 'all inputs present' : 'inputs missing'}`);
  //     console.table(tableData);
  //     console.groupEnd();
  //   }

  //   return allPresent;
  // }

  // private clearInput(input: Input): void {
  //   if (input instanceof HTMLInputElement) {
  //     input.value = '';
  //   } else if (input instanceof HTMLSelectElement) {
  //     input.selectedIndex = 0;
  //   }
  // }

  // private getWrapper(input: Input): HTMLElement | undefined {
  //   let child = input as HTMLElement,
  //     inputWrapper: HTMLElement | undefined;

  //   while (child) {
  //     if (
  //       child.parentElement &&
  //       child.parentElement.classList &&
  //       child.parentElement.classList.contains('calculator-field_component')
  //     ) {
  //       inputWrapper = child.parentElement;
  //       break;
  //     } else if (child.parentElement) {
  //       child = child.parentElement;
  //     } else {
  //       break;
  //     }
  //   }

  //   return inputWrapper;
  // }

  // private setMessage(input: Input, message?: string): void {
  //   const inputWrapper = this.getWrapper(input);
  //   if (!inputWrapper) return;

  //   const inputMessage = queryElement('.calculator-field_message', inputWrapper);
  //   if (!inputMessage) return;

  //   const { originalMessage } = inputMessage.dataset;
  //   if (!originalMessage && inputMessage.textContent) {
  //     inputMessage.dataset.originalMessage = inputMessage.textContent;
  //   }

  //   if (message) {
  //     inputMessage.textContent = message;
  //   } else if (inputMessage.dataset.originalMessage) {
  //     inputMessage.textContent = inputMessage.dataset.originalMessage;
  //   }
  // }

  // private validateInput(input: Input): boolean {
  //   let isValid = true,
  //     error: string | undefined;

  //   if (input instanceof HTMLInputElement) {
  //     const { type } = input;
  //     switch (type) {
  //       case 'text':
  //         isValid = input.checkValidity();
  //         error = input.validationMessage;
  //       case 'number':
  //         const { min, max, value } = input;

  //         let minValid = true;
  //         if (!!min) minValid = Number(value) >= Number(min);

  //         let maxValid = true;
  //         if (!!max) maxValid = Number(value) <= Number(max);

  //         isValid = minValid && maxValid;
  //         if (isValid) break;

  //         if (!minValid) {
  //           error = `Input needs to be greater than ${min}`;
  //         } else if (!maxValid) {
  //           error = `Input needs to be smaller than ${max}`;
  //         }
  //     }
  //   } else if (input instanceof HTMLSelectElement) {
  //     isValid = input.checkValidity();
  //     error = input.validationMessage;
  //   }

  //   if (!error) {
  //     this.setMessage(input);
  //   } else {
  //     this.setMessage(input, error);
  //   }

  //   return isValid;
  // }

  // validateInputs(): boolean {
  //   return this.inputs.every((input) => {
  //     return this.validateInput(input);
  //   });
  // }

  // private getValue(input: Input): string | boolean | undefined {
  //   let value;
  //   if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) {
  //     value = input.value;
  //   }

  //   if (value === 'true') {
  //     value = true;
  //   } else if (value === 'false') {
  //     value = false;
  //   }

  //   return value;
  // }

  // getValues(): { [key: string]: string | boolean } {
  //   const inputValues: { [key: string]: string | boolean } = {};
  //   this.inputs.forEach((input: Input) => {
  //     const calcInput = input.dataset.input;
  //     const value = this.getValue(input);
  //     if (!calcInput || !value) return;

  //     inputValues[calcInput] = value;
  //   });

  //   return inputValues;
  // }
}
