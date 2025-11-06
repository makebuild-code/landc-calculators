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
import {
  CalculationKeysENUM,
  FormEventNames,
  GroupNameENUM,
  InputKeysENUM,
  MCTEventNames,
  StageIDENUM,
} from '$mct/types';
import { MainFormManager } from './Manager_Main';
import { MCTManager } from '$mct/manager';
import { StatefulComponent } from '$mct/components';
import { QuestionFactory } from './QuestionFactory';
import type { Sidebar } from '../results/Sidebar';
import { debugLog } from '$utils/debug';

const attr = DOM_CONFIG.attributes.form;
const classes = DOM_CONFIG.classes;

export interface GroupOptions {
  element: HTMLElement;
  formManager: FormManager;
  index: number;
}

export interface GroupState {
  isVisible: boolean;
  isActive: boolean;
  isComplete: boolean;
  name: GroupNameENUM | null;
  index: number;
}

// @description: Base class for all groups
export abstract class BaseGroup<T extends GroupState = GroupState> extends StatefulComponent<T> {
  protected formManager: FormManager;

  constructor(options: GroupOptions, initialState: T) {
    super(
      {
        element: options.element,
        debug: true,
        eventNamespace: `group-${initialState.name || 'unknown'}`,
      },
      initialState
    );

    this.formManager = options.formManager;
  }

  public get name(): GroupNameENUM | null {
    return this.state.name;
  }

  public get index(): number {
    return this.state.index;
  }

  public get isVisible(): boolean {
    return this.state.isVisible;
  }

  /**
   * Initialize the group component
   */
  public initialise(): void {
    this.init();
  }

  // Note: bindEvents() is inherited from InteractiveComponent
  // show() and hide() are implemented by subclasses as needed
}

export interface QuestionGroupState extends GroupState {
  activeQuestionIndex: number;
  validQuestions: Set<string>;
  totalQuestions: number;
  completedQuestions: number;
}

// @description: Base class for all question groups
export abstract class QuestionGroup extends BaseGroup<QuestionGroupState> {
  public questions: QuestionComponent[] = [];

  constructor(options: GroupOptions) {
    const name = options.element.getAttribute(attr.group) as GroupNameENUM | null;
    const initialState: QuestionGroupState = {
      isVisible: false,
      isActive: false,
      isComplete: false,
      name,
      index: options.index,
      activeQuestionIndex: 0,
      validQuestions: new Set(),
      totalQuestions: 0,
      completedQuestions: 0,
    };

    super(options, initialState);
  }

  public get activeQuestionIndex(): number {
    return this.state.activeQuestionIndex;
  }

  public set activeQuestionIndex(value: number) {
    this.setState({ activeQuestionIndex: value });
  }

  abstract handleChange(index: number): void;

  abstract handleEnter(index: number): void;

  protected bindEvents(): void {
    // // Listen to question changes
    // this.on(FormEventNames.QUESTION_CHANGED, (event) => {
    //   if (this.questions.some((q) => q.getQuestionName && q.getQuestionName() === event.name)) {
    //     this.updateGroupState();
    //   }
    // });
    // // Listen to question validation
    // this.on(FormEventNames.QUESTION_VALIDATED, (event) => {
    //   if (this.questions.some((q) => q.getQuestionName && q.getQuestionName() === event.name)) {
    //     this.updateGroupState();
    //   }
    // });
  }

  public updateGroupState(): void {
    const validQuestions = new Set<string>();
    let completedQuestions = 0;
    let isComplete = true;

    this.questions.forEach((q) => {
      const isValid = q.isValid();
      const isRequired = q.isRequired();
      if (isValid) {
        validQuestions.add(q.getQuestionName());
        completedQuestions += 1;
      } else if (isRequired) isComplete = false;
    });

    this.setState({
      validQuestions,
      completedQuestions,
      isComplete,
      totalQuestions: this.questions.length,
    });
  }

  public show(): void {
    this.element.style.removeProperty('display');
    this.setState({ isVisible: true });
    this.updateActiveQuestions();
  }

  public hide(): void {
    this.element.style.display = 'none';
    this.setState({ isVisible: false });
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

  public updateActiveQuestions(preVisible: boolean = false): void {
    const context = this.formManager instanceof MainFormManager ? 'main' : 'sidebar';
    if (this.formManager instanceof MainFormManager) this.formManager.saveAnswersToMCT();
    const currentAnswers = MCTManager.getAnswers(context);

    this.questions.forEach((question, index) => {
      const shouldBeVisible = question.shouldBeVisible(currentAnswers, preVisible ? true : this.isVisible);
      const isValid = question.isValid();

      if (index === 0 && shouldBeVisible && context === 'main') {
        question.activate();
      } else if (shouldBeVisible && context === 'sidebar') {
        question.updateVisualState(isValid);
        question.activate();
      } else if (shouldBeVisible && isValid) {
        question.activate();
      } else if (shouldBeVisible) {
        question.require();
      } else {
        question.unrequire();
      }
    });

    const lenderQuestion = this.questions.find((q) => q.getStateValue('initialName') === InputKeysENUM.Lender);
    if (!lenderQuestion) return;

    const lenderQuestionIndex = this.questions.indexOf(lenderQuestion);
    const allBeforeLenderAreValid = this.questions
      .slice(0, lenderQuestionIndex)
      .filter((q) => q.shouldBeVisible(currentAnswers, this.isVisible))
      .every((q) => q.isValid());

    if (allBeforeLenderAreValid && lenderQuestion.isRequired()) {
      lenderQuestion.activate();
    } else {
      lenderQuestion.unrequire();
    }
  }

  public isComplete(): boolean {
    return this.getStateValue('isComplete');
  }

  public reset(): void {
    if (this.questions.length === 0) return;
    this.questions.forEach((question) => question.reset());
  }
}

// @description: Class for managing a main group of questions
export class MainGroup extends QuestionGroup {
  protected formManager: MainFormManager | Sidebar;

  constructor(options: GroupOptions) {
    super(options);
    this.formManager = options.formManager as MainFormManager;

    const source = options.formManager instanceof MainFormManager ? 'main' : 'sidebar';
    this.questions = this.initQuestions(source);
    this.updateActiveQuestions();
  }

  protected onInit(): void {
    super.onInit();
    this.setState({ totalQuestions: this.questions.length });
  }

  protected initQuestions(source: 'main' | 'sidebar' = 'main'): QuestionComponent[] {
    const questionEls = queryElements(`[${attr.question}]`, this.element) as HTMLElement[];
    return questionEls.map((element, index) => {
      const question = QuestionFactory.create(element, {
        groupName: this.state.name as string,
        indexInGroup: index,
        source,
        onChange: () => this.handleChange(index),
        onEnter: () => this.handleEnter(index),
        debug: true,
      });

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
    if (!(this.formManager instanceof MainFormManager)) return;
    this.updateGroupState();

    this.activeQuestionIndex = index;
    this.formManager.activeGroupIndex = this.state.index;
    this.formManager.updateNavigation({
      prevEnabled: this.state.index !== 0 && index !== 0,
      nextEnabled: this.state.name !== GroupNameENUM.Output && index !== this.questions.length - 1,
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
      const nextQuestion = this.getQuestionByIndex(nextIndex);
      nextQuestion.activate();
      this.formManager.updateNavigation({ prevEnabled: true });
    } else if (this.state.name !== GroupNameENUM.CustomerIdentifier && this.state.name !== GroupNameENUM.Output) {
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
    if (!(this.formManager instanceof MainFormManager)) return;
    this.formManager.handleInputChange(isValid);
  }

  public getActiveQuestion(): QuestionComponent {
    return this.questions[this.state.activeQuestionIndex];
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
    const indexToUse = fromIndex || fromIndex === 0 ? fromIndex : this.state.activeQuestionIndex;
    const activeQuestion = this.getQuestionByIndex(indexToUse);

    if (direction === 'next') {
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
        if (this.formManager instanceof MainFormManager) {
          this.formManager.updateNavigation({ prevEnabled: true });
        }
      } else {
        // If we're at the end of this group, try the next group
        if (this.formManager instanceof MainFormManager) {
          this.formManager.navigateToNextGroup();
        }
      }
    } else if (direction === 'prev') {
      const prevIndex = this.getPrevVisibleIndex(this.state.activeQuestionIndex);

      // If there's a previous question in this group
      if (prevIndex >= 0) {
        this.activeQuestionIndex = prevIndex;
        const prevItem = this.getActiveQuestion();
        this.activateQuestion(prevItem);
        if (this.formManager instanceof MainFormManager) {
          this.formManager.updateNavigation({
            prevEnabled: !(this.formManager.activeGroupIndex === 0 && prevIndex === 0),
          });
        }
      } else {
        // If we're at the start of this group, try the previous group
        const prevGroup = this.formManager.getPreviousGroupInSequence();
        if (prevGroup && this.formManager instanceof MainFormManager) {
          this.formManager.navigateToPreviousGroup();
        }
      }
    }
  }

  public activateQuestion(question: QuestionComponent): void {
    question.activate();
    question.focus();
    if (!(this.formManager instanceof MainFormManager)) return;
    this.formManager.scrollTo(question);
    this.onInputChange(question.isValid());
    this.formManager.handleOutputGroupUpdate(question.isValid());
  }
}

interface OutputGroupState extends GroupState {
  activated: boolean;
  response: ProductsResponse | null;
  summaryInfo: SummaryInfo | null;
}

// @description: Output group of questions
export class OutputGroup extends BaseGroup<OutputGroupState> {
  protected formManager: MainFormManager;
  private card!: HTMLElement;
  private loader!: HTMLElement;
  private outputs!: HTMLDivElement[];
  private button!: HTMLButtonElement;

  constructor(options: GroupOptions) {
    const name = options.element.getAttribute(attr.group) as GroupNameENUM | null;
    const initialState: OutputGroupState = {
      isVisible: false,
      isActive: false,
      isComplete: false,
      name,
      index: options.index,
      activated: false,
      response: null,
      summaryInfo: null,
    };

    super(options, initialState);
    this.formManager = options.formManager as MainFormManager;
  }

  protected onInit(): void {
    this.card = queryElement(`[${attr.element}="output-card"]`, this.element) as HTMLElement;
    this.loader = queryElement(`[${attr.element}="output-loader"]`, this.element) as HTMLElement;
    this.outputs = queryElements(`[${attr.output}]`, this.element) as HTMLDivElement[];
    this.button = queryElement(`[${attr.element}="get-results"]`, this.element) as HTMLButtonElement;

    super.onInit();
  }

  protected handleNextStageButton(): void {
    const availableStages = MCTManager.getAvailableStages();
    if (availableStages.includes(StageIDENUM.Results)) return;

    const isProceedable = MCTManager.getCalculation(CalculationKeysENUM.IsProceedable);
    const text = isProceedable ? 'Book an appointment' : 'Get a Decision in Principle';
    this.button.textContent = text;
  }

  protected bindEvents(): void {
    this.addEventListener({
      element: this.button,
      event: 'click',
      handler: () => this.navigateToNextStage(),
    });
  }

  public update(): void {
    if (!this.state.activated || !this.state.isVisible) return;
    this.handleNextStageButton();
    this.handleProducts();
  }

  public show(): void {
    this.element.style.removeProperty('display');
    this.setState({ isVisible: true });
    this.emit(FormEventNames.GROUP_SHOWN, { groupId: this.state.name as string });
  }

  public hide(): void {
    this.element.style.display = 'none';
    this.setState({ isVisible: false });
    this.emit(FormEventNames.GROUP_HIDDEN, { groupId: this.state.name as string });
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
    if (!this.state.activated) {
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

    this.setState({ activated: true });
    this.card.classList.add(classes.active);
    if (scrollTo) this.scrollTo();
    this.update();
  }

  private async handleProducts(): Promise<void> {
    this.showLoader(true);
    this.button.disabled = true;
    const response = await this.fetchProducts();
    if (!response) {
      logError('No products response');
      return;
    }

    this.setState({
      response,
      summaryInfo: response.result.SummaryInfo,
    });

    this.formManager.toggleButton(
      this.formManager.goToNextStageButton,
      response.result.SummaryInfo.NumberOfProducts > 0
    );

    this.updateOutputs();
    this.showLoader(false);

    if (response.result.Products.length === 0) {
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
    if (!this.state.summaryInfo) return;
    const hasProducts = this.state.summaryInfo.NumberOfProducts > 0;

    const summaryLines = generateSummaryLines(this.state.summaryInfo, MCTManager.getAnswers());
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

  public navigateToNextStage(): void {
    this.emit(MCTEventNames.STAGE_COMPLETE, { stageId: StageIDENUM.Questions });
  }
}
