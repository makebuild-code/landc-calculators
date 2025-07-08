import { classes } from '$mct/config';
import { attr } from './constants';
import type { FormManager } from './Manager_Base';
import { lendersAPI } from '$mct/api';
import type { Answers, SelectOption } from '$mct/types';
import { StatefulInputGroup, type StatefulInputGroupOptions, type StatefulInputGroupState } from '$mct/components';

interface QuestionOptions extends StatefulInputGroupOptions<QuestionState> {
  formManager: FormManager;
  indexInGroup: number;
}

interface QuestionState extends StatefulInputGroupState {
  isVisible: boolean;
  isRequired: boolean;
  errorMessage: string;
  isActive: boolean;
  isEnabled: boolean;
}

export class QuestionComponent extends StatefulInputGroup<QuestionState> {
  private formManager: FormManager;
  public indexInGroup: number;
  public dependsOn: string | null;
  public dependsOnValue: string | null;

  constructor(options: QuestionOptions) {
    super({
      ...options,
      extendedInitialState: {
        // Only provide the Question-specific properties
        isVisible: false,
        isRequired: false,
        errorMessage: '',
        isActive: false,
        isEnabled: false,
      },
    });

    this.formManager = options.formManager;
    this.onEnter = options.onEnter;
    this.indexInGroup = options.indexInGroup;
    this.dependsOn = this.getAttribute(attr.dependsOn) || null;
    this.dependsOnValue = this.getAttribute(attr.dependsOnValue) || null;

    console.log(this.formManager);
  }

  protected init(): void {
    this.log('QuestionComponent: init');
    if (this.isInitialized) return;

    this.isInitialized = true;

    // Call the abstract initialization method
    this.log('QuestionComponent: calling onInit');
    this.onInit();

    // Call the lender select handler
    this.handleLenderSelect();

    // Set up Question-specific event handlers
    this.setupQuestionEventListeners();

    this.log('QuestionComponent: init complete');
  }

  // Test method to verify the component is working
  public testState(): void {
    console.log('QuestionComponent state:', this.getState());
    console.log('QuestionComponent isVisible:', this.getStateValue('isVisible'));
    console.log('QuestionComponent isRequired:', this.getStateValue('isRequired'));
    console.log('QuestionComponent isActive:', this.getStateValue('isActive'));
    console.log('QuestionComponent isEnabled:', this.getStateValue('isEnabled'));
  }

  private async handleLenderSelect(): Promise<void> {
    if (this.getStateValue('initialName') !== 'Lender') return;

    try {
      const lenders = await lendersAPI.getAll();
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

  protected setupQuestionEventListeners(): void {
    this.inputs.forEach((input) => {
      console.log('setupQuestionEventListeners', input);
      if (this.getStateValue('type') === 'text' || this.getStateValue('type') === 'number') {
        // input.addEventListener('input', () => this.onChange());
        input.addEventListener('input', () => this.handleChange());
      } else {
        // input.addEventListener('change', () => this.onChange());
        input.addEventListener('change', () => this.handleChange());
      }
      input.addEventListener('keydown', (event: Event) => {
        const ke = event as KeyboardEvent;
        if (ke.key !== 'Enter') return;
        if (this.isValid()) {
          this.onEnter();
        } else {
          this.onChange();
        }
      });
    });
  }

  public updateVisualState(isValid: boolean): void {
    this.toggleClass(this.element, 'has-error');
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
    this.removeStyle(this.element, 'display');
    this.setStateValue('isVisible', true);
  }

  public unrequire(): void {
    this.formManager.removeQuestion(this);
    this.addStyle(this.element, 'display', 'none');
    this.setStateValue('isVisible', false);
  }

  public toggleActive(active?: boolean): void {
    if (active === undefined) {
      this.toggleClass(this.element, classes.active);
    } else {
      this.toggleClass(this.element, classes.active, active);
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
}
