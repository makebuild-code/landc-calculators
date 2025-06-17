/**
 * class for managing a group of questions
 */

import { manager } from 'src/mct/shared/manager';

import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import { attr } from './constants';
import { QuestionItem } from './QuestionItem';
import type { ProfileName } from './types';
import { prepareWrapper } from './utils/prepareWrapper';
import { updateNavigation } from './utils/updateNavigation';

export class QuestionGroup {
  private groupEl: HTMLElement;
  public onInputChange: (isValid: boolean) => void;
  public questions: QuestionItem[];
  public currentQuestionIndex: number = 0;
  private scroll: HTMLElement;
  public profileName: ProfileName | null = null;

  constructor(groupEl: HTMLElement, onInputChange: (isValid: boolean) => void) {
    this.groupEl = groupEl;
    this.onInputChange = onInputChange;
    this.questions = this.initQuestions();
    this.scroll = queryElement(`[${attr.components}="scroll"]`) as HTMLElement;
    this.profileName = groupEl.getAttribute(attr.group) as ProfileName | null;
    this.evaluateVisibility();
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
      if (question.dependsOn) question.hide();
      return question;
    });
  }

  private onItemChange(index: number): void {
    if (index !== this.currentQuestionIndex)
      throw new Error(`Invalid question index: ${index}. Expected: ${this.currentQuestionIndex}`);

    const question = this.questions[index];
    this.evaluateVisibility();
    prepareWrapper();
    this.onInputChange(question.isValid());
  }

  private handleEnter(index: number): void {
    if (index !== this.currentQuestionIndex)
      throw new Error(`Invalid question index: ${index}. Expected: ${this.currentQuestionIndex}`);

    const current = this.getCurrentQuestion();
    if (current.isValid()) {
      this.onInputChange(current.isValid());
      this.navigate('next');
    } else {
      current.updateVisualState(false);
    }
  }

  public getCurrentQuestion(): QuestionItem {
    return this.questions[this.currentQuestionIndex];
  }

  private evaluateVisibility(): void {
    manager.refreshVisibleQuestionAnswers();
    const currentAnswers = manager.getQuestionAnswers();
    console.log('Evaluating visibility for group:', this.profileName);
    console.log('Current answers:', currentAnswers);

    this.questions.forEach((question, index) => {
      const shouldBeVisible = question.shouldBeVisible(currentAnswers);
      console.log(`Question ${index} (${question.el.getAttribute(attr.item)}):`, {
        shouldBeVisible,
        dependsOn: question.dependsOn,
        currentState: question.isVisible ? 'visible' : 'hidden',
      });

      if (shouldBeVisible) {
        question.show();
      } else {
        question.hide();
      }
    });
  }

  public getNextVisibleIndex(start: number): number {
    let index = start + 1;
    while (index < this.questions.length && !this.questions[index].isVisible) {
      index += 1;
    }
    return index;
  }

  public getPrevVisibleIndex(start: number): number {
    let index = start - 1;
    while (index >= 0 && !this.questions[index].isVisible) {
      index -= 1;
    }
    return index;
  }

  public navigate(direction: 'next' | 'prev') {
    const currentItem = this.getCurrentQuestion();
    this.deactivateQuestion(currentItem);

    console.log(this.questions);

    if (direction === 'next') {
      const nextIndex = this.getNextVisibleIndex(this.currentQuestionIndex);

      console.log('nextIndex', nextIndex);

      // If there's a next question in this group
      if (nextIndex < this.questions.length) {
        console.log('nextIndex is valid');
        this.currentQuestionIndex = nextIndex;
        const nextQuestion = this.getCurrentQuestion();
        this.activateQuestion(nextQuestion);
        updateNavigation({ prevEnabled: true });
      } else {
        // If we're at the end of this group, try the next group
        const nextGroup = manager.getNextGroupInSequence();
        if (nextGroup) manager.navigateToNextGroup();
      }
    } else {
      const prevIndex = this.getPrevVisibleIndex(this.currentQuestionIndex);

      // If there's a previous question in this group
      if (prevIndex >= 0) {
        this.currentQuestionIndex = prevIndex;
        const prevItem = this.getCurrentQuestion();
        this.activateQuestion(prevItem);
        updateNavigation({
          prevEnabled: !(manager.getActiveGroupIndex() === 0 && prevIndex === 0),
        });
      } else {
        // If we're at the start of this group, try the previous group
        const prevGroup = manager.getPreviousGroupInSequence();
        if (prevGroup) manager.navigateToPreviousGroup();
      }
    }
  }

  public activateQuestion(question: QuestionItem): void {
    question.enable();
    question.focus();
    question.toggleActive(true);
    this.scrollTo(question);
    this.onInputChange(question.isValid());
  }

  private deactivateQuestion(question: QuestionItem): void {
    question.disable();
    question.toggleActive(false);
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
    this.groupEl.style.removeProperty('display');
  }

  public hide(): void {
    this.groupEl.style.display = 'none';
  }

  public reset(): void {
    this.questions.forEach((question) => question.reset());
  }
}
