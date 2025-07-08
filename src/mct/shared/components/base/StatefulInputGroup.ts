import { StatefulComponent, type StatefulComponentOptions } from './StatefulComponent';
import {
  FormEventNames,
  type AllEvents,
  type CheckboxValues,
  type Input,
  type InputType,
  type InputValue,
  type NumberValue,
  type RadioValue,
  type SelectOption,
  type SelectValue,
  type TextValue,
} from '$mct/types';

export interface StatefulInputGroupState {
  value: InputValue | null;
  isValid: boolean;
  isInitialised: boolean;
  type: InputType;
  groupName: string;
  initialName: string;
  finalName: string;
}

export interface StatefulInputGroupOptions<T extends StatefulInputGroupState = StatefulInputGroupState>
  extends Omit<StatefulComponentOptions<T>, 'initialState'> {
  extendedInitialState?: Partial<T>; // Additional state properties for extending classes
  initialState?: T; // Optional - will be auto-generated if extendedInitialState is provided
  onChange: () => void;
  onEnter: () => void;
  groupName: string;
}

export abstract class StatefulInputGroup<
  T extends StatefulInputGroupState = StatefulInputGroupState,
> extends StatefulComponent<T> {
  protected onChange: () => void; // The function to call when the input group changes
  protected onEnter: () => void; // The function to call when the user presses enter
  protected inputs: Input[] = []; // The inputs in the input group

  constructor(options: StatefulInputGroupOptions<T>) {
    // Use provided initialState or generate from base + extended
    const finalInitialState =
      options.initialState ||
      (() => {
        // Create base initialState
        const baseInitialState: StatefulInputGroupState = {
          value: null,
          isValid: false,
          isInitialised: false,
          type: 'text', // Will be set in onInit
          groupName: options.groupName,
          initialName: '', // Will be set in onInit
          finalName: '', // Will be set in onInit
        };

        // Merge base state with extended state
        return {
          ...baseInitialState,
          ...options.extendedInitialState,
        } as T;
      })();

    super({
      ...options,
      initialState: finalInitialState,
    });

    this.onChange = options.onChange;
    this.onEnter = options.onEnter;
  }

  protected onInit(): void {
    // Initialise inputs and detect type
    this.inputs = this.queryElements('input, select') as Input[];
    const type = this.detectType();
    this.setStateValue('type', type);

    // Get initial name
    const initialName = this.inputs.find((input) => !!input.name)?.name as string;
    this.setStateValue('initialName', initialName);

    // Format names and IDs
    this.formatInputNamesAndIDs();

    // Bind event listeners using new component system
    if (this.autoBindEvents) this.bindEvents();

    // Mark as initialised
    this.setStateValue('isInitialised', true);
  }

  // protected abstract init(): void;

  protected formatInputNamesAndIDs(): void {
    const groupName = this.getStateValue('groupName');
    const initialName = this.getStateValue('initialName');
    const finalName = `${groupName}-${initialName}`;
    this.setStateValue('finalName', finalName);

    if (this.getStateValue('type') === 'radio' || this.getStateValue('type') === 'checkbox') {
      this.inputs.forEach((input) => {
        const label = this.queryElement('label', input.parentElement as HTMLElement) as HTMLLabelElement;
        const name = finalName;
        const id = `${finalName}-${input.value}`;

        label.setAttribute('for', id);
        input.name = name;
        input.id = id;
      });
    } else {
      const label = this.queryElement('label') as HTMLLabelElement;
      const input = this.inputs[0];
      const nameAndID = finalName;

      label.setAttribute('for', nameAndID);
      input.name = nameAndID;
      input.id = nameAndID;
    }
  }

  protected bindEvents(): void {
    this.inputs.forEach((input) => {
      if (this.getStateValue('type') === 'text' || this.getStateValue('type') === 'number') {
        this.addEventListener({ element: input, event: 'input', handler: () => this.onChange() });
      } else {
        this.addEventListener({ element: input, event: 'change', handler: () => this.onChange() });
      }
    });

    this.addEventListener({
      element: this.element,
      event: 'keydown',
      handler: (event: Event) => {
        const ke = event as KeyboardEvent;
        if (ke.key !== 'Enter') return;
        this.onEnter();
      },
    });
  }

  protected handleChange(): void {
    console.log('handleChange');
    // Update value and validity
    const value = this.getValue();
    const isValid = this.isValid();

    // Update state and call the onChange callback
    this.setState({ value, isValid } as Partial<T>);
    this.onChange();

    // Emit change event
    this.emit(FormEventNames.INPUT_CHANGED, {
      value,
      isValid,
      type: this.getStateValue('type'),
      groupName: this.getStateValue('groupName'),
      finalName: this.getStateValue('finalName'),
    });
  }

  protected handleEnter(event: Event): void {
    console.log('handleEnter');
    // Check if the enter key was pressed
    const ke = event as KeyboardEvent;
    if (ke.key !== 'Enter') return;

    // Update value and validity
    const value = this.getValue();
    const isValid = this.isValid();

    // Update state and call the onEnter callback
    this.setState({ value, isValid } as Partial<T>);

    // If the input is not valid, do not call the onEnter callback
    if (!isValid) return;
    this.onEnter();

    this.emit(FormEventNames.INPUT_ON_ENTER, {
      value,
      isValid,
      type: this.getStateValue('type'),
      groupName: this.getStateValue('groupName'),
      finalName: this.getStateValue('finalName'),
    });
  }

  public isValid(): boolean {
    // Check if any of the inputs are invalid using the native validation API
    const hasInvalidInput = this.inputs.some((input) => !input.checkValidity());
    if (hasInvalidInput) return false;

    const value = this.getValue();
    const type = this.getStateValue('type');

    // Additional type-specific validation
    if (type === 'radio') return typeof value === 'string' && value !== '';
    if (type === 'checkbox') {
      if (typeof value === 'boolean') return true; // Single checkbox is always valid if it exists
      return Array.isArray(value) && value.length > 0; // Multiple checkboxes need at least one selected
    }
    if (type === 'text') return typeof value === 'string' && value.trim() !== '';
    if (type === 'number') return typeof value === 'number' && !isNaN(value);
    if (type === 'select-one') return typeof value === 'string' && value !== '';

    return false;
  }

  protected onStateChange(previousstate: T, currentState: T): void {
    // Update visual state based on validation
    if (this.hasStateChanged('isValid')) {
      this.toggleClass(this.element, 'is-invalid', !currentState.isValid);
    }
  }

  protected detectType(): InputType {
    const input = this.queryElement('input, select') as Input;
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
    switch (this.getStateValue('type')) {
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
        throw new Error(`Unsupported question type: ${this.getStateValue('type')}`);
    }
  }

  public setValue(value: InputValue): void {
    switch (this.getStateValue('type')) {
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
        throw new Error(`Unsupported question type: ${this.getStateValue('type')}`);
    }
  }

  public getLabels(): string[] {
    const checked = this.inputs.filter((input) => {
      if (input instanceof HTMLInputElement) return input.checked;
      return false;
    });
    const labelEls = checked.map((input) => this.queryElement(`label[for="${input.id}"]`) as HTMLLabelElement);
    return labelEls.map((label) => label.textContent as string);
  }

  public reset(): void {
    switch (this.getStateValue('type')) {
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
        throw new Error(`Unsupported question type: ${this.getStateValue('type')}`);
    }
  }
}
