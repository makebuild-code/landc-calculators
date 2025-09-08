import { StatefulComponent, type StatefulComponentConfig } from './StatefulComponent';
import {
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
  context: string | undefined;
  groupName: string;
  indexInGroup: number;
  initialName: string;
  finalName: string;
}

export interface StatefulInputGroupConfig extends StatefulComponentConfig {
  onChange: () => void;
  onEnter: () => void;
  context?: string;
  groupName: string;
  indexInGroup: number;
}

export abstract class StatefulInputGroup<
  T extends StatefulInputGroupState = StatefulInputGroupState,
> extends StatefulComponent<T> {
  protected onChange: () => void; // The function to call when the input group changes
  protected onEnter: () => void; // The function to call when the user presses enter
  protected inputs: Input[] = []; // The inputs in the input group

  constructor(config: StatefulInputGroupConfig, customState?: Partial<T>) {
    const initialState: T = {
      // Base state
      value: null,
      isValid: false,
      isInitialised: false,
      type: 'text',
      context: config.context,
      groupName: config.groupName,
      indexInGroup: config.indexInGroup,
      initialName: '',
      finalName: '',
      // Custom state extensions
      ...customState,
    } as T;

    super(config, initialState);

    this.onChange = config.onChange;
    this.onEnter = config.onEnter;
  }

  protected init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Initialise inputs and detect type
    this.inputs = this.queryElements('input, select, textarea') as Input[];
    const type = this.detectType();
    this.setStateValue('type', type);

    // Get initial name
    const initialName = this.inputs.find((input) => !!input.name)?.name as string;
    this.setStateValue('initialName', initialName);

    // Get value
    this.setStateValue('value', this.getValue());

    // Format names and IDs
    this.formatInputNamesAndIDs();

    // Mark as initialised
    this.setStateValue('isInitialised', true);

    // Bind event listeners using new component system
    if (this.autoBindEvents) this.bindEvents();

    // Call the abstract initialization method
    this.onInit();
  }

  protected abstract onInit(): void;

  protected formatInputNamesAndIDs(): void {
    const context = this.getStateValue('context');
    const groupName = this.getStateValue('groupName');
    const initialName = this.getStateValue('initialName');
    const finalName = `${context ? `${context}-` : ''}${groupName}-${initialName}-${this.getStateValue('indexInGroup')}`;
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
    this.inputs.forEach((input) => this.bindInputEvents(input));

    this.addEventListener({
      element: this.element,
      event: 'keydown',
      handler: (event: Event) => {
        const ke = event as KeyboardEvent;
        if (ke.key !== 'Enter') return;
        this.handleEnter();
      },
    });
  }

  protected bindInputEvents(input: Input): void {
    if (this.getStateValue('type') === 'text' || this.getStateValue('type') === 'number') {
      this.addEventListener({ element: input, event: 'input', handler: () => this.handleChange() });
    } else {
      this.addEventListener({ element: input, event: 'change', handler: () => this.handleChange() });
    }
  }

  protected saveValueAndValidity(): void {
    const value = this.getValue();
    const isValid = this.isValid();
    this.setState({ value, isValid } as Partial<T>);
  }

  protected handleChange(): void {
    this.saveValueAndValidity();
    this.onChange();

    // // Emit change event
    // this.emit(FormEventNames.ANSWERS_SAVED, {
    //   value,
    //   isValid,
    //   type: this.getStateValue('type'),
    //   groupName: this.getStateValue('groupName'),
    //   finalName: this.getStateValue('finalName'),
    // });
  }

  protected handleEnter(): void {
    this.saveValueAndValidity();

    // If the input is not valid, do not call the onEnter callback
    if (!this.isValid()) return;
    this.onEnter();

    // this.emit(FormEventNames.INPUT_ON_ENTER, {
    //   value,
    //   isValid,
    //   type: this.getStateValue('type'),
    //   groupName: this.getStateValue('groupName'),
    //   finalName: this.getStateValue('finalName'),
    // });
  }

  public isValid(): boolean {
    // Check if any of the inputs are invalid using the native validation API
    const hasInvalidInput = this.inputs.some((input) => !input.checkValidity());
    if (hasInvalidInput) return false;

    const value = this.getValue();
    const type = this.getStateValue('type');

    let isValid = false;

    console.log('[StatefulInputGroup] isValid', { value, type, isValid, component: this });

    // Additional type-specific validation
    switch (type) {
      case 'radio':
        isValid = typeof value === 'string' && value !== '';
        break;
      case 'checkbox':
        isValid = typeof value === 'boolean' ? true : Array.isArray(value) && value.length > 0;
        break;
      case 'text':
        isValid = typeof value === 'string' && value.trim() !== '';
        break;
      case 'number':
        isValid = typeof value === 'number' && !isNaN(value);
        break;
      case 'select-one':
        const select = this.inputs[0] as HTMLSelectElement;
        const selectedOption = select.options[select.selectedIndex];
        console.log('[StatefulInputGroup] select-one', {
          value,
          type,
          isValid,
          select,
          selectedOption,
        });
        // isValid = typeof value === 'string' && select?.selectedIndex > 0;
        isValid = typeof value === 'string' && selectedOption.getAttribute('value') === value;
        break;
    }

    return isValid;
  }

  // protected onStateChange(previousstate: T, currentState: T): void {
  //   // Update visual state based on validation
  //   if (this.hasStateChanged('isValid')) {
  //     this.toggleClass(this.element, 'is-invalid', !currentState.isValid);
  //   }
  // }

  protected detectType(): InputType {
    const input = this.inputs[0];
    if (!input) throw new Error('No "input" element found in question item');

    if (input.type === 'radio') return 'radio';
    if (input.type === 'checkbox') return 'checkbox';
    if (input.type === 'text') return 'text';
    if (input.type === 'number') return 'number';
    if (input.type === 'select-one') return 'select-one';
    if (input.type === 'email') return 'text';
    if (input.type === 'tel') return 'text';
    if (input.type === 'textarea') return 'text';
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
    const input = this.inputs[0] as HTMLInputElement;
    if (!input) return null;

    const value = input.valueAsNumber;
    return isNaN(value) ? null : value;
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

  protected setSelectValue(value?: SelectValue): void {
    const input = this.inputs[0];
    if (!input) throw new Error('No select input found for select question');
    input.value = value || '';
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
      if (option.value) optionEl.value = option.value;
      optionEl.text = option.label;
      if (option.dataset) {
        Object.entries(option.dataset).forEach(([key, value]) => {
          optionEl.dataset[key] = value;
        });
      }
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
        if (typeof value !== 'boolean' || !Array.isArray(value))
          throw new Error('Value for checkbox question must be boolean or an array');
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
        // check to see if the options have a value that matches the value
        // set that as the value if so, else default to the first option
        const select = this.inputs[0] as HTMLSelectElement;
        const selectedOption = [...select.options].find((option) => option.getAttribute('value') === value);
        if (selectedOption) this.setSelectValue(value);
        else this.setSelectValue();
        break;
      default:
        throw new Error(`Unsupported question type: ${this.getStateValue('type')}`);
    }

    this.saveValueAndValidity();
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
