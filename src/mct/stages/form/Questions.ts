/**
 * class for individual questions
 */

import { classes } from 'src/mct/shared/constants';

import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import { attr } from './constants';
import type { Answers } from 'src/mct/shared/types';
import type { CheckboxValues, InputValue, NumberValue, RadioValue, TextValue } from './types';
import type { FormManager } from './Manager';

type InputType = 'radio' | 'checkbox' | 'text' | 'number';

type QuestionOptions = {
  formManager: FormManager;
  onChange: () => void;
  onEnter: () => void;
  indexInGroup: number;
};

export class Question {
  public el: HTMLElement;
  private formManager: FormManager;
  private onChange: () => void;
  private onEnter: () => void;
  private inputs: HTMLInputElement[] = [];
  private type: InputType;
  public name: string;
  public dependsOn: string | null;
  public dependsOnValue: string | null;
  public isVisible: boolean = false;
  public indexInGroup: number;

  constructor(el: HTMLElement, options: QuestionOptions) {
    this.el = el;
    this.formManager = options.formManager;
    this.onChange = options.onChange;
    this.onEnter = options.onEnter;
    this.inputs = queryElements('input', this.el) as HTMLInputElement[];
    this.type = this.detectType();
    this.name = this.el.getAttribute(attr.question) as string;
    this.dependsOn = this.el.getAttribute(attr.dependsOn) || null;
    this.dependsOnValue = this.el.getAttribute(attr.dependsOnValue) || null;
    this.indexInGroup = options.indexInGroup;

    this.bindEventListeners();
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

      input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
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

  public hide(): void {
    this.formManager.removeQuestion(this);
    this.el.style.display = 'none';
    this.isVisible = false;
  }

  public show(): void {
    this.formManager.saveQuestion(this);
    this.el.style.removeProperty('display');
    this.isVisible = true;
  }

  public toggleActive(active?: boolean): void {
    if (active === undefined) {
      this.el.classList.toggle(classes.active);
    } else {
      this.el.classList.toggle(classes.active, active);
    }
  }

  public shouldBeVisible(answers: Answers): boolean {
    // was AnswerKey, AnswerValue
    if (!this.dependsOn) return true;
    if (!this.dependsOnValue) return answers[this.dependsOn] !== null;
    return answers[this.dependsOn] === this.dependsOnValue;
  }

  private detectType(): InputType {
    const input = queryElement('input', this.el) as HTMLInputElement;
    if (!input) throw new Error('No "input" element found in question item');

    if (input.type === 'radio') return 'radio';
    if (input.type === 'checkbox') return 'checkbox';
    if (input.type === 'text') return 'text';
    if (input.type === 'number') return 'number';
    throw new Error(`Unsupported input type: ${input.type}`);
  }

  private getRadioValue(): RadioValue | null {
    const checked = this.inputs.find((i) => i.checked);
    return !!checked ? checked.value : null;
  }

  private setRadioValue(value: RadioValue): void {
    const input = this.inputs.find((i) => i.value === value);
    if (!input) throw new Error(`No radio input found with value: ${value}`);
    input.checked = true;
  }

  private resetRadioInput(): void {
    this.inputs.forEach((input) => {
      input.checked = false;
    });
  }

  private getCheckboxValues(): CheckboxValues {
    const checked = this.inputs.filter((i) => i.checked);
    return checked.map((input) => input.value);
  }

  private setCheckboxValues(values: CheckboxValues): void {
    this.inputs.forEach((input) => {
      input.checked = values.includes(input.value);
    });
  }

  private resetCheckboxeInputs(): void {
    this.inputs.forEach((input) => {
      input.checked = false;
    });
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
      default:
        throw new Error(`Unsupported question type: ${this.type}`);
    }
  }

  public getLabels(): string[] {
    const checked = this.inputs.filter((i) => i.checked);
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
      default:
        throw new Error(`Unsupported question type: ${this.type}`);
    }
  }
}
