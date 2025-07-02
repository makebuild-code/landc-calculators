/**
 * class for managing a group of questions
 */

import { queryElement } from '$utils/dom/queryElement';
import { queryElements } from '$utils/dom/queryelements';

import { attr } from './constants';
import { Question } from './Questions';
import type { FormManager } from './Manager_Base';
import { classes } from 'src/mct/shared/constants';
import { trackGAEvent } from '$utils/analytics/trackGAEvent';
import { generateSummaryLines, generateProductsAPIInput, logError } from '$mct/utils';
import { fetchProducts } from '$mct/api';
import type { ProductsResponse, SummaryInfo, SummaryLines } from '$mct/types';
import { GroupNameENUM } from '$mct/types';
import type { MainFormManager } from './Manager_Main';

// @description: Base class for all groups
export abstract class BaseGroup {
  protected component: HTMLElement;
  protected formManager: FormManager;
  public isVisible: boolean = false;
  public name: GroupNameENUM | null = null;

  constructor(component: HTMLElement, formManager: FormManager) {
    this.component = component;
    this.formManager = formManager;
    this.name = component.getAttribute(attr.group) as GroupNameENUM | null;
  }

  public getComponent(): HTMLElement {
    return this.component;
  }

  protected abstract show(): void;
  protected abstract hide(): void;
}

// @description: Base class for all question groups
export abstract class QuestionGroup extends BaseGroup {
  public questions: Question[] = [];
  public activeQuestionIndex: number = 0;

  constructor(component: HTMLElement, formManager: FormManager) {
    super(component, formManager);
  }

  abstract handleChange(index: number): void;

  abstract handleEnter(index: number): void;

  public show(): void {
    this.component.style.removeProperty('display');
    this.isVisible = true;
    this.updateActiveQuestions();
  }

  public hide(): void {
    this.component.style.display = 'none';
    this.isVisible = false;
    this.updateActiveQuestions();
  }

  public updateActiveQuestions(): void {
    this.formManager.saveAnswersToMCT();
    const currentAnswers = this.formManager.getAnswers();

    this.questions.forEach((question) => {
      const shouldBeVisible = question.shouldBeVisible(currentAnswers, this.isVisible);
      shouldBeVisible ? question.require() : question.unrequire();
    });
  }

  public isComplete(): boolean {
    return this.questions.filter((question) => !question.dependsOn).every((question) => question.isValid());
  }

  public reset(): void {
    if (this.questions.length === 0) return;
    this.questions.forEach((question) => question.reset());
  }
}

// @description: Class for managing a main group of questions
export class MainGroup extends QuestionGroup {
  protected formManager: MainFormManager;

  constructor(component: HTMLElement, formManager: MainFormManager) {
    super(component, formManager);
    this.formManager = formManager;
    this.questions = this.initQuestions();
    this.formManager.components.scroll = queryElement(`[${attr.components}="scroll"]`) as HTMLElement;
    this.updateActiveQuestions();
  }

  private initQuestions(): Question[] {
    const questionEls = queryElements(`[${attr.question}]`, this.component) as HTMLElement[];
    return questionEls.map((el, index) => {
      const question = new Question(el, {
        formManager: this.formManager,
        onChange: () => this.handleChange(index),
        onEnter: () => this.handleEnter(index),
        indexInGroup: index,
        groupName: this.name as string,
      });

      if (index !== 0) question.disable();
      if (question.dependsOn) question.unrequire();
      return question;
    });
  }

  public handleChange(index: number): void {
    if (index !== this.activeQuestionIndex)
      throw new Error(`Invalid question index: ${index}. Expected: ${this.activeQuestionIndex}`);

    const question = this.questions[index];

    console.log(question);
    console.log(question.isValid());
    this.updateActiveQuestions();
    this.formManager.updateGroupVisibility();
    this.formManager.prepareWrapper();
    this.handleNextButton(question.isValid());
    trackGAEvent('form_interaction', {
      event_category: 'MCTForm',
      event_label: `MCT_${question.name}`,
    });
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
    this.formManager.updateNavigation({ nextEnabled: isValid });
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
    this.formManager.saveAnswersToMCT();
    const activeQuestion = this.getActiveQuestion();
    this.deactivateQuestion(activeQuestion);

    if (direction === 'next') {
      const nextIndex = this.getNextVisibleIndex(this.activeQuestionIndex);

      // If there's a next question in this group
      if (nextIndex < this.questions.length) {
        this.activeQuestionIndex = nextIndex;
        const nextQuestion = this.getActiveQuestion();
        this.activateQuestion(nextQuestion);
        this.formManager.updateNavigation({ prevEnabled: true });
      } else {
        // If we're at the end of this group, try the next group
        this.formManager.navigateToNextGroup();
      }
    } else {
      const prevIndex = this.getPrevVisibleIndex(this.activeQuestionIndex);

      // If there's a previous question in this group
      if (prevIndex >= 0) {
        this.activeQuestionIndex = prevIndex;
        const prevItem = this.getActiveQuestion();
        this.activateQuestion(prevItem);
        this.formManager.updateNavigation({
          prevEnabled: !(this.formManager.activeGroupIndex === 0 && prevIndex === 0),
        });
      } else {
        // If we're at the start of this group, try the previous group
        const prevGroup = this.formManager.getPreviousGroupInSequence();
        if (prevGroup) this.formManager.navigateToPreviousGroup();
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
    this.formManager.components.scroll.scrollTo({
      top: item.el.offsetTop - this.formManager.components.scroll.offsetHeight / 2 + item.el.offsetHeight / 2,
      behavior: 'smooth',
    });
  }
}

// @description: Output group of questions
export class OutputGroup extends BaseGroup {
  protected formManager: MainFormManager;
  private card: HTMLElement;
  private loader: HTMLElement;
  private response: ProductsResponse | null = null;
  private summaryInfo: SummaryInfo | null = null;
  private outputs: HTMLDivElement[];
  private button: HTMLButtonElement;

  constructor(component: HTMLElement, formManager: MainFormManager) {
    super(component, formManager);
    this.formManager = formManager;
    this.card = queryElement(`[${attr.element}="output-card"]`, this.component) as HTMLElement;
    this.loader = queryElement(`[${attr.element}="output-loader"]`, this.component) as HTMLElement;
    this.outputs = queryElements(`[${attr.output}]`, this.component) as HTMLDivElement[];
    this.button = queryElement(`[${attr.element}="get-results"]`, this.component) as HTMLButtonElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.button.addEventListener('click', () => this.navigateToResults());
  }

  // public getComponent(): HTMLElement {
  //   return this.component;
  // }

  public show(): void {
    this.component.style.removeProperty('display');
    this.isVisible = true;
  }

  public hide(): void {
    this.component.style.display = 'none';
    this.isVisible = false;
  }

  private scrollToOutput(): void {
    this.formManager.components.scroll.scrollTo({
      top:
        this.component.offsetTop -
        this.formManager.components.scroll.offsetHeight / 2 +
        this.component.offsetHeight / 2,
      behavior: 'smooth',
    });
  }

  private showLoader(show: boolean): void {
    if (show) {
      this.loader.style.removeProperty('display');
    } else {
      this.loader.style.display = 'none';
    }
  }

  public activate(): void {
    this.card.classList.add(classes.active);
    this.scrollToOutput();
    this.handleProducts();
  }

  private async handleProducts(): Promise<void> {
    this.showLoader(true);
    this.button.disabled = true;
    this.response = await this.fetchProducts();
    if (!this.response) {
      logError('No products response');
      return;
    }

    this.summaryInfo = this.response.result.SummaryInfo;

    this.updateOutputs();
    this.showLoader(false);
    this.button.disabled = false;
  }

  private async fetchProducts(): Promise<ProductsResponse | null> {
    const input = generateProductsAPIInput(this.formManager.getAnswers());
    try {
      const response = await fetchProducts(input);
      return response;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return null;
    }
  }

  private updateOutputs(): void {
    if (!this.summaryInfo) return;

    const summaryLines = generateSummaryLines(this.summaryInfo, this.formManager.getAnswers());
    if (!summaryLines) return;

    this.outputs.forEach((output) => {
      const key = output.getAttribute(attr.output) as keyof SummaryLines;
      output.innerHTML = summaryLines[key];
    });
  }

  private navigateToResults(): void {
    this.formManager.navigateToNextGroup();
  }
}
