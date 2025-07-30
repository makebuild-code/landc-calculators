/**
 * class for managing a group of questions
 */

import { queryElement } from '$utils/dom/queryElement';
import { queryElements } from '$utils/dom/queryelements';

import { DOM_CONFIG, EVENTS_CONFIG } from '$mct/config';
import { QuestionComponent } from './Questions';
import type { FormManager } from './Manager_Base';
import { dataLayer } from '$utils/analytics/dataLayer';
import { generateSummaryLines, generateProductsAPIInput, logError } from '$mct/utils';
import { productsAPI } from '$mct/api';
import type { ProductsResponse, SummaryInfo, SummaryLines } from '$mct/types';
import { FormEventNames, GroupNameENUM, MCTEventNames, StageIDENUM } from '$mct/types';
import type { MainFormManager } from './Manager_Main';
import { MCTManager } from '$mct/manager';
import { EventBus } from '$mct/components';

const attr = DOM_CONFIG.attributes.form;
const classes = DOM_CONFIG.classes;

export interface GroupOptions {
  component: HTMLElement;
  formManager: FormManager;
  index: number;
}

// @description: Base class for all groups
export abstract class BaseGroup {
  protected component: HTMLElement;
  protected formManager: FormManager;
  protected eventBus: EventBus;
  public isVisible: boolean = false;
  public name: GroupNameENUM | null = null;
  public index: number;

  constructor(options: GroupOptions) {
    this.component = options.component;
    this.formManager = options.formManager;
    this.eventBus = EventBus.getInstance();
    this.index = options.index;
    this.name = options.component.getAttribute(attr.group) as GroupNameENUM | null;
  }

  public getComponent(): HTMLElement {
    return this.component;
  }

  protected abstract show(): void;
  protected abstract hide(): void;
}

// @description: Base class for all question groups
export abstract class QuestionGroup extends BaseGroup {
  public questions: QuestionComponent[] = [];
  public activeQuestionIndex: number = 0;

  constructor(options: GroupOptions) {
    super(options);
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

  /**
   * When a question changes:
   *
   * if it is the expected index
   * - run as is
   *
   * if it is greater than the expected index
   * - something has gone wrong
   *
   * if it is less than the expected index
   *
   * & we're in the current group
   * - go from the first index
   */

  public updateActiveQuestions(): void {
    /**
     * Update:
     * - Don't save answers to MCT here
     * - This will show the questions that should be visible based on the storage
     * - Answers will need to be rendered on page load for this to display nicely
     */

    this.formManager.saveAnswersToMCT();
    const currentAnswers = this.formManager.getAnswers();

    this.questions.forEach((question, index) => {
      const shouldBeVisible = question.shouldBeVisible(currentAnswers, this.isVisible);
      if (index === 0 && shouldBeVisible) question.activate();

      const isValid = question.isValid();
      if (shouldBeVisible && isValid) question.activate();
      else if (shouldBeVisible) question.require();
      else question.unrequire();
    });
  }

  public isComplete(): boolean {
    return this.questions
      .filter((question) => !question.getStateValue('dependsOn'))
      .every((question) => question.isValid());
  }

  public reset(): void {
    if (this.questions.length === 0) return;
    this.questions.forEach((question) => question.reset());
  }
}

// @description: Class for managing a main group of questions
export class MainGroup extends QuestionGroup {
  protected formManager: MainFormManager;

  constructor(options: GroupOptions) {
    super(options);
    this.formManager = options.formManager as MainFormManager;
    this.questions = this.initQuestions();
    this.updateActiveQuestions();
  }

  private initQuestions(): QuestionComponent[] {
    const questionEls = queryElements(`[${attr.question}]`, this.component) as HTMLElement[];
    return questionEls.map((element, index) => {
      const question = new QuestionComponent({
        element,
        debug: true,
        autoBindEvents: true,
        onChange: () => this.handleChange(index),
        onEnter: () => this.handleEnter(index),
        groupName: this.name as string,
        indexInGroup: index,
      });

      // Initialize the component
      question.initialise();

      if (index !== 0) question.disable();
      if (question.getStateValue('dependsOn')) question.unrequire();
      return question;
    });
  }

  /**
   * When a question changes, validate it and show the next question
   * @param index - the index of the question that changed
   */
  public handleChange(index: number): void {
    this.activeQuestionIndex = index;
    this.formManager.activeGroupIndex = this.index;
    this.formManager.updateNavigation({
      prevEnabled: this.index !== 0 && index !== 0,
      nextEnabled: this.name !== GroupNameENUM.Output && index !== this.questions.length - 1,
    });

    this.formManager.handleShowHideOnGroup();

    // Check if the question is valid, update the visual state and, if not valid, return
    const question = this.questions[index];
    const isValid = question.isValid();
    question.updateVisualState(isValid);
    this.onInputChange(isValid);
    if (!isValid) return;

    // If valid, update the active questions, group visibility and wrapper
    this.formManager.saveAnswersToMCT();
    this.updateActiveQuestions();
    this.formManager.updateGroupVisibility();

    // Show but do not scroll to the next question
    const nextIndex = this.getNextRequiredIndex(index);
    if (nextIndex < this.questions.length) {
      // this.activeQuestionIndex = nextIndex;
      const nextQuestion = this.getQuestionByIndex(nextIndex);
      nextQuestion.activate();
      this.formManager.updateNavigation({ prevEnabled: true });
    } else if (this.name !== GroupNameENUM.CustomerIdentifier && this.name !== GroupNameENUM.Output) {
      const outputGroup = this.formManager.getGroupByName(GroupNameENUM.Output) as OutputGroup;
      if (outputGroup) outputGroup.activate(false);
    }

    this.formManager.prepareWrapper();
    this.formManager.handleOutputGroupUpdate(isValid);
  }

  public handleEnter(index: number): void {
    this.navigate('next', index);
  }

  public onInputChange(isValid: boolean) {
    this.formManager.handleInputChange(isValid);
  }

  public getActiveQuestion(): QuestionComponent {
    return this.questions[this.activeQuestionIndex];
  }

  public getQuestionByIndex(index: number): QuestionComponent {
    return this.questions[index];
  }

  public getVisibleQuestions(): QuestionComponent[] {
    return this.questions.filter((question) => question.getStateValue('isVisible'));
  }

  public getRequiredQuestions(): QuestionComponent[] {
    return this.questions.filter((question) => question.getStateValue('isRequired'));
  }

  public getNextRequiredIndex(start: number): number {
    let index = start + 1;
    while (index < this.questions.length && !this.questions[index].getStateValue('isRequired')) {
      index += 1;
    }
    return index;
  }

  public getPrevVisibleIndex(start: number): number {
    let index = start - 1;
    while (index >= 0 && !this.questions[index].getStateValue('isVisible')) {
      index -= 1;
    }
    return index;
  }

  public navigate(direction: 'next' | 'prev', fromIndex?: number) {
    this.formManager.saveAnswersToMCT();
    const indexToUse = fromIndex || fromIndex === 0 ? fromIndex : this.activeQuestionIndex;
    const activeQuestion = this.getQuestionByIndex(indexToUse);

    if (direction === 'next') {
      // this.formManager.showHeader('sticky');
      dataLayer('form_interaction', {
        event_category: 'MCTForm',
        event_label: `MCT_Submit_${activeQuestion.getStateValue('finalName')}`,
        event_value: activeQuestion.getStateValue('value')?.toString(),
      });

      const nextIndex = this.getNextRequiredIndex(indexToUse);

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
    } else if (direction === 'prev') {
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

  public activateQuestion(question: QuestionComponent): void {
    question.activate();
    question.focus();
    this.formManager.scrollTo(question);
    this.onInputChange(question.isValid());
    this.formManager.handleOutputGroupUpdate(question.isValid());
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
  private activated: boolean = false;

  constructor(options: GroupOptions) {
    super(options);
    this.formManager = options.formManager as MainFormManager;
    this.card = queryElement(`[${attr.element}="output-card"]`, this.component) as HTMLElement;
    this.loader = queryElement(`[${attr.element}="output-loader"]`, this.component) as HTMLElement;
    this.outputs = queryElements(`[${attr.output}]`, this.component) as HTMLDivElement[];
    this.button = queryElement(`[${attr.element}="get-results"]`, this.component) as HTMLButtonElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.button.addEventListener('click', () => this.navigateToResults());
  }

  public update(): void {
    if (!this.activated) return;
    this.handleProducts();
  }

  public show(): void {
    this.component.style.removeProperty('display');
    this.eventBus.emit(FormEventNames.GROUP_SHOWN, { groupId: this.name as string });
    this.isVisible = true;
  }

  public hide(): void {
    this.component.style.display = 'none';
    this.eventBus.emit(FormEventNames.GROUP_HIDDEN, { groupId: this.name as string });
    this.isVisible = false;
  }

  private scrollTo(): void {
    this.formManager.scrollTo('bottom');
  }

  private showLoader(show: boolean): void {
    if (show) {
      this.loader.style.removeProperty('display');
    } else {
      this.loader.style.display = 'none';
    }
  }

  public activate(scrollTo: boolean = true): void {
    if (!this.activated) {
      // Log user event for end of questions
      MCTManager.logUserEvent({
        EventName: EVENTS_CONFIG.questionsComplete,
        EventValue: EVENTS_CONFIG.questionsComplete,
      });

      dataLayer('form_interaction', {
        event_category: 'MCTForm',
        event_label: `MCT_Show_Summary`,
        event_value: `MCT_BuyerType_${this.formManager.profileName}`,
      });
    }

    this.activated = true;
    this.card.classList.add(classes.active);
    if (scrollTo) this.scrollTo();
    this.update();
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

    this.formManager.toggleButton(this.formManager.getResultsButton, this.summaryInfo.NumberOfProducts > 0);

    this.updateOutputs();
    this.showLoader(false);

    if (this.response.result.Products.length === 0) {
      this.button.disabled = true;
    } else {
      this.button.disabled = false;
    }
  }

  private async fetchProducts(): Promise<ProductsResponse | null> {
    const input = generateProductsAPIInput();
    if (!input) return null;

    try {
      return await productsAPI.search(input);
    } catch (error) {
      return logError('Failed to fetch products:', { data: error, returnNull: true }) as null;
    }
  }

  private updateOutputs(): void {
    if (!this.summaryInfo) return;
    const hasProducts = this.summaryInfo.NumberOfProducts > 0;

    const summaryLines = generateSummaryLines(this.summaryInfo, this.formManager.getAnswers());
    if (!summaryLines) return;

    this.outputs.forEach((output) => {
      const key = output.getAttribute(attr.output) as keyof SummaryLines | 'NoProducts';

      if (key === 'NoProducts') {
        hasProducts ? (output.style.display = 'none') : output.style.removeProperty('display');
        return;
      } else if (key === 'ProductsAndLenders') {
        hasProducts ? output.style.removeProperty('display') : (output.style.display = 'none');
      }

      output.innerHTML = summaryLines[key];
    });
  }

  public navigateToResults(): void {
    this.eventBus.emit(MCTEventNames.STAGE_COMPLETE, { stageId: StageIDENUM.Questions });
  }
}
