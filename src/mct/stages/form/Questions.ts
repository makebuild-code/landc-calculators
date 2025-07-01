/**
 * class for individual questions
 */

import { classes } from 'src/mct/shared/constants';
import { attr } from './constants';
import type { Answers } from 'src/mct/shared/types';
import type { FormManager } from './Manager';
import { fetchLenders } from 'src/mct/shared/api/fetchLenders';
import { InputGroupBase, type InputGroupOptions } from 'src/mct/shared/classes/InputGroupBase';

type QuestionOptions = {
  formManager: FormManager;
  onEnter: () => void;
  indexInGroup: number;
} & InputGroupOptions;

type SelectOption = {
  value: string;
  label: string;
};

export class Question extends InputGroupBase {
  private formManager: FormManager;
  private onEnter: () => void;
  public dependsOn: string | null;
  public dependsOnValue: string | null;
  public isVisible: boolean = false;
  // public name: string;

  public indexInGroup: number;

  constructor(el: HTMLElement, options: QuestionOptions) {
    super(el, options);
    this.formManager = options.formManager;
    this.onEnter = options.onEnter;
    this.dependsOn = this.el.getAttribute(attr.dependsOn) || null;
    this.dependsOnValue = this.el.getAttribute(attr.dependsOnValue) || null;
    this.indexInGroup = options.indexInGroup;
    // this.name = this.el.getAttribute(attr.question) as string;
  }

  protected init(): void {
    this.handleLenderSelect();
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

  protected bindEventListeners(): void {
    this.inputs.forEach((input) => {
      if (this.type === 'text' || this.type === 'number') {
        input.addEventListener('input', () => this.onChange());
      } else {
        input.addEventListener('change', () => this.onChange());
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
}
