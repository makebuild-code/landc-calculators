import { lendersAPI } from '$mct/api';
import { StatefulInputGroup, type StatefulInputGroupConfig, type StatefulInputGroupState } from '$mct/components';
import { DOM_CONFIG } from '$mct/config';
import { FormEventNames, InputKeysENUM, type Inputs, type SelectOption, type InputValue } from '$mct/types';
import { debugError } from '$utils/debug';

const attr = DOM_CONFIG.attributes.form;
const classes = DOM_CONFIG.classes;

interface QuestionConfig extends StatefulInputGroupConfig {
  source?: 'main' | 'sidebar';
}

interface QuestionState extends StatefulInputGroupState {
  isVisible: boolean;
  isRequired: boolean;
  dependsOn: InputKeysENUM | null;
  dependsOnValue: string | null;
}

export class QuestionComponent extends StatefulInputGroup<QuestionState> {
  private parent: HTMLElement;
  private name: string = '';
  private source: 'main' | 'sidebar' = 'main';

  constructor(config: QuestionConfig) {
    // Define the custom state extensions for QuestionComponent
    const customState: Partial<QuestionState> = {
      isVisible: false,
      isRequired: false,
      dependsOn: null,
      dependsOnValue: null,
      context: config.source,
    };

    super(config, customState);

    this.parent = this.element.parentElement as HTMLElement;
    this.source = config.source || 'main';
    this.debug = true;
  }

  protected onInit(): void {
    // Generate unique ID for cross-context identification
    this.name = this.getStateValue('initialName');

    // Set dependency attributes from DOM
    const dependsOn = this.getAttribute(attr.dependsOn) as InputKeysENUM | null;
    const dependsOnValue = this.getAttribute(attr.dependsOnValue) || null;
    this.setStateValue('dependsOn', dependsOn);
    this.setStateValue('dependsOnValue', dependsOnValue);

    // Listen for sync requests
    this.on(FormEventNames.QUESTIONS_SYNC_REQUESTED, (event) => {
      if (event.targetQuestionId === this.name && event.source !== this.source) {
        this.syncValue(event.value);
      }
    });

    // Call the lender select handler
    if (this.getStateValue('initialName') === 'Lender') this.handleLenderSelect();
  }

  private async handleLenderSelect(): Promise<void> {
    if (this.getStateValue('initialName') !== 'Lender') return;

    try {
      const response = await lendersAPI.getAll();
      const lenders = response
        .filter((lender) => lender.LenderName !== '' && lender.LenderName !== null)
        .sort((a, b) => a.LenderName.localeCompare(b.LenderName));

      const lenderOptions: SelectOption[] = [
        { label: 'Select a lender...' },
        ...lenders.map(
          (lender): SelectOption => ({
            value: lender.MasterLenderId.toString(),
            label: lender.LenderName,
          })
        ),
      ];

      this.setSelectOptions(lenderOptions);
    } catch (error) {
      debugError('Failed to fetch lenders:', error);
    }
  }

  public updateVisualState(isValid: boolean): void {
    this.toggleClass(this.element, 'has-error', !isValid);
  }

  public enable(): void {
    this.inputs.forEach((input) => {
      input.disabled = false;
    });
  }

  public disable(): void {
    this.inputs.forEach((input) => {
      input.disabled = true;
    });
  }

  public focus(): void {
    const input = this.inputs[0];
    if (!input) throw new Error('No input found to focus on');
    input.focus();
  }

  public require(): void {
    this.setStateValue('isRequired', true);
    this.emit(FormEventNames.QUESTION_REQUIRED, {
      question: this,
      questionId: this.name,
      groupName: this.getStateValue('groupName'),
    });
  }

  public unrequire(): void {
    this.setStateValue('isRequired', false);
    this.emit(FormEventNames.QUESTION_UNREQUIRED, {
      question: this,
      questionId: this.name,
      groupName: this.getStateValue('groupName'),
    });

    this.showQuestion(false);
  }

  public showQuestion(show: boolean): void {
    show ? this.show() : this.hide();
    this.parent.style.display = show ? 'block' : 'none'; // Hide or show the parent too
    this.setStateValue('isVisible', show);
  }

  public toggleActive(active?: boolean): void {
    active ? this.toggleClass(this.element, classes.active, active) : this.toggleClass(this.element, classes.active);
  }

  public activate(): void {
    this.require();
    this.enable();
    this.toggleActive(true);
    this.showQuestion(true);
  }

  public shouldBeVisible(answers: Inputs, groupIsVisible: boolean): boolean {
    // parent group is not visible
    if (!groupIsVisible) return false;

    const dependsOn = this.getStateValue('dependsOn');
    const dependsOnValue = this.getStateValue('dependsOnValue');

    if (!dependsOn) return true; // question depends on nothing
    if (!dependsOnValue) return answers[dependsOn] !== null; // question depends on a prior question being answered, no specific value
    return answers[dependsOn] === dependsOnValue; // question depends on a prior question being answered, with a specific value
  }

  // Override handleChange to emit events
  protected handleChange(): void {
    this.saveValueAndValidity();

    this.updateVisualState(this.isValid());

    // Emit enhanced QUESTION_CHANGED event
    const currentValue = this.getValue();
    if (currentValue !== null) {
      this.emit(FormEventNames.QUESTION_CHANGED, {
        question: this,
        name: this.name,
        groupName: this.getStateValue('groupName'),
        value: currentValue,
        source: this.source,
      });
    }

    // Still call onChange if provided (for backward compatibility)
    if (this.onChange) {
      this.onChange();
    }
  }

  // Method to sync value from another context
  private syncValue(value: InputValue | null): void {
    if (value !== null) {
      this.setValue(value);
    }
  }

  // Getters for event-driven communication
  public getQuestionName(): string {
    return this.name;
  }

  public getSource(): 'main' | 'sidebar' {
    return this.source;
  }

  public getGroupName(): string {
    return this.getStateValue('groupName');
  }

  public getInitialName(): string {
    return this.getStateValue('initialName');
  }

  public getFinalName(): string {
    return this.getStateValue('finalName');
  }

  public isRequired(): boolean {
    return this.getStateValue('isRequired');
  }

  public getStateValue<K extends keyof QuestionState>(key: K): QuestionState[K] {
    return this.state[key];
  }
}
