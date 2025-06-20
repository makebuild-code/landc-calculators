/**
 * class for managing a group of questions
 */

import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import { attr } from './constants';
import { Question } from './Questions';
import type { MainFormManager, FormManager } from './Manager';
import type { GroupName } from './types';

export abstract class BaseGroup {
  protected component: HTMLElement;
  protected manager: FormManager;
  public isVisible: boolean = false;
  public name: GroupName | null = null;

  constructor(component: HTMLElement, manager: FormManager) {
    this.component = component;
    this.manager = manager;
    this.name = component.getAttribute(attr.group) as GroupName | null;
  }

  public getComponent(): HTMLElement {
    return this.component;
  }

  public show(): void {
    this.component.style.removeProperty('display');
    this.isVisible = true;
  }

  public hide(): void {
    this.component.style.display = 'none';
    this.isVisible = false;
  }
}

export abstract class QuestionGroup extends BaseGroup {
  public questions: Question[] = [];
  public activeQuestionIndex: number = 0;

  constructor(component: HTMLElement, manager: FormManager) {
    super(component, manager);
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

  public reset(): void {
    if (this.questions.length === 0) return;
    this.questions.forEach((question) => question.reset());
  }
}

export class MainGroup extends QuestionGroup {
  protected manager: MainFormManager;

  constructor(component: HTMLElement, manager: MainFormManager) {
    super(component, manager);
    this.manager = manager;
    this.questions = this.initQuestions();
    this.manager.components.scroll = queryElement(`[${attr.components}="scroll"]`) as HTMLElement;
    this.evaluateVisibility();
  }

  private initQuestions(): Question[] {
    const questionEls = queryElements(`[${attr.question}]`, this.component) as HTMLElement[];
    return questionEls.map((el, index) => {
      const question = new Question(el, {
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

  public getActiveQuestion(): Question {
    return this.questions[this.activeQuestionIndex];
  }

  public getVisibleQuestions(): Question[] {
    return this.questions.filter((question) => question.isVisible);
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

  public activateQuestion(question: Question): void {
    question.enable();
    question.focus();
    question.toggleActive(true);
    this.scrollToQuestion(question);
    this.handleNextButton(question.isValid());
  }

  private deactivateQuestion(question: Question): void {
    question.disable();
    question.toggleActive(false);
  }

  private scrollToQuestion(item: Question): void {
    this.manager.components.scroll.scrollTo({
      top: item.el.offsetTop - this.manager.components.scroll.offsetHeight / 2 + item.el.offsetHeight / 2,
      behavior: 'smooth',
    });
  }
}

export class OutputGroup extends BaseGroup {
  protected manager: MainFormManager;
  public outputs: HTMLSpanElement[] = [];

  constructor(component: HTMLElement, manager: MainFormManager) {
    super(component, manager);
    this.manager = manager;
    this.outputs = queryElements(`[${attr.output}]`, this.component) as HTMLSpanElement[];
  }

  public getComponent(): HTMLElement {
    return this.component;
  }

  public scrollToOutput(): void {
    this.manager.components.scroll.scrollTo({
      top: this.component.offsetTop - this.manager.components.scroll.offsetHeight / 2 + this.component.offsetHeight / 2,
      behavior: 'smooth',
    });
  }

  updateOutputs(data: { [key: string]: string }) {
    this.outputs.forEach((output) => {
      const key = output.getAttribute(attr.output);
      if (key) {
        output.textContent = data[key];
      }
    });
  }
}
