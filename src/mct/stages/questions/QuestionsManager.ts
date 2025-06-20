import { simulateEvent } from '@finsweet/ts-utils';
import { sharedUtils } from 'src/mct/shared/utils';

import { PROFILES } from '../../shared/constants';
import { MainQuestionGroup, QuestionGroup } from './QuestionGroup';
import type { Profile, ProfileName } from './types';
import type { AnswerKey, Answers, AnswerValue } from 'src/mct/shared/types';
import { queryElement } from '$utils/queryElement';
import { attr } from './constants';
import { queryElements } from '$utils/queryelements';
import type { QuestionItem } from './QuestionItem';
import { MCTManager, type AppState } from 'src/mct/shared/manager';

interface State {
  profile: Profile | null;
}

const state: State = {
  profile: null,
};

export abstract class QuestionsManager {
  protected component: HTMLElement;
  protected groups: QuestionGroup[] = [];

  constructor(component: HTMLElement) {
    this.component = component;
  }

  protected registerGroup(group: QuestionGroup) {
    this.groups.push(group);
  }

  protected prefill(answers: Answers) {
    /**
     * @todo:
     * - Loop through the answers
     * - Find the input(s) that match the answer key
     * - Set the value of the input(s)
     * - Evaluate the visibility of the input(s)
     */
    // for (const [name, value] of Object.entries(answers)) {}
    // this.groups.forEach((group) => group.evaluateVisibility());
  }

  public setAnswer(key: AnswerKey, value: AnswerValue): void {
    MCTManager.setAnswer(key, value);
  }

  public getAnswer(key: AnswerKey): AnswerValue | null {
    return MCTManager.getAnswer(key);
  }

  public clearAnswer(key: AnswerKey): void {
    MCTManager.clearAnswer(key);
  }

  public refreshAnswers(): void {
    MCTManager.clearAnswers();

    const visibleGroups = this.groups.filter((group) => group.isVisible);
    visibleGroups.forEach((group) => {
      const visibleQuestions = group.questions.filter((question) => question.isVisible);
      visibleQuestions.forEach((question) => {
        const value = question.getValue();
        this.setAnswer(question.name, value);
      });
    });
  }

  public getAnswers(): Answers {
    return { ...MCTManager.getAnswers() };
  }

  public determineProfile(): Profile | null {
    const answers = this.getAnswers();
    const profile: Profile | undefined = PROFILES.find((profile) => {
      return Object.entries(profile.requirements).every(([key, value]) => answers[key] === value);
    });

    state.profile = profile ? profile : null;
    return profile ? profile : null;
  }

  protected reset(): void {
    MCTManager.clearAnswers();
    this.groups.forEach((group) => group.reset());
  }

  // protected getState(): State {
  //   return { ...state };
  // }
}

export class MainQuestionsManager extends QuestionsManager {
  public groups: MainQuestionGroup[] = [];
  public activeGroupIndex: number = 0;
  private activeQuestionIndex: number = 0;
  private components: {
    header: HTMLElement;
    stickyHeader: HTMLElement;
    profileSelect: HTMLSelectElement;
    wrapper: HTMLElement;
    scroll: HTMLElement;
    nextButton: HTMLButtonElement;
    prevButton: HTMLButtonElement;
    groupElements: HTMLElement[];
  };
  private optionRemoved: boolean = false;

  constructor(component: HTMLElement) {
    super(component);
    this.components = {
      header: queryElement(`[${attr.components}="header"]`, component) as HTMLElement,
      stickyHeader: queryElement(`[${attr.components}="sticky-header"]`, component) as HTMLElement,
      profileSelect: queryElement(`[${attr.components}="profile-select"]`, component) as HTMLSelectElement,
      wrapper: queryElement(`[${attr.components}="wrapper"]`, component) as HTMLElement,
      scroll: queryElement(`[${attr.components}="scroll"]`, component) as HTMLElement,
      nextButton: queryElement(`[${attr.components}="next"]`, component) as HTMLButtonElement,
      prevButton: queryElement(`[${attr.components}="previous"]`, component) as HTMLButtonElement,
      groupElements: queryElements(`[${attr.group}]`, component) as HTMLElement[],
    };

    console.log(this.components);
  }

  public init(): void {
    this.showHeader('static');

    this.components.groupElements.forEach((groupEl, index) => {
      const group = new MainQuestionGroup(groupEl, this);
      index === 0 ? group.show() : group.hide();
      this.groups.push(group);
    });

    this.prepareWrapper();

    const initialGroup = this.getActiveGroup();
    if (initialGroup) initialGroup.show();

    this.component.addEventListener('mct:navigation:update', (event: Event) => {
      const { nextEnabled, prevEnabled } = (event as CustomEvent).detail;
      if (typeof nextEnabled === 'boolean') this.components.nextButton.disabled = !nextEnabled;
      if (typeof prevEnabled === 'boolean') this.components.prevButton.disabled = !prevEnabled;
    });

    this.components.nextButton.addEventListener('click', () => {
      const currentGroup = this.getActiveGroup();
      if (!currentGroup) return;

      const currentItem = currentGroup.getActiveQuestion();
      if (!currentItem.isValid()) return;

      currentGroup.navigate('next');
    });

    this.components.prevButton.addEventListener('click', () => {
      const currentGroup = this.getActiveGroup();
      if (!currentGroup) return;

      currentGroup.navigate('prev');
    });
  }

  public prepareWrapper(): void {
    if (this.groups.length === 0) return;

    const firstItem = this.getFirstQuestion()?.el;
    const lastItem = this.getLastQuestion()?.el;
    if (!firstItem || !lastItem) return;

    const { scroll, wrapper } = this.components;

    const topPad = scroll.offsetHeight / 2 - firstItem.offsetHeight / 2;
    const bottomPad = scroll.offsetHeight / 2 - lastItem.offsetHeight / 2;

    wrapper.style.paddingTop = `${topPad}px`;
    wrapper.style.paddingBottom = `${bottomPad}px`;
  }

  private getFirstQuestion(): QuestionItem | null {
    return this.groups[0].questions[0];
  }

  private getLastQuestion(): QuestionItem | undefined {
    return this.groups.at(this.activeGroupIndex)?.questions.at(-1);
  }

  public updateNavigation(options: { nextEnabled?: boolean; prevEnabled?: boolean } = {}): void {
    this.component.dispatchEvent(
      new CustomEvent('mct:navigation:update', {
        detail: options,
        bubbles: false,
      })
    );
  }

  public handleInputChange(isValid: boolean) {
    this.updateNavigation({ nextEnabled: isValid });
  }

  private getActiveGroup(): MainQuestionGroup | undefined {
    return this.groups[this.activeGroupIndex];
  }

  private getGroupByProfile(profile: Profile): MainQuestionGroup | undefined {
    return this.groups.find((group) => group.profileName === profile.name);
  }

  public getPreviousGroupInSequence(): MainQuestionGroup | undefined {
    if (this.activeGroupIndex <= 0) return undefined;
    return this.groups[0];
  }

  public navigateToNextGroup() {
    const activeGroup = this.getActiveGroup();
    if (!activeGroup) return;

    if (this.activeGroupIndex === 0) {
      const profile = this.determineProfile();
      if (!profile) return sharedUtils.logError('Could not determine profile');
      this.initialiseProfileSelect(profile.name);

      const nextGroup = this.getGroupByProfile(profile);
      if (!nextGroup) return sharedUtils.logError('No matching group found for profile:', profile);

      const nextGroupIndex = this.groups.indexOf(nextGroup);
      if (nextGroupIndex === -1) return sharedUtils.logError('Next group index not found');

      this.activeGroupIndex = nextGroupIndex;
      nextGroup.show();
      this.showHeader('sticky');
      this.prepareWrapper();
      const firstVisibleIndex = nextGroup.getNextVisibleIndex(-1);
      if (firstVisibleIndex < nextGroup.questions.length) {
        nextGroup.activeQuestionIndex = firstVisibleIndex;
        const firstQuestion = nextGroup.getActiveQuestion();
        nextGroup.activateQuestion(firstQuestion);
        nextGroup.handleNextButton(firstQuestion.isValid());
      }
    } else {
      console.log('End of groups');
      console.log('Initiate logic for showing output');
    }
  }

  public navigateToPreviousGroup() {
    /**
     * @todo: check if this keeps groups active that shouldn't be
     */
    const previousGroup = this.getPreviousGroupInSequence();
    if (!previousGroup) return sharedUtils.logError('No previous group found');

    const previousGroupIndex = this.groups.indexOf(previousGroup);
    if (previousGroupIndex === -1) return sharedUtils.logError('Previous group index not found');

    this.activeGroupIndex = previousGroupIndex;
    this.showHeader('static');
    const lastVisibleIndex = previousGroup.getPrevVisibleIndex(previousGroup.questions.length);
    if (lastVisibleIndex >= 0) {
      previousGroup.activeQuestionIndex = lastVisibleIndex;
      previousGroup.activateQuestion(previousGroup.getActiveQuestion());
      return;
    }
  }

  private initialiseProfileSelect(value: ProfileName) {
    const { profileSelect } = this.components;
    if (!profileSelect) return;

    profileSelect.value = value;
    simulateEvent(profileSelect, 'change');

    if (!this.optionRemoved) profileSelect.remove(0);
    this.optionRemoved = true;
  }

  private showHeader(type: 'static' | 'sticky') {
    const { header, stickyHeader } = this.components;
    if (!header || !stickyHeader) return;
    if (type === 'static') {
      header.style.removeProperty('display');
      stickyHeader.style.display = 'none';
    } else if (type === 'sticky') {
      header.style.display = 'none';
      stickyHeader.style.removeProperty('display');
    }
  }

  public reset() {
    MCTManager.clearAnswers();
    this.groups.forEach((group) => group.reset());
    this.activeQuestionIndex = 0;
  }

  // public start(): void {
  //   this.groups[0]?.show();
  //   this.groups[0]?.activate(); // highlight + enable
  // }

  // public handleInputChange(): void {
  //   const current = this.groups[this.currentGroupIndex];

  //   current.evaluateVisibility();
  //   const currentItem = current.getCurrentQuestion();

  //   if (currentItem?.isValid()) {
  //     current.advance();
  //     // optionally check if done
  //   }
  // }
}
