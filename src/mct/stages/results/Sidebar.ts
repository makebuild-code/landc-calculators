import { DOM_CONFIG } from '$mct/config';
import { GroupNameENUM, FormEventNames, type InputData, type InputKey, type InputName } from '$mct/types';
import { debugLog } from '$utils/debug';
import { queryElement, queryElements } from '$utils/dom';
import { MainGroup, type GroupOptions } from '../form/Groups';
import { FormManager } from '../form/Manager_Base';
import { QuestionFactory } from '../form/QuestionFactory';
import type { QuestionComponent } from '../form/Questions';
import { MCTManager } from '$mct/manager';

const sidebarAttr = DOM_CONFIG.attributes.sidebar;
const questionAttr = DOM_CONFIG.attributes.form;

export class Sidebar extends FormManager {
  private static instance: Sidebar;
  private list: HTMLElement;
  private updateButton: HTMLButtonElement;
  private closeButtons: HTMLButtonElement[];

  constructor(component: HTMLElement) {
    super(component);
    this.list = queryElement(`[${questionAttr.components}="list"]`, component) as HTMLElement;
    this.updateButton = queryElement(`[${sidebarAttr.components}="update"]`, component) as HTMLButtonElement;
    this.closeButtons = queryElements(`[${sidebarAttr.components}="close"]`, component) as HTMLButtonElement[];
  }

  /**
   * Get the instance of the Sidebar
   * @param component The component element
   * @returns The instance of the Sidebar
   */
  public static getInstance(component: HTMLElement): Sidebar {
    if (!Sidebar.instance) Sidebar.instance = new Sidebar(component);
    return Sidebar.instance;
  }

  public init(): void {
    if (this.isInitialised) return;
    this.isInitialised = true;

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
      // const group = name !== GroupNameENUM.Output ? new MainGroup(options) : null;
      index === 0 ? group.show() : group.hide();
      this.groups.push(group);
      group.questions.forEach((q) => this.questions.add(q));
    });

    this.bindEvents();
  }

  public show(): void {
    this.component.style.setProperty('display', 'flex');
    document.body.style.overflow = 'hidden';
  }

  public hide(): void {
    this.component.style.removeProperty('display');
    document.body.style.removeProperty('overflow');
  }

  protected bindEvents(): void {
    console.log('bindEvents: ', { updateButton: this.updateButton, closeButtons: this.closeButtons });
    this.updateButton.addEventListener('click', () => {
      this.update();
    });

    this.closeButtons.forEach((button) => {
      button.addEventListener('click', () => this.close());
    });
  }

  private update(): void {
    debugLog('Saving sidebar answers to MCT');

    // Save all question answers to MCT
    this.saveAnswersToMCT();

    // Get answers as InputData array
    const answers: InputData[] = [];
    this.questions.forEach((question) => {
      const value = question.getValue();
      if (question.isValid() && value !== null) {
        answers.push({
          key: question.getInitialName() as InputKey,
          name: question.getFinalName() as InputName,
          value: value,
          valid: true,
          location: 'sidebar',
          source: 'user',
        });
      }
    });

    // Emit event to notify that sidebar has been saved
    this.eventBus.emit(FormEventNames.ANSWERS_SAVED, {
      answers,
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
    const profile = this.determineProfile();
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
    // Re-initialize questions with sidebar source
    this.formManager = Sidebar.getInstance(this.element) as Sidebar;
    this.questions = this.initSidebarQuestions();
    this.updateActiveQuestions();
  }

  private initSidebarQuestions(): QuestionComponent[] {
    const questionEls = queryElements(`[${DOM_CONFIG.attributes.form.question}]`, this.element) as HTMLElement[];
    return questionEls.map((element, index) => {
      const question = QuestionFactory.create(element, {
        groupName: this.state.name as string,
        indexInGroup: index,
        source: 'sidebar', // Important: mark as sidebar source
        onChange: () => this.handleChange(index),
        onEnter: () => this.handleEnter(index),
        debug: true,
      });

      // Initialize question state
      if (index !== 0) question.disable();
      if (question.getStateValue('dependsOn')) question.unrequire();
      return question;
    });
  }

  // Override handleChange to not save to MCT on every change (sidebar pattern)
  public handleChange(index: number): void {
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

    // Show but do not scroll to the next question
    const nextIndex = this.getNextRequiredIndex(index);
    if (nextIndex < this.questions.length) {
      const nextQuestion = this.getQuestionByIndex(nextIndex);
      nextQuestion.activate();
    }
  }

  // // Override updateActiveQuestions to not save to MCT
  // public updateActiveQuestions(): void {
  //   // Don't save to MCT in sidebar
  //   const currentAnswers = MCTManager.getAnswers();

  //   this.questions.forEach((question, index) => {
  //     const shouldBeVisible = question.shouldBeVisible(currentAnswers, this.isVisible);
  //     if (index === 0 && shouldBeVisible) question.activate();

  //     const isValid = question.isValid();
  //     if (shouldBeVisible && isValid) question.activate();
  //     else if (shouldBeVisible) question.require();
  //     else question.unrequire();
  //   });
  // }

  // Override to prevent automatic scrolling in sidebar
  public activateQuestion(question: QuestionComponent): void {
    question.activate();
    question.focus();
    // No scrolling in sidebar
  }
}
