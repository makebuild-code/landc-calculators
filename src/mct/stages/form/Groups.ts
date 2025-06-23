/**
 * class for managing a group of questions
 */

import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import { attr } from './constants';
import { Question } from './Questions';
import type { MainFormManager, FormManager } from './Manager';
import type { GroupName } from './types';
import { classes } from 'src/mct/shared/constants';
import { fetchProducts } from 'src/mct/shared/api/fetchProducts';
import type { ProductsRequest, ProductsResponse } from 'src/mct/shared/api/types/fetchProducts';

// @description: Base class for all groups
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

// @description: Base class for all question groups
export abstract class QuestionGroup extends BaseGroup {
  public questions: Question[] = [];
  public activeQuestionIndex: number = 0;

  constructor(component: HTMLElement, manager: FormManager) {
    super(component, manager);
  }

  abstract handleChange(index: number): void;

  abstract handleEnter(index: number): void;

  public updateQuestionVisibility(): void {
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
  protected manager: MainFormManager;

  constructor(component: HTMLElement, manager: MainFormManager) {
    super(component, manager);
    this.manager = manager;
    this.questions = this.initQuestions();
    this.manager.components.scroll = queryElement(`[${attr.components}="scroll"]`) as HTMLElement;
    this.updateQuestionVisibility();
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
    this.updateQuestionVisibility();
    this.manager.updateGroupVisibility();
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

// @description: Output group of questions
type OutputData = { [key: string]: string | number | string[] };
export class OutputGroup extends BaseGroup {
  protected manager: MainFormManager;
  private card: HTMLElement;
  public outputs: HTMLSpanElement[] = [];
  private loader: HTMLElement;
  private products: ProductsResponse | null = null;
  private outputData: OutputData[] = [];

  constructor(component: HTMLElement, manager: MainFormManager) {
    super(component, manager);
    this.manager = manager;
    this.card = queryElement(`[${attr.element}="output-card"]`) as HTMLElement;
    this.outputs = queryElements(`[${attr.output}]`, this.component) as HTMLSpanElement[];
    this.loader = queryElement(`[${attr.element}="output-loader"]`) as HTMLElement;
  }

  public getComponent(): HTMLElement {
    return this.component;
  }

  private scrollToOutput(): void {
    this.manager.components.scroll.scrollTo({
      top: this.component.offsetTop - this.manager.components.scroll.offsetHeight / 2 + this.component.offsetHeight / 2,
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
    console.log(this.manager.getAnswers());
    // this.products = await this.fetchProducts();
    this.outputData = this.buildOutputData();
    // this.updateOutputs();
    this.showLoader(false);
  }

  private async fetchProducts(): Promise<ProductsResponse> {
    const input = this.buildProductsInput();
    const response = await fetchProducts(input);
    console.log(response);

    return response;
  }

  private buildProductsInput(): ProductsRequest {
    const answers = this.manager.getAnswers();
    console.log(answers);

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
      TermYears,
      SchemePurpose,
      NumberOfResults,
      SortColumn,
    };
  }

  private buildOutputData(): OutputData[] {
    const answers = this.manager.getAnswers();
    console.log(answers);
    const data = [];

    const RepaymentValue = `£${answers.RepaymentValue}`;
    const TermYears =
      answers.MortgageLength === 1 ? `${answers.MortgageLength} year` : `${answers.MortgageLength} years`;
    const SchemePeriod = answers.SchemePeriod === 'A' ? null : `${answers.SchemePeriod} year`;
    const SchemeType = answers.SchemeType === 'F' ? 'Fixed' : answers.SchemeType === 'V' ? 'Variable' : null;

    if (RepaymentValue) data.push({ key: 'RepaymentValue', value: RepaymentValue });
    if (TermYears) data.push({ key: 'TermYears', value: TermYears });
    if (SchemePeriod) data.push({ key: 'SchemePeriod', value: SchemePeriod });
    if (SchemeType) data.push({ key: 'SchemeType', value: SchemeType });

    console.log(data);

    return data;
  }

  // private updateOutputs() {
  //   if (!this.products) return;
  //   const data = this.products.result.this.outputs.forEach((output) => {
  //     const key = output.getAttribute(attr.output);
  //     if (key) {
  //       output.textContent = data[key];
  //     }
  //   });
  // }
}
