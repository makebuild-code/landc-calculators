/**
 * class for individual questions
 */

import { classes } from 'src/mct/shared/constants';

import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import { attr } from './constants';
import type { Answers } from 'src/mct/shared/types';
import type { CheckboxValues, InputValue, NumberValue, RadioValue, SelectValue, TextValue } from './types';
import type { FormManager } from './Manager';
import { fetchLenders } from 'src/mct/shared/api/fetchLenders';

type Input = HTMLInputElement | HTMLSelectElement;
type InputType = 'radio' | 'checkbox' | 'text' | 'number' | 'select-one';
type SelectOption = {
  value: string;
  label: string;
};

type QuestionOptions = {
  formManager: FormManager;
  onChange: () => void;
  onEnter: () => void;
  groupName: string;
  indexInGroup: number;
};

export class Question {
  public el: HTMLElement;
  private formManager: FormManager;
  private onChange: () => void;
  private onEnter: () => void;
  private inputs: Input[] = [];
  private type: InputType;
  public name: string;
  public dependsOn: string | null;
  public dependsOnValue: string | null;
  public isVisible: boolean = false;
  public groupName: string;
  public indexInGroup: number;

  constructor(el: HTMLElement, options: QuestionOptions) {
    this.el = el;
    this.formManager = options.formManager;
    this.onChange = options.onChange;
    this.onEnter = options.onEnter;
    this.inputs = queryElements('input, select', this.el) as Input[];
    this.type = this.detectType();
    this.name = this.el.getAttribute(attr.question) as string;
    this.dependsOn = this.el.getAttribute(attr.dependsOn) || null;
    this.dependsOnValue = this.el.getAttribute(attr.dependsOnValue) || null;
    this.groupName = options.groupName;
    this.indexInGroup = options.indexInGroup;

    this.init();
  }

  private init(): void {
    this.formatInputNamesAndIDs();
    this.handleLenderSelect();
    this.bindEventListeners();
  }

  private formatInputNamesAndIDs(): void {
    if (this.type === 'radio' || this.type === 'checkbox') {
      this.inputs.forEach((input) => {
        const label = queryElement('label', input.parentElement as HTMLElement) as HTMLLabelElement;
        const id = `${this.groupName}-${input.name}-${input.value}`;
        const name = `${this.groupName}-${input.name}`;

        label.setAttribute('for', id);
        input.id = id;
        input.name = name;
      });
    } else {
      const label = queryElement('label', this.el) as HTMLLabelElement;
      const input = this.inputs[0];
      const nameAndID = `${this.groupName}-${input.name}`;

      label.setAttribute('for', nameAndID);
      input.id = nameAndID;
      input.name = nameAndID;
    }
  }

  private async handleLenderSelect(): Promise<void> {
    if (this.name !== 'Lender') return;

    try {
      const lenders = await fetchLenders();
      const lenderOptions = lenders.map(
        (lender): SelectOption => ({
          value: lender.MasterLenderId.toString(),
          label: lender.LenderName,
        })
      );

      this.setSelectOptions(lenderOptions);
    } catch (error) {
      console.error('Failed to fetch lenders:', error);
    }
  }

  private bindEventListeners(): void {
    this.inputs.forEach((input) => {
      if (this.type === 'text' || this.type === 'number') {
        input.addEventListener('input', () => {
          const valid = this.isValid();
          this.updateVisualState(valid);
          this.onChange();
        });
      } else {
        input.addEventListener('change', () => {
          const valid = this.isValid();
          this.updateVisualState(valid);
          this.onChange();
        });
      }

      input.addEventListener('keydown', (event: Event) => {
        const ke = event as KeyboardEvent;
        if (ke.key !== 'Enter') return;

        if (this.isValid()) {
          this.onEnter();
        } else {
          this.updateVisualState(false);
          this.onChange();
        }
      });
    });
  }

  public isValid(): boolean {
    // Check if any of the inputs are invalid using the native validation API
    const hasInvalidInput = this.inputs.some((input) => !input.checkValidity());
    if (hasInvalidInput) return false;

    const value = this.getValue();

    // Additional type-specific validation
    if (this.type === 'radio') return typeof value === 'string' && value !== '';
    if (this.type === 'checkbox') return Array.isArray(value) && value.length > 0;
    if (this.type === 'text') return typeof value === 'string' && value.trim() !== '';
    if (this.type === 'number') return typeof value === 'number' && !isNaN(value);

    return false;
  }

  public updateVisualState(isValid: boolean): void {
    this.el.classList.toggle('has-error', !isValid);
  }

  public enable(): void {
    this.inputs.forEach((input) => {
      input.disabled = false;
    });
  }

  public focus(): void {
    const input = this.inputs[0];
    if (!input) throw new Error('No input found to focus on');
    input.focus();
  }

  public disable(): void {
    this.inputs.forEach((input) => {
      input.disabled = true;
    });
  }

  public require(): void {
    this.formManager.saveQuestion(this);
    this.el.style.removeProperty('display');
    this.isVisible = true;
  }

  public unrequire(): void {
    this.formManager.removeQuestion(this);
    this.el.style.display = 'none';
    this.isVisible = false;
  }

  public toggleActive(active?: boolean): void {
    if (active === undefined) {
      this.el.classList.toggle(classes.active);
    } else {
      this.el.classList.toggle(classes.active, active);
    }
  }

  public shouldBeVisible(answers: Answers, groupIsVisible: boolean): boolean {
    // parent group is not visible
    if (!groupIsVisible) return false;

    // question depends on nothing
    if (!this.dependsOn) return true;

    // question depends on a prior question being answered, no specific value
    if (!this.dependsOnValue) return answers[this.dependsOn] !== null;

    // question depends on a prior question being answered, with a specific value
    return answers[this.dependsOn] === this.dependsOnValue;
  }

  private detectType(): InputType {
    const input = queryElement('input, select', this.el) as Input;
    if (!input) throw new Error('No "input" element found in question item');

    if (input.type === 'radio') return 'radio';
    if (input.type === 'checkbox') return 'checkbox';
    if (input.type === 'text') return 'text';
    if (input.type === 'number') return 'number';
    if (input.type === 'select-one') return 'select-one';
    throw new Error(`Unsupported input type: ${input.type}`);
  }

  private getRadioValue(): RadioValue | null {
    const checked = this.inputs.find((input) => (input instanceof HTMLInputElement ? input.checked : false));
    return checked?.value || null;
  }

  private setRadioValue(value: RadioValue): void {
    const input = this.inputs.find((i) => i.value === value);
    if (!input || !(input instanceof HTMLInputElement)) throw new Error(`No radio input found with value: ${value}`);
    input.checked = true;
  }

  private resetRadioInput(): void {
    this.inputs.forEach((input) => (input instanceof HTMLInputElement ? (input.checked = false) : null));
  }

  private getCheckboxValues(): CheckboxValues {
    const checked = this.inputs.filter((input) => (input instanceof HTMLInputElement ? input.checked : false));
    return checked.map((input) => input.value);
  }

  private setCheckboxValues(values: CheckboxValues): void {
    this.inputs.forEach((input) =>
      input instanceof HTMLInputElement ? (input.checked = values.includes(input.value)) : null
    );
  }

  private resetCheckboxeInputs(): void {
    this.inputs.forEach((input) => (input instanceof HTMLInputElement ? (input.checked = false) : null));
  }

  private getTextValue(): TextValue | null {
    const input = this.inputs[0];
    return input ? input.value : null;
  }

  private setTextValue(value: TextValue): void {
    const input = this.inputs[0];
    if (!input) throw new Error('No text input found for text question');
    input.value = value;
  }

  private resetTextInputs(): void {
    const input = this.inputs[0];
    if (!input) throw new Error('No text input found for text question');
    input.value = '';
  }

  private getNumberValue(): NumberValue | null {
    const input = this.inputs[0];
    if (!input) return null;

    const value = input.value.trim();
    if (!value) return null;

    const number = parseFloat(value);
    return isNaN(number) ? null : number;
  }

  private setNumberValue(value: NumberValue): void {
    const input = this.inputs[0];
    if (!input) throw new Error('No number input found for number question');
    input.value = value.toString();
  }

  private resetNumberInput(): void {
    const input = this.inputs[0];
    if (!input) throw new Error('No number input found for number question');
    input.value = '';
  }

  private getSelectValue(): SelectValue | null {
    const input = this.inputs[0];
    if (!input) return null;
    return input.value;
  }

  private setSelectValue(value: SelectValue): void {
    const input = this.inputs[0];
    if (!input) throw new Error('No select input found for select question');
    input.value = value;
  }

  private resetSelectInput(): void {
    const input = this.inputs[0];
    if (!input) throw new Error('No select input found for select question');
    input.value = '';
  }

  private setSelectOptions(options: SelectOption[]): void {
    const input = this.inputs[0];
    if (!input) throw new Error('No select input found for select question');
    if (!(input instanceof HTMLSelectElement)) throw new Error('No select input found for select question');

    // Remove all existing options
    input.innerHTML = '';

    // Add new options
    options.forEach((option) => {
      const optionEl = document.createElement('option');
      optionEl.value = option.value;
      optionEl.text = option.label;
      input.appendChild(optionEl);
    });
  }

  public getValue(): InputValue | null {
    switch (this.type) {
      case 'radio':
        return this.getRadioValue();
      case 'checkbox':
        return this.getCheckboxValues();
      case 'text':
        return this.getTextValue();
      case 'number':
        return this.getNumberValue();
      case 'select-one':
        return this.getSelectValue();
      default:
        throw new Error(`Unsupported question type: ${this.type}`);
    }
  }

  public setValue(value: InputValue): void {
    switch (this.type) {
      case 'radio':
        if (typeof value !== 'string') throw new Error('Value for radio question must be a string');
        this.setRadioValue(value);
        break;
      case 'checkbox':
        if (!Array.isArray(value)) throw new Error('Value for checkbox question must be an array');
        this.setCheckboxValues(value);
        break;
      case 'text':
        if (typeof value !== 'string') throw new Error('Value for text question must be a string');
        this.setTextValue(value);
        break;
      case 'number':
        if (typeof value !== 'number') throw new Error('Value for number question must be a number');
        this.setNumberValue(value);
        break;
      case 'select-one':
        if (typeof value !== 'string') throw new Error('Value for select question must be a string');
        this.setSelectValue(value);
        break;
      default:
        throw new Error(`Unsupported question type: ${this.type}`);
    }
  }

  public getLabels(): string[] {
    const checked = this.inputs.filter((input) => {
      if (input instanceof HTMLInputElement) return input.checked;
      return false;
    });
    const labelEls = checked.map((input) => queryElement(`label[for="${input.id}"]`, this.el) as HTMLLabelElement);
    const labels = labelEls.map((label) => label.textContent as string);
    return labels;
  }

  public reset(): void {
    switch (this.type) {
      case 'radio':
        this.resetRadioInput();
        break;
      case 'checkbox':
        this.resetCheckboxeInputs();
        break;
      case 'text':
        this.resetTextInputs();
        break;
      case 'number':
        this.resetNumberInput();
        break;
      case 'select-one':
        this.resetSelectInput();
        break;
      default:
        throw new Error(`Unsupported question type: ${this.type}`);
    }
  }
}
