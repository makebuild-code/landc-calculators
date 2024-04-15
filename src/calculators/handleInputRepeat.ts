import type { InputArray, InputObject } from 'src/types';

import { getInputValue } from '$utils/getInputValue';
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

type Type = 'stringArray' | 'objectArray';

export class HandleInputRepeat {
  private calculator: HandleCalculator;
  name: string;
  private template: HTMLDivElement;
  private templateWrapper: HTMLDivElement;
  inputs: Input[];
  private clone: HTMLDivElement;
  private groups: HTMLDivElement[];
  private max: number;
  private type: Type;
  private button: HTMLButtonElement;

  constructor(calculator: HandleCalculator, name: string) {
    this.calculator = calculator;
    this.name = name;
    this.template = queryElement(
      `[${attr}-input-repeat=${name}]`,
      calculator.component
    ) as HTMLDivElement;

    this.templateWrapper = this.template.parentElement as HTMLDivElement;
    this.inputs = queryElements(`[data-input]`, this.template);
    this.clone = this.template.cloneNode(true) as HTMLDivElement;
    this.groups = [this.template];
    this.max = Number(this.template.dataset.calcInputRepeatMax);
    this.type = this.inputs.length === 1 ? 'stringArray' : 'objectArray';
    this.button = queryElement(
      `[${attr}-input-repeat-duplicate="${name}"]`,
      calculator.component
    ) as HTMLButtonElement;
  }

  init(): void {
    console.log(this);
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
    const label = queryElement('label', newItem);
    const input = queryElement('input, select', newItem);

    if (label && input) {
      const name = `${this.name}-${this.groups.length + 1}`;
      label.setAttribute('for', name);
      input.setAttribute('id', name);
    }

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

  getValues(): InputObject | InputArray {
    /**
     * Plan
     * 1. loop through the groups
     * 2. if the groups are made of 1 input, add it directly to the array
     * 3. if there are more than 1 input per group add as an object
     */

    const values: (string | InputObject)[] = [];

    console.log(this.type);

    this.groups.forEach((group) => {
      console.log(group);
      const inputs = queryElements('[data-input]', group) as Input[];
      console.log(inputs);
      if (this.type === 'stringArray') {
        inputs.forEach((input) => {
          const value = getInputValue(input);
          if (value) values.push(value.toString());
        });
      } else if (this.type === 'objectArray') {
        const object = {};
        inputs.forEach((input) => {
          const calcInput = input.dataset.input;
          const value = getInputValue(input);
          if (!calcInput || !value) return;

          console.log(calcInput);
          console.log(value);

          object[calcInput] = value;
        });

        values.push(object);
      }
    });

    console.log(values);

    return values;
  }
}
