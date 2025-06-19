/**
 * class for managing a group of questions
 */

import { questionsManager } from 'src/mct/stages/questions/QuestionsManager';

import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import { attr } from './constants';
import { QuestionItem } from './QuestionItem';
import type { ProfileName } from './types';
import { utils } from './utils';

export class QuestionGroup {
  private groupEl: HTMLElement;
  public onInputChange: (isValid: boolean) => void;
  public questions: QuestionItem[];
  public activeQuestionIndex: number = 0;
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
    if (index !== this.activeQuestionIndex)
      throw new Error(`Invalid question index: ${index}. Expected: ${this.activeQuestionIndex}`);

    const question = this.questions[index];
    this.evaluateVisibility();
    utils.prepareWrapper();
    this.onInputChange(question.isValid());
  }

  private handleEnter(index: number): void {
    if (index !== this.activeQuestionIndex)
      throw new Error(`Invalid question index: ${index}. Expected: ${this.activeQuestionIndex}`);

    const current = this.getActiveQuestion();
    if (current.isValid()) {
      this.navigate('next');
    } else {
      current.updateVisualState(false);
    }
  }

  public getActiveQuestion(): QuestionItem {
    return this.questions[this.activeQuestionIndex];
  }

  private evaluateVisibility(): void {
    questionsManager.refreshAnswers();
    const currentAnswers = questionsManager.getAnswers();

    this.questions.forEach((question) => {
      const shouldBeVisible = question.shouldBeVisible(currentAnswers);

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
    questionsManager.refreshAnswers();
    const activeQuestion = this.getActiveQuestion();
    this.deactivateQuestion(activeQuestion);

    if (direction === 'next') {
      const nextIndex = this.getNextVisibleIndex(this.activeQuestionIndex);

      // If there's a next question in this group
      if (nextIndex < this.questions.length) {
        this.activeQuestionIndex = nextIndex;
        const nextQuestion = this.getActiveQuestion();
        this.activateQuestion(nextQuestion);
        utils.updateNavigation({ prevEnabled: true });
      } else {
        // If we're at the end of this group, try the next group
        questionsManager.navigateToNextGroup();
      }
    } else {
      const prevIndex = this.getPrevVisibleIndex(this.activeQuestionIndex);

      // If there's a previous question in this group
      if (prevIndex >= 0) {
        this.activeQuestionIndex = prevIndex;
        const prevItem = this.getActiveQuestion();
        this.activateQuestion(prevItem);
        utils.updateNavigation({
          prevEnabled: !(questionsManager.getActiveGroupIndex() === 0 && prevIndex === 0),
        });
      } else {
        // If we're at the start of this group, try the previous group
        const prevGroup = questionsManager.getPreviousGroupInSequence();
        if (prevGroup) questionsManager.navigateToPreviousGroup();
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
