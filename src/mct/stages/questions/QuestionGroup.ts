/**
 * class for managing a group of questions
 */

import { manager } from 'src/mct/shared/manager';

import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import { attr } from './constants';
import { QuestionItem } from './QuestionItem';
import { prepareWrapper } from './utils/prepareWrapper';
import { updateNavigation } from './utils/updateNavigation';

export class QuestionGroup {
  private groupEl: HTMLElement;
  private onInputChange: (isValid: boolean) => void;
  public questions: QuestionItem[];
  public currentQuestionIndex: number = 0;
  private scroll: HTMLElement;
  private answers: Record<string, string> = {};

  constructor(groupEl: HTMLElement, onInputChange: (isValid: boolean) => void) {
    this.groupEl = groupEl;
    this.onInputChange = onInputChange;
    this.questions = this.initQuestions();
    this.scroll = queryElement(`[${attr.components}="scroll"]`) as HTMLElement;
  }

  private initQuestions(): QuestionItem[] {
    const questionEls = queryElements(`[${attr.item}]`, this.groupEl) as HTMLElement[];
    return questionEls.map((el, index) => {
      const question = new QuestionItem(
        el,
        () => this.onItemChange(index),
        () => this.handleEnter(index)
      );
      if (index !== 0) question.disable();
      if (question.dependsOn && question.dependsOnValue) {
        question.hide();
        question.isHidden = true;
      }
      return question;
    });
  }

  private onItemChange(index: number): void {
    if (index !== this.currentQuestionIndex)
      throw new Error(`Invalid question index: ${index}. Expected: ${this.currentQuestionIndex}`);

    const question = this.questions[index];
    manager.setAnswer(question.name, question.getValue()?.toString() ?? ''); // @todo handle possible values
    this.evaluateVisibility();
    prepareWrapper();
    this.onInputChange(question.isValid());
  }

  private handleEnter(index: number): void {
    if (index !== this.currentQuestionIndex)
      throw new Error(`Invalid question index: ${index}. Expected: ${this.currentQuestionIndex}`);

    const current = this.getCurrentQuestion();
    if (current.isValid()) {
      this.advance();
      this.onInputChange(this.getCurrentQuestion().isValid() ?? false);
    } else {
      current.updateVisualState(false);
    }
  }

  public getCurrentQuestion(): QuestionItem {
    return this.questions[this.currentQuestionIndex];
  }

  private evaluateVisibility(): void {
    const currentAnswers = manager.getAnswers();

    this.questions.forEach((question) => {
      const shouldBeVisible = question.shouldBeVisible(currentAnswers);

      if (shouldBeVisible) {
        question.show();
      } else {
        question.hide();

        // @todo: handle the case where the current question is hidden
        // // Edge case: you're on a question that just became hidden
        // if (this.currentQuestionIndex === i) {
        //   this.advance(); // or call recursively to skip forward
        // }
      }
    });
  }

  private getNextVisibleIndex(start: number): number {
    let index = start + 1;
    while (index < this.questions.length && this.questions[index].isHidden) {
      index += 1;
    }
    return index;
  }

  public advance(): void {
    const currentItem = this.getCurrentQuestion();
    currentItem.disable();
    currentItem.toggleActive(false);

    const nextIndex = this.getNextVisibleIndex(this.currentQuestionIndex);
    if (nextIndex < this.questions.length) {
      this.currentQuestionIndex = nextIndex;
      const nextItem = this.getCurrentQuestion();
      nextItem.enable();
      nextItem.focus();
      nextItem.toggleActive(true);
      this.scrollTo(nextItem);
      this.onInputChange(nextItem.isValid());
      updateNavigation({ prevEnabled: true });
    } else {
      // Trigger stage completion or manager progression
    }
  }

  private getPrevVisibleIndex(start: number): number {
    let index = start - 1;
    while (index >= 0 && this.questions[index].isHidden) {
      index -= 1;
    }
    return index;
  }

  public goBack(): void {
    const prevIndex = this.getPrevVisibleIndex(this.currentQuestionIndex);
    if (prevIndex < 0) return;

    const currentItem = this.getCurrentQuestion();
    currentItem.disable();
    currentItem.toggleActive(false);

    this.currentQuestionIndex = prevIndex;
    const prevItem = this.getCurrentQuestion();

    prevItem.enable();
    prevItem.focus();
    prevItem.toggleActive(true);
    this.scrollTo(prevItem);

    this.onInputChange(prevItem.isValid());
  }

  private scrollTo(item: QuestionItem): void {
    this.scroll.scrollTo({
      top: item.el.offsetTop - this.scroll.offsetHeight / 2 + item.el.offsetHeight / 2,
      behavior: 'smooth',
    });
  }

  // public getAnswers(): Record<string, any> {
  //   /* ... */
  // }

  // public validate(): boolean {
  //   /* ... */
  // }

  public show(): void {
    this.groupEl.classList.remove('is-hidden');
  }

  public hide(): void {
    this.groupEl.classList.add('is-hidden');
  }

  public reset(): void {
    this.questions.forEach((question) => question.reset());
  }
}
