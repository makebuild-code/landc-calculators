import { lendersAPI } from '$mct/api';
import { StatefulInputGroup, type StatefulInputGroupOptions, type StatefulInputGroupState } from '$mct/components';
import { DOM_CONFIG } from '$mct/config';
import { InputKeysENUM, type Inputs, type SelectOption } from '$mct/types';
import type { FormManager } from './Manager_Base';

const attr = DOM_CONFIG.attributes.form;
const classes = DOM_CONFIG.classes;

interface QuestionOptions extends StatefulInputGroupOptions<QuestionState> {
  formManager: FormManager;
}

interface QuestionState extends StatefulInputGroupState {
  isVisible: boolean;
  isRequired: boolean;
  dependsOn: string | null;
  dependsOnValue: string | null;
}

export class QuestionComponent extends StatefulInputGroup<QuestionState> {
  private formManager: FormManager;
  private parent: HTMLElement;

  constructor(options: QuestionOptions) {
    super(options);

    this.formManager = options.formManager;
    this.parent = this.element.parentElement as HTMLElement;
    this.onEnter = options.onEnter;
    this.debug = true;
  }

  protected onInit(): void {
    this.setStateValue('isVisible', false);
    this.setStateValue('isRequired', false);

    const dependsOn = this.getAttribute(attr.dependsOn) || null;
    const dependsOnValue = this.getAttribute(attr.dependsOnValue) || null;
    this.setStateValue('dependsOn', dependsOn);
    this.setStateValue('dependsOnValue', dependsOnValue);

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
      console.error('Failed to fetch lenders:', error);
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
    this.formManager.saveQuestion(this);
  }

  public unrequire(): void {
    this.setStateValue('isRequired', false);
    this.formManager.removeQuestion(this);
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
    if (!dependsOnValue) return answers[dependsOn as InputKeysENUM] !== null; // question depends on a prior question being answered, no specific value
    return answers[dependsOn as InputKeysENUM] === dependsOnValue; // question depends on a prior question being answered, with a specific value
  }
}
