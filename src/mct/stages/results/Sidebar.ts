import { DOM_CONFIG } from '$mct/config';
import { MCTManager } from '$mct/manager';
import { GroupNameENUM, FormEventNames, InputKeysENUM } from '$mct/types';
import { queryElement, queryElements } from '$utils/dom';
import { MainGroup, type GroupOptions } from '../form/Groups';
import { FormManager } from '../form/Manager_Base';

const sidebarAttr = DOM_CONFIG.attributes.sidebar;
const questionAttr = DOM_CONFIG.attributes.form;

export class Sidebar extends FormManager {
  private list: HTMLElement;
  private updateButton: HTMLButtonElement;
  private closeButtons: HTMLButtonElement[];
  protected groups: SidebarGroup[] = [];
  protected source: 'sidebar' = 'sidebar';

  constructor(component: HTMLElement) {
    super(component);
    this.list = queryElement(`[${questionAttr.components}="list"]`, component) as HTMLElement;
    this.updateButton = queryElement(`[${sidebarAttr.components}="update"]`, component) as HTMLButtonElement;
    this.closeButtons = queryElements(`[${sidebarAttr.components}="close"]`, component) as HTMLButtonElement[];
  }

  public init(): void {
    if (this.isInitialised) return;
    this.isInitialised = true;

    this.updateButton.disabled = true;
    this.bindEvents();

    const groupElements = queryElements(`[${questionAttr.group}]`, this.list) as HTMLElement[];
    groupElements.forEach((groupEl, index) => {
      const name = groupEl.getAttribute(questionAttr.group) as GroupNameENUM;
      if (!name) return;

      const options: GroupOptions = {
        element: groupEl,
        formManager: this,
        index,
      };

      // Create a custom sidebar group that initializes questions with 'sidebar' source
      const group = new SidebarGroup(options);
      group.initialise();
      this.groups.push(group);
      group.questions.forEach((q) => {
        this.questions.add(q); // @todo: is this needed?
        q.updateVisualState(q.isValid());
      });
    });

    this.onMount();

    this.groups.forEach((group) => group.updateActiveQuestions());
    this.updateGroupVisibility();

    // this.eventBus.on(FormEventNames.QUESTION_CHANGED, (event) => {
    //   if (event.source !== 'sidebar') return;
    //   this.handleQuestionChange();

    //   setTimeout(() => {
    //     this.handleQuestionChange();
    //   }, 1000);
    // });
  }

  public show(): void {
    this.syncQuestionsToFilters();
    this.groups.forEach((group) => group.updateActiveQuestions());
    this.updateGroupVisibility();
    this.component.style.setProperty('display', 'flex');
    document.body.style.overflow = 'hidden';
  }

  public hide(): void {
    this.component.style.removeProperty('display');
    document.body.style.removeProperty('overflow');
  }

  protected bindEvents(): void {
    this.updateButton.addEventListener('click', () => {
      this.update();
    });

    this.closeButtons.forEach((button) => {
      button.addEventListener('click', () => this.close());
    });
  }

  protected syncQuestionsToFilters(): void {
    const filters = MCTManager.getFilters();
    this.questions.forEach((question) => {
      const answer = filters[question.getStateValue('initialName') as InputKeysENUM];
      if (answer) question.setValue(answer);
    });
  }

  public handleQuestionChange(): void {
    const mainAnswers = MCTManager.getAnswers('main');
    const sidebarAnswers = MCTManager.getAnswers('sidebar');

    const requiredQuestions = [...this.questions].filter((q) => q.isRequired());
    const allValid = requiredQuestions.every((q) => q.isValid());

    // Check if the sidebar answers are the same as the main answers
    const isSame = Object.keys(sidebarAnswers).every((key) => sidebarAnswers[key] === mainAnswers[key]);
    const allowUpdate = allValid && !isSame;

    this.updateButton.disabled = !allowUpdate;
  }

  private update(): void {
    // Save all question answers to MCT
    const answerDataArray = this.saveAnswersToMCT(true);

    this.eventBus.emit(FormEventNames.ANSWERS_SAVED, {
      answers: answerDataArray,
      source: 'sidebar',
    });

    // Close the sidebar after saving
    this.close();
  }

  private close(): void {
    this.hide();
  }

  public updateGroupVisibility(): void {
    // Always show customer-identifier
    const identifierGroup = this.getGroupByName(GroupNameENUM.CustomerIdentifier) as MainGroup;
    identifierGroup.show();

    // Get the profile and update the tag (update text or remove tag)
    const profile = this.determineProfile('sidebar');
    if (!profile) {
      this.groups.filter((group) => group !== identifierGroup).forEach((group) => group.hide());
      return;
    }

    // Show the profile group if it exists
    const profileGroup = this.getGroupByName(profile.name as any) as MainGroup;
    profileGroup.show();

    this.groups.filter((group) => group !== identifierGroup && group !== profileGroup).forEach((group) => group.hide());
  }
}

// Custom group class for sidebar that properly initializes questions
class SidebarGroup extends MainGroup {
  // Override the private method by creating our own initialization
  constructor(options: GroupOptions) {
    super(options);
    // // Re-initialize questions with sidebar source
    // this.formManager = options.formManager as Sidebar;
    // this.questions = this.initQuestions('sidebar');
    // this.updateActiveQuestions();
  }

  // Override handleChange to not save to MCT on every change (sidebar pattern)
  public handleChange(index: number): void {
    if (!(this.formManager instanceof Sidebar)) return;

    this.activeQuestionIndex = index;
    this.formManager.activeGroupIndex = this.state.index;

    // Check if the question is valid and update visual state
    const question = this.questions[index];
    const isValid = question.isValid();

    question.updateVisualState(isValid);
    this.onInputChange(isValid);
    if (!isValid) return;

    // Update active questions without saving to MCT
    this.updateActiveQuestions();
    this.formManager.updateGroupVisibility();

    this.formManager.handleQuestionChange();
  }

  // // Override updateActiveQuestions to not save to MCT
  // public updateActiveQuestions(): void {
  //   // Don't save to MCT in sidebar
  //   const currentAnswers = MCTManager.getAnswers('sidebar');

  //   this.questions.forEach((question, index) => {
  //     const shouldBeVisible = question.shouldBeVisible(currentAnswers, this.isVisible);
  //     if (index === 0 && shouldBeVisible) question.activate();

  //     const isValid = question.isValid();
  //     if (shouldBeVisible && isValid) question.activate();
  //     else if (shouldBeVisible) question.require();
  //     else question.unrequire();
  //   });
  // }

  // // Override to prevent automatic scrolling in sidebar
  // public activateQuestion(question: QuestionComponent): void {
  //   question.activate();
  //   question.focus();
  //   // No scrolling in sidebar
  // }
}
