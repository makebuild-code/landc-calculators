import { lendersAPI } from '$mct/api';
import { StatefulInputGroup, type StatefulInputGroupOptions, type StatefulInputGroupState } from '$mct/components';
import { DOM_CONFIG } from '$mct/config';
import type { Answers, SelectOption } from '$mct/types';
import type { FormManager } from './Manager_Base';

const attr = DOM_CONFIG.attributes.form;
const classes = DOM_CONFIG.classes;

interface QuestionOptions extends StatefulInputGroupOptions<QuestionState> {
  formManager: FormManager;
  indexInGroup: number;
}

interface QuestionState extends StatefulInputGroupState {
  isVisible: boolean;
  dependsOn: string | null;
  dependsOnValue: string | null;
}

export class QuestionComponent extends StatefulInputGroup<QuestionState> {
  private formManager: FormManager;
  public indexInGroup: number;

  constructor(options: QuestionOptions) {
    super(options);

    this.formManager = options.formManager;
    this.onEnter = options.onEnter;
    this.indexInGroup = options.indexInGroup;
  }

  protected init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.onInit();

    const dependsOn = this.getAttribute(attr.dependsOn);
    const dependsOnValue = this.getAttribute(attr.dependsOnValue);
    if (dependsOn) this.setStateValue('dependsOn', dependsOn);
    if (dependsOnValue) this.setStateValue('dependsOnValue', dependsOnValue);

    // Call the lender select handler
    if (this.getStateValue('initialName') === 'Lender') this.handleLenderSelect();

    this.log('QuestionComponent: init complete');
  }

  // Test method to verify the component is working
  public testState(): void {
    console.log('QuestionComponent state:', this.getState());
    console.log('QuestionComponent isVisible:', this.getStateValue('isVisible'));
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

    const dependsOn = this.getStateValue('dependsOn');
    const dependsOnValue = this.getStateValue('dependsOnValue');

    if (!dependsOn) return true; // question depends on nothing
    if (!dependsOnValue) return answers[dependsOn] !== null; // question depends on a prior question being answered, no specific value
    return answers[dependsOn] === dependsOnValue; // question depends on a prior question being answered, with a specific value
  }
}
