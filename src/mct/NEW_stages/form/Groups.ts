/**
 * class for managing a group of questions
 */

import { queryElement } from '$utils/dom/queryElement';
import { queryElements } from '$utils/dom/queryelements';

import { DOM_CONFIG } from '$mct/config';
import { QuestionComponent } from './Questions';
import { trackGAEvent } from '$utils/analytics/trackGAEvent';
import { generateSummaryLines, generateProductsAPIInput, logError } from '$mct/utils';
import { productsAPI } from '$mct/api';
import type { ProductsResponse, SummaryInfo, SummaryLines } from '$mct/types';
import { FormEventNames, GroupNameENUM } from '$mct/types';
import type { MainFormManager } from './Manager';
import { StatefulComponent, type StatefulComponentOptions } from '$mct/components';
import { MCTManager } from '$mct/manager';

const attr = DOM_CONFIG.attributes.form;
const classes = DOM_CONFIG.classes;

export interface BaseGroupState {
  isVisible: boolean;
  name: GroupNameENUM | null;
}

export interface BaseGroupOptions extends StatefulComponentOptions<BaseGroupState> {}

// @description: Base class for all groups
export abstract class BaseGroup extends StatefulComponent {
  constructor(options: BaseGroupOptions) {
    super(options);

    const name = this.element.getAttribute(attr.group) as GroupNameENUM | null;
    this.setStateValue('name', name);
  }
}

export interface QuestionGroupState extends BaseGroupState {
  questions: QuestionComponent[];
  activeQuestionIndex: number;
}

export interface QuestionGroupOptions extends BaseGroupOptions {}

// @description: Base class for all question groups
export abstract class QuestionGroup extends BaseGroup {
  constructor(options: QuestionGroupOptions) {
    super(options);

    // this.setStateValue('questions', []);
    // this.setStateValue('activeQuestionIndex', 0);
  }

  // abstract handleChange(index: number): void;

  // abstract handleEnter(index: number): void;

  protected show(): void {
    this.removeStyle(this.element, 'display');
    this.setStateValue('isVisible', true);
    this.updateActiveQuestions();
  }

  protected hide(): void {
    this.addStyle(this.element, 'display', 'none');
    this.setStateValue('isVisible', false);
    this.updateActiveQuestions();
  }

  protected updateActiveQuestions(): void {
    /**
     * Update:
     * - Don't save answers to MCT here
     * - This will show the questions that should be visible based on the storage
     * - Answers will need to be rendered on page load for this to display nicely
     */

    const currentAnswers = MCTManager.getAnswers();
    const questions = this.getStateValue('questions') as QuestionComponent[];

    questions.forEach((question) => {
      const shouldBeVisible = question.shouldBeVisible(currentAnswers, this.getStateValue('isVisible'));
      shouldBeVisible ? question.require() : question.unrequire();
    });
  }

  public isComplete(): boolean {
    const questions = this.getStateValue('questions') as QuestionComponent[];
    return questions.filter((question) => !question.getStateValue('dependsOn')).every((question) => question.isValid());
  }

  public reset(): void {
    const questions = this.getStateValue('questions') as QuestionComponent[];
    if (questions.length === 0) return;
    questions.forEach((question) => question.reset());
  }
}

// @description: Class for managing a main group of questions
export class MainGroup extends QuestionGroup {
  constructor(options: QuestionGroupOptions) {
    super(options);

    this.setStateValue('questions', this.initQuestions());
    // this.formManager.components.scroll = queryElement(`[${attr.components}="scroll"]`) as HTMLElement;
    // console.log('init: updateActiveQuestions');
    this.updateActiveQuestions();
  }

  protected bindEvents(): void {
    /**
     * 1.
     */

    this.eventBus.on(FormEventNames.NAVIGATION_UPDATE, (data) => this.handleNavigationUpdate(data));
  }

  private initQuestions(): QuestionComponent[] {
    const questionEls = this.queryElements(`[${attr.question}]`) as HTMLElement[];
    return questionEls.map((element, index) => {
      const question = new QuestionComponent({
        element,
        onChange: () => this.handleChange(index),
        onEnter: () => this.handleEnter(index),
        indexInGroup: index,
        groupName: this.getStateValue('name'),
      });

      // Initialize the component
      question.initialise();

      if (index !== 0) question.disable();
      if (question.getStateValue('dependsOn')) question.unrequire();
      return question;
    });
  }

  public handleChange(index: number): void {
    console.log('handleChange', index);
    if (index !== this.getStateValue('activeQuestionIndex'))
      throw new Error(`Invalid question index: ${index}. Expected: ${this.getStateValue('activeQuestionIndex')}`);
    console.log('handleChange: updateActiveQuestions');

    const question = this.getStateValue('questions')[index];

    console.log('handleChange: updateActiveQuestions');
    // this.formManager.saveAnswersToMCT();
    this.updateActiveQuestions();
    // this.formManager.updateGroupVisibility();
    // this.formManager.prepareWrapper();
    this.handleNextButton(question.isValid());

    // console.log('handleChange, sending GA event');
    trackGAEvent('form_interaction', {
      event_category: 'MCTForm',
      event_label: `MCT_${question.getStateValue('finalName')}`,
    });
  }

  public handleEnter(index: number): void {
    if (index !== this.getStateValue('activeQuestionIndex'))
      throw new Error(`Invalid question index: ${index}. Expected: ${this.getStateValue('activeQuestionIndex')}`);

    const current = this.getActiveQuestion();
    if (current.isValid()) {
      this.navigate('next');
    } else {
      current.updateVisualState(false);
    }
  }

  public handleNextButton(isValid: boolean) {
    this.eventBus.emit(FormEventNames.NAVIGATION_UPDATE, { nextEnabled: isValid });
  }

  public getActiveQuestion(): QuestionComponent {
    return this.getStateValue('questions')[this.getStateValue('activeQuestionIndex')];
  }

  public getVisibleQuestions(): QuestionComponent[] {
    const questions = this.getStateValue('questions') as QuestionComponent[];
    return questions.filter((question) => question.getStateValue('isVisible'));
  }

  public getNextVisibleIndex(start: number): number {
    const questions = this.getStateValue('questions') as QuestionComponent[];
    let index = start + 1;
    while (index < questions.length && !questions[index].getStateValue('isVisible')) index += 1;
    return index;
  }

  public getPrevVisibleIndex(start: number): number {
    const questions = this.getStateValue('questions') as QuestionComponent[];
    let index = start - 1;
    while (index >= 0 && !questions[index].getStateValue('isVisible')) index -= 1;
    return index;
  }

  public navigate(direction: 'next' | 'prev') {
    // this.formManager.saveAnswersToMCT();
    const activeQuestion = this.getActiveQuestion();
    this.deactivateQuestion(activeQuestion);

    if (direction === 'next') {
      const nextIndex = this.getNextVisibleIndex(this.getStateValue('activeQuestionIndex'));

      // If there's a next question in this group
      if (nextIndex < this.getStateValue('questions').length) {
        this.setStateValue('activeQuestionIndex', nextIndex);
        const nextQuestion = this.getActiveQuestion();
        this.activateQuestion(nextQuestion);
        // this.formManager.updateNavigation({ prevEnabled: true });
        this.eventBus.emit(FormEventNames.NAVIGATION_UPDATE, { prevEnabled: true });
      } else {
        // If we're at the end of this group, try the next group
        // this.formManager.navigateToNextGroup();
        this.eventBus.emit(FormEventNames.GROUP_COMPLETE, { groupName: this.getStateValue('name') });
      }
    } else {
      const prevIndex = this.getPrevVisibleIndex(this.getStateValue('activeQuestionIndex'));

      // If there's a previous question in this group
      if (prevIndex >= 0) {
        this.setStateValue('activeQuestionIndex', prevIndex);
        const prevItem = this.getActiveQuestion();
        this.activateQuestion(prevItem);
        // this.formManager.updateNavigation({
        //   prevEnabled: !(this.formManager.activeGroupIndex === 0 && prevIndex === 0),
        // });

        this.eventBus.emit(FormEventNames.NAVIGATION_UPDATE, {
          prevEnabled: !(this.getStateValue('activeGroupIndex') === 0 && prevIndex === 0),
        });
      } else {
        // If we're at the start of this group, try the previous group
        const prevGroup = this.formManager.getPreviousGroupInSequence();
        if (prevGroup) this.formManager.navigateToPreviousGroup();

        this.eventBus.emit(FormEventNames.GOTOPREVGROUP, {
          prevEnabled: !(this.getStateValue('activeGroupIndex') === 0 && prevIndex === 0),
        });
      }
    }
  }

  public activateQuestion(question: QuestionComponent): void {
    question.enable();
    question.focus();
    question.toggleActive(true);
    this.scrollToQuestion(question);
    this.handleNextButton(question.isValid());
  }

  private deactivateQuestion(question: QuestionComponent): void {
    question.disable();
    question.toggleActive(false);
  }

  private scrollToQuestion(item: QuestionComponent): void {
    this.formManager.components.scroll.scrollTo({
      top:
        item.getElement().offsetTop -
        this.formManager.components.scroll.offsetHeight / 2 +
        item.getElement().offsetHeight / 2,
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
    const input = generateProductsAPIInput();
    try {
      return await productsAPI.search(input);
    } catch (error) {
      return logError('Failed to fetch products:', { data: error, returnNull: true }) as null;
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
