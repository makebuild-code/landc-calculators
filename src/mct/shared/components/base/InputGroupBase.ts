import { queryElement } from '$utils/dom/queryElement';
import { queryElements } from '$utils/dom/queryelements';

import type {
  CheckboxValues,
  Input,
  InputType,
  InputValue,
  NumberValue,
  RadioValue,
  SelectOption,
  SelectValue,
  TextValue,
} from '$mct/types';

export type InputGroupOptions = {
  onChange: () => void;
  groupName: string;
};

export abstract class InputGroupBase {
  public el: HTMLElement;
  protected onChange: () => void;
  protected inputs: Input[] = [];
  protected type: InputType;
  public groupName: string;
  public initialName: string;
  // public initialName: string;
  public finalName!: string;
  // public id: string | null = null;

  constructor(el: HTMLElement, options: InputGroupOptions) {
    this.el = el;
    this.onChange = options.onChange;
    this.groupName = options.groupName;
    this.inputs = queryElements('input, select', this.el) as Input[];
    this.type = this.detectType();
    this.initialName = this.inputs.find((input) => !!input.name)?.name as string;

    this.baseInit();
  }

  protected baseInit(): void {
    this.formatInputNamesAndIDs();
    this.bindEventListeners();
    this.init();
  }

  protected abstract init(): void;

  protected formatInputNamesAndIDs(): void {
    this.finalName = `${this.groupName}-${this.initialName}`;

    if (this.type === 'radio' || this.type === 'checkbox') {
      this.inputs.forEach((input) => {
        const label = queryElement('label', input.parentElement as HTMLElement) as HTMLLabelElement;
        const name = this.finalName;
        const id = `${this.finalName}-${input.value}`;

        label.setAttribute('for', id);
        input.id = id;
        input.name = name;
      });
    } else {
      const label = queryElement('label', this.el) as HTMLLabelElement;
      const input = this.inputs[0];
      const nameAndID = this.finalName;

      label.setAttribute('for', nameAndID);
      input.name = nameAndID;
      input.id = nameAndID;
    }
  }

  protected bindEventListeners(): void {
    this.inputs.forEach((input) => {
      if (this.type === 'text' || this.type === 'number') {
        input.addEventListener('input', () => this.onChange());
      } else {
        input.addEventListener('change', () => this.onChange());
      }
    });
  }

  public isValid(): boolean {
    // Check if any of the inputs are invalid using the native validation API
    const hasInvalidInput = this.inputs.some((input) => !input.checkValidity());
    if (hasInvalidInput) return false;
    const value = this.getValue();

    // Additional type-specific validation
    if (this.type === 'radio') return typeof value === 'string' && value !== '';
    if (this.type === 'checkbox') {
      if (typeof value === 'boolean') return true; // Single checkbox is always valid if it exists
      return Array.isArray(value) && value.length > 0; // Multiple checkboxes need at least one selected
    }
    if (this.type === 'text') return typeof value === 'string' && value.trim() !== '';
    if (this.type === 'number') return typeof value === 'number' && !isNaN(value);
    if (this.type === 'select-one') return typeof value === 'string' && value !== '';

    return false;
  }

  protected detectType(): InputType {
    const input = queryElement('input, select', this.el) as Input;
    if (!input) throw new Error('No "input" element found in question item');

    if (input.type === 'radio') return 'radio';
    if (input.type === 'checkbox') return 'checkbox';
    if (input.type === 'text') return 'text';
    if (input.type === 'number') return 'number';
    if (input.type === 'select-one') return 'select-one';
    throw new Error(`Unsupported input type: ${input.type}`);
  }

  protected getRadioValue(): RadioValue | null {
    const checked = this.inputs.find((input) => (input instanceof HTMLInputElement ? input.checked : false));
    return checked?.value || null;
  }

  protected setRadioValue(value: RadioValue): void {
    const input = this.inputs.find((i) => i.value === value);
    if (!input || !(input instanceof HTMLInputElement)) throw new Error(`No radio input found with value: ${value}`);
    input.checked = true;
  }

  protected resetRadioInput(): void {
    this.inputs.forEach((input) => (input instanceof HTMLInputElement ? (input.checked = false) : null));
  }

  protected getCheckboxValues(): CheckboxValues {
    // If there's only one checkbox, return true/false
    if (this.inputs.length === 1) {
      const input = this.inputs[0];
      return input instanceof HTMLInputElement ? input.checked : false;
    }

    // For multiple checkboxes, return array of checked values
    const checked = this.inputs.filter((input) => (input instanceof HTMLInputElement ? input.checked : false));
    return checked.map((input) => input.value);
  }

  protected setCheckboxValues(values: CheckboxValues): void {
    // If there's only one checkbox and value is boolean
    if (this.inputs.length === 1 && typeof values === 'boolean') {
      const input = this.inputs[0];
      if (input instanceof HTMLInputElement) input.checked = values;
      return;
    }

    // For multiple checkboxes, value should be an array
    if (Array.isArray(values)) {
      this.inputs.forEach((input) =>
        input instanceof HTMLInputElement ? (input.checked = values.includes(input.value)) : null
      );
    }
  }

  protected resetCheckboxeInputs(): void {
    this.inputs.forEach((input) => (input instanceof HTMLInputElement ? (input.checked = false) : null));
  }

  protected getTextValue(): TextValue | null {
    const input = this.inputs[0];
    return input ? input.value : null;
  }

  protected setTextValue(value: TextValue): void {
    const input = this.inputs[0];
    if (!input) throw new Error('No text input found for text question');
    input.value = value;
  }

  protected resetTextInputs(): void {
    const input = this.inputs[0];
    if (!input) throw new Error('No text input found for text question');
    input.value = '';
  }

  protected getNumberValue(): NumberValue | null {
    const input = this.inputs[0];
    if (!input) return null;

    const value = input.value.trim();
    if (!value) return null;

    const number = parseFloat(value);
    return isNaN(number) ? null : number;
  }

  protected setNumberValue(value: NumberValue): void {
    const input = this.inputs[0];
    if (!input) throw new Error('No number input found for number question');
    input.value = value.toString();
  }

  protected resetNumberInput(): void {
    const input = this.inputs[0];
    if (!input) throw new Error('No number input found for number question');
    input.value = '';
  }

  protected getSelectValue(): SelectValue | null {
    const input = this.inputs[0];
    if (!input) return null;
    return input.value;
  }

  protected setSelectValue(value: SelectValue): void {
    const input = this.inputs[0];
    if (!input) throw new Error('No select input found for select question');
    input.value = value;
  }

  protected resetSelectInput(): void {
    const input = this.inputs[0];
    if (!input) throw new Error('No select input found for select question');
    input.value = '';
  }

  protected setSelectOptions(options: SelectOption[]): void {
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
