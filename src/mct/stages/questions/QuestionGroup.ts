/**
 * class for managing a group of questions
 */

import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import { attr } from './constants';
import { QuestionItem } from './QuestionItem';
import type { MainQuestionsManager, QuestionsManager } from './QuestionsManager';
import type { ProfileName } from './types';

export abstract class QuestionGroup {
  protected component: HTMLElement;
  protected manager: QuestionsManager;
  public questions: QuestionItem[] = [];
  public isVisible: boolean = false;
  public activeQuestionIndex: number = 0;
  public profileName: ProfileName | null = null;

  constructor(component: HTMLElement, manager: QuestionsManager) {
    this.component = component;
    this.manager = manager;
    this.profileName = component.getAttribute(attr.group) as ProfileName | null;
  }

  abstract handleChange(index: number): void;

  abstract handleEnter(index: number): void;

  public evaluateVisibility(): void {
    this.manager.refreshAnswers();
    const currentAnswers = this.manager.getAnswers();

    this.questions.forEach((question) => {
      const shouldBeVisible = question.shouldBeVisible(currentAnswers);

      if (shouldBeVisible) {
        question.show();
      } else {
        question.hide();
      }
    });
  }

  public show(): void {
    this.component.style.removeProperty('display');
    this.isVisible = true;
  }

  public hide(): void {
    this.component.style.display = 'none';
    this.isVisible = false;
  }

  public reset(): void {
    if (this.questions.length === 0) return;
    this.questions.forEach((question) => question.reset());
  }
}

export class MainQuestionGroup extends QuestionGroup {
  protected manager: MainQuestionsManager;
  private scroll: HTMLElement;

  constructor(component: HTMLElement, manager: MainQuestionsManager) {
    super(component, manager);
    this.manager = manager;
    this.questions = this.initQuestions();
    this.scroll = queryElement(`[${attr.components}="scroll"]`) as HTMLElement;
    this.evaluateVisibility();
  }

  private initQuestions(): QuestionItem[] {
    const questionEls = queryElements(`[${attr.item}]`, this.component) as HTMLElement[];
    return questionEls.map((el, index) => {
      const question = new QuestionItem(el, {
        onChange: () => this.handleChange(index),
        onEnter: () => this.handleEnter(index),
        manager: this.manager,
      });
      if (index !== 0) question.disable();
      if (question.dependsOn) {
        question.hide();
      }
      return question;
    });
  }

  public handleChange(index: number): void {
    if (index !== this.activeQuestionIndex)
      throw new Error(`Invalid question index: ${index}. Expected: ${this.activeQuestionIndex}`);

    const question = this.questions[index];
    this.evaluateVisibility();
    this.manager.prepareWrapper();
    this.handleNextButton(question.isValid());
  }

  public handleEnter(index: number): void {
    if (index !== this.activeQuestionIndex)
      throw new Error(`Invalid question index: ${index}. Expected: ${this.activeQuestionIndex}`);

    const current = this.getActiveQuestion();
    if (current.isValid()) {
      this.navigate('next');
    } else {
      current.updateVisualState(false);
    }
  }

  public handleNextButton(isValid: boolean) {
    this.manager.updateNavigation({ nextEnabled: isValid });
  }

  public getActiveQuestion(): QuestionItem {
    return this.questions[this.activeQuestionIndex];
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
    this.manager.refreshAnswers();
    const activeQuestion = this.getActiveQuestion();
    this.deactivateQuestion(activeQuestion);

    if (direction === 'next') {
      const nextIndex = this.getNextVisibleIndex(this.activeQuestionIndex);

      // If there's a next question in this group
      if (nextIndex < this.questions.length) {
        this.activeQuestionIndex = nextIndex;
        const nextQuestion = this.getActiveQuestion();
        this.activateQuestion(nextQuestion);
        this.manager.updateNavigation({ prevEnabled: true });
      } else {
        // If we're at the end of this group, try the next group
        this.manager.navigateToNextGroup();
      }
    } else {
      const prevIndex = this.getPrevVisibleIndex(this.activeQuestionIndex);

      // If there's a previous question in this group
      if (prevIndex >= 0) {
        this.activeQuestionIndex = prevIndex;
        const prevItem = this.getActiveQuestion();
        this.activateQuestion(prevItem);
        this.manager.updateNavigation({
          prevEnabled: !(this.manager.activeGroupIndex === 0 && prevIndex === 0),
        });
      } else {
        // If we're at the start of this group, try the previous group
        const prevGroup = this.manager.getPreviousGroupInSequence();
        if (prevGroup) this.manager.navigateToPreviousGroup();
      }
    }
  }

  public activateQuestion(question: QuestionItem): void {
    question.enable();
    question.focus();
    question.toggleActive(true);
    this.scrollTo(question);
    this.handleNextButton(question.isValid());
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
}
