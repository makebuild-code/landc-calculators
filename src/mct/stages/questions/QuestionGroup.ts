/**
 * class for managing a group of questions
 */

import { classes } from 'src/mct/shared/constants';

import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import { attr } from './constants';
import { QuestionItem } from './QuestionItem';
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
    this.answers[question.name] = question.getValue()?.toString() ?? '';
    this.evaluateVisibility();
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
    this.questions.forEach((question) => {
      const shouldBeVisible = question.shouldBeVisible(this.answers);

      if (shouldBeVisible && question.isHidden) {
        question.show();
        question.isHidden = false;
      } else {
        question.hide();
        question.isHidden = true;

        // Edge case: you're on a question that just became hidden
        if (this.currentQuestionIndex === i) {
          this.advance(); // or call recursively to skip forward
        }
      }
    });
  }

  public advance(): void {
    const currentItem = this.getCurrentQuestion();
    currentItem.disable();
    currentItem.el.classList.remove(classes.active);

    const nextIndex = this.currentQuestionIndex + 1;

    while (nextIndex < this.questions.length && this.questions[nextIndex].isHidden) {
      nextIndex++;
    }

    if (nextIndex < this.questions.length) {
      this.currentQuestionIndex = nextIndex;
      const nextItem = this.getCurrentQuestion();
      nextItem.enable();
      nextItem.focus();
      nextItem.el.classList.add(classes.active);
      this.scrollTo(nextItem);
      this.onInputChange(nextItem.isValid() ?? false);
      updateNavigation({ prevEnabled: true });
    } else {
      // Trigger stage completion or manager progression
    }
  }

  public goBack(): void {
    const prevIndex = this.currentQuestionIndex - 1;
    if (prevIndex < 0) return;

    const currentItem = this.getCurrentQuestion();
    currentItem.disable();
    currentItem.el.classList.remove(classes.active);

    this.currentQuestionIndex = prevIndex;
    const prevItem = this.getCurrentQuestion();

    while (prevIndex < this.questions.length && this.questions[prevIndex].isHidden) {
      prevIndex -= 1;
    }

    prevItem.enable();
    prevItem.focus();
    prevItem.el.classList.add(classes.active);
    this.scrollTo(prevItem);

    this.onInputChange(prevItem.isValid() ?? false);
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
