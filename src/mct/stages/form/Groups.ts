/**
 * class for managing a group of questions
 */

import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import { attr } from './constants';
import { Question } from './Questions';
import type { MainFormManager, FormManager } from './Manager';
import type { CheckboxValues, GroupName } from './types';
import { classes } from 'src/mct/shared/constants';
import { fetchProducts } from 'src/mct/shared/api/fetchProducts';
import type { ProductsRequest, ProductsResponse } from 'src/mct/shared/api/types/fetchProducts';
import { filterAllowed } from '$utils/filterAllowed';
import { formatNumber } from '$utils/formatNumber';
import { trackGAEvent } from '$utils/trackGAEvent';

// @description: Base class for all groups
export abstract class BaseGroup {
  protected component: HTMLElement;
  protected formManager: FormManager;
  public isVisible: boolean = false;
  public name: GroupName | null = null;

  constructor(component: HTMLElement, formManager: FormManager) {
    this.component = component;
    this.formManager = formManager;
    this.name = component.getAttribute(attr.group) as GroupName | null;
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
  private productsAPIInput: ProductsRequest | null = null;
  private loader: HTMLElement;
  private products: ProductsResponse | null = null;
  private outputData: Record<string, string>[] = [];
  private summary: HTMLParagraphElement;
  private lenders: HTMLParagraphElement;
  private button: HTMLButtonElement;

  constructor(component: HTMLElement, formManager: MainFormManager) {
    super(component, formManager);
    this.formManager = formManager;
    this.card = queryElement(`[${attr.element}="output-card"]`) as HTMLElement;
    this.loader = queryElement(`[${attr.element}="output-loader"]`) as HTMLElement;
    this.summary = queryElement(`[${attr.output}="summary"]`) as HTMLParagraphElement;
    this.lenders = queryElement(`[${attr.output}="lenders"]`) as HTMLParagraphElement;
    this.button = queryElement(`[${attr.element}="get-results"]`) as HTMLButtonElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.button.addEventListener('click', () => this.navigateToResults());
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
    this.products = await this.fetchProducts();
    if (!this.products) return;
    this.outputData = this.buildOutputData();

    this.updateSummary();
    this.showLoader(false);
    this.button.disabled = false;
  }

  private async fetchProducts(): Promise<ProductsResponse | null> {
    try {
      this.productsAPIInput = this.buildProductsInput();
      const response = await fetchProducts(this.productsAPIInput);
      return response;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return null;
    }
  }

  private buildProductsInput(): ProductsRequest {
    const answers = this.formManager.getAnswers();

    const PropertyValue = answers.PropertyValue as number;
    const DepositAmount = answers.DepositAmount as number;
    let RepaymentValue = (answers.RepaymentValue as number) || null;

    if (!RepaymentValue) RepaymentValue = PropertyValue - DepositAmount;

    const PropertyType = 1; // property type not a question
    const MortgageType = answers.ResiBtl === 'R' ? 1 : 2;
    const TermYears = answers.MortgageLength as number;
    const SchemePurpose = answers.PurchRemo === 'P' ? 1 : 2;
    const NumberOfResults = 1;
    const SortColumn = 1;

    return {
      PropertyValue,
      RepaymentValue,
      PropertyType,
      MortgageType,
      InterestOnlyValue: answers.InterestOnlyValue as number,
      TermYears,
      SchemePurpose,
      SchemePeriods: filterAllowed((answers.SchemePeriods as CheckboxValues) ?? [], [1, 2, 3, 4] as const),
      SchemeTypes: filterAllowed((answers.SchemeTypes as CheckboxValues) ?? [], [1, 2] as const),
      NumberOfResults,
      SortColumn,
    };
  }

  private buildOutputData(): Record<string, string>[] {
    const answers = this.formManager.getAnswers();

    if (!this.productsAPIInput || !this.products) return [];

    const { RepaymentValue, TermYears, SchemePeriods, SchemeTypes } = this.productsAPIInput;
    const { RepaymentType } = answers;

    const RepaymentValueText = formatNumber(RepaymentValue, { currency: true });
    const TermYearsText = `${TermYears} years`;
    const RepaymentTypeText =
      RepaymentType === 'R' ? 'repayment' : RepaymentType === 'I' ? 'interest only' : 'part repayment part interest';

    const SchemeTypesMap = SchemeTypes.map((type) => (type === 1 ? 'fixed' : 'variable'));
    const SchemePeriodsMap = SchemePeriods.map((period) =>
      period === 1 ? '2' : period === 2 ? '3' : period === 3 ? '5' : '5+'
    );

    const SchemePeriodsText =
      SchemePeriodsMap.length === 1
        ? `${SchemePeriodsMap[0]} year`
        : SchemePeriodsMap.length > 1
          ? `${SchemePeriodsMap[0]}-${SchemePeriodsMap[SchemePeriodsMap.length - 1]} year`
          : null;

    const SchemeTypesText =
      SchemeTypesMap.length === 1
        ? `${SchemeTypesMap[0]} rate`
        : SchemeTypesMap.length > 1
          ? `${SchemeTypesMap[0]} or ${SchemeTypesMap[1]} rate`
          : null;

    const summmaryText = `Looks like you want to borrow <span class="${classes.highlight}">${RepaymentValueText}</span> over <span class="${classes.highlight}">${TermYearsText}</span> with a <span class="${classes.highlight}">${SchemePeriodsText} ${SchemeTypesText} ${RepaymentTypeText}</span> mortgage`;
    const lendersText = `We’ve found <span class="${classes.highlight}">${this.products.result.SummaryInfo.NumberOfProducts}</span> products for you across <span class="${classes.highlight}">${this.products.result.SummaryInfo.NumberOfLenders}</span> lenders.`;

    return [
      { key: 'summary', value: summmaryText },
      { key: 'lenders', value: lendersText },
    ];
  }

  private updateSummary(): void {
    this.outputData.forEach((data) => {
      const key = data.key;
      const value = data.value;
      if (key === 'summary') this.summary.innerHTML = value;
      if (key === 'lenders') this.lenders.innerHTML = value;
    });
  }

  private navigateToResults(): void {
    this.formManager.navigateToNextGroup();
    this.button.disabled = true;
  }
}
