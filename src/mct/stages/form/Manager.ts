import { simulateEvent } from '@finsweet/ts-utils';
import { sharedUtils } from 'src/mct/shared/utils';

import { PROFILES } from '../../shared/constants';
import { MainGroup, BaseGroup, OutputGroup } from './Groups';
import type { GroupName, Profile, ProfileName } from './types';
import type { AnswerKey, Answers, AnswerValue } from 'src/mct/shared/types';
import { queryElement } from '$utils/queryElement';
import { attr } from './constants';
import { queryElements } from '$utils/queryelements';
import type { Question } from './Questions';
import { MCTManager, type AppState } from 'src/mct/shared/MCTManager';

interface State {
  profile: Profile | null;
}

const state: State = {
  profile: null,
};

export abstract class FormManager {
  protected component: HTMLElement;
  protected groups: (MainGroup | OutputGroup)[] = [];

  constructor(component: HTMLElement) {
    this.component = component;
  }

  public abstract init(): void;

  // protected registerGroup(group: MainGroup | OutputGroup) {
  //   this.groups.push(group);
  // }

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
      if (!(group instanceof MainGroup)) return;
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
    this.groups.forEach((group) => (group instanceof MainGroup ? group.reset() : null));
  }
}

export class MainFormManager extends FormManager {
  public groups: (MainGroup | OutputGroup)[] = [];
  public activeGroupIndex: number = 0;
  public components: {
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
  }

  public init(): void {
    this.showHeader('static');

    this.components.groupElements.forEach((groupEl, index) => {
      const name = groupEl.getAttribute(attr.group) as GroupName;
      if (!name) return;

      const group = name === 'output' ? new OutputGroup(groupEl, this) : new MainGroup(groupEl, this);
      index === 0 ? group.show() : group.hide();
      this.groups.push(group);
    });

    console.log(this.groups);
    console.log('prepare wrapper: MainFormManager init');
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
      if (!currentGroup || currentGroup instanceof OutputGroup) return;

      const currentItem = currentGroup.getActiveQuestion();
      if (!currentItem.isValid()) return;

      currentGroup.navigate('next');
    });

    this.components.prevButton.addEventListener('click', () => {
      const currentGroup = this.getActiveGroup();
      if (!currentGroup || currentGroup instanceof OutputGroup) return;

      currentGroup.navigate('prev');
    });
  }

  public prepareWrapper(): void {
    if (this.groups.length === 0) return;

    const firstItem = this.getFirstEl();
    const lastItem = this.getLastEl();
    if (!firstItem || !lastItem) return;

    const { scroll, wrapper } = this.components;

    const topPad = scroll.offsetHeight / 2 - firstItem.offsetHeight / 2;
    const bottomPad = scroll.offsetHeight / 2 - lastItem.offsetHeight / 2;

    wrapper.style.paddingTop = `${topPad}px`;
    wrapper.style.paddingBottom = `${bottomPad}px`;
  }

  private getFirstEl(): HTMLElement | null {
    console.log(this);
    const group = this.groups[0];
    if (group instanceof MainGroup) return group.questions[0].el;
    if (group instanceof OutputGroup) return group.getComponent();
    return null;
  }

  private getLastEl(): HTMLElement | undefined {
    const group = this.groups.at(this.activeGroupIndex);
    if (group instanceof MainGroup) {
      // Find the last visible question
      const visibleQuestions = group.getVisibleQuestions();
      if (visibleQuestions.length === 0) return undefined;
      return visibleQuestions.at(-1)?.el;
    }
    if (group instanceof OutputGroup) return group.getComponent();
    return undefined;
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

  private getActiveGroup(): MainGroup | OutputGroup | undefined {
    return this.groups[this.activeGroupIndex];
  }

  private getGroupByName(name: GroupName): MainGroup | OutputGroup | undefined {
    return this.groups.find((group) => group.name === name);
  }

  public getPreviousGroupInSequence(): MainGroup | OutputGroup | undefined {
    if (this.activeGroupIndex <= 0) return undefined;
    return this.groups[0];
  }

  /**
   * @plan
   * - new functions to determine which groups are visible
   *
   * - when a question is answered
   *
   * - if current group is 'customer-identifier'
   * - get the profile
   * - get the group for the profile
   * - show the group
   * - hide other groups
   *
   * - if current group is not 'output'
   * - check if all non-dependsOn questions are answered
   * - if so, show the 'output' group
   *
   * - if current group is 'output'
   * - do nothing
   *
   * - What this changes:
   * - navigation functions just handle moving to first/last question of the next/previous group
   */

  public navigateToNextGroup() {
    const activeGroup = this.getActiveGroup();
    if (!activeGroup) return;

    const { name } = activeGroup;

    if (name === 'customer-identifier' && activeGroup instanceof MainGroup) {
      // progress to profile group
      const profile = this.determineProfile();
      if (!profile) return sharedUtils.logError('Could not determine profile');
      this.initialiseProfileSelect(profile.name);

      const nextGroup = this.getGroupByName(profile.name);
      if (!nextGroup) return sharedUtils.logError('No matching group found for profile:', profile);
      if (!(nextGroup instanceof MainGroup)) return sharedUtils.logError('nextGroup is not a MainGroup', profile);

      const nextGroupIndex = this.groups.indexOf(nextGroup);
      if (nextGroupIndex === -1) return sharedUtils.logError('Profile group index not found');

      this.activeGroupIndex = nextGroupIndex;
      this.showHeader('sticky');
      this.prepareWrapper();
      const firstVisibleIndex = nextGroup.getNextVisibleIndex(-1);
      if (firstVisibleIndex < nextGroup.questions.length) {
        nextGroup.activeQuestionIndex = firstVisibleIndex;
        const firstQuestion = nextGroup.getActiveQuestion();
        nextGroup.activateQuestion(firstQuestion);
        nextGroup.handleNextButton(firstQuestion.isValid());
      }
    } else if (name !== 'output' && activeGroup instanceof MainGroup) {
      // progress to the output group
      const nextGroup = this.getGroupByName('output');
      if (!nextGroup) return sharedUtils.logError('No output group found');
      if (!(nextGroup instanceof OutputGroup)) return sharedUtils.logError('nextGroup is not an OutputGroup');

      const nextGroupIndex = this.groups.indexOf(nextGroup);
      if (nextGroupIndex === -1) return sharedUtils.logError('Output group index not found');

      this.activeGroupIndex = nextGroupIndex;
      nextGroup.show();
      this.prepareWrapper();
      nextGroup.activate();
    } else if (name === 'output') {
      // end of form
    }

    if (this.activeGroupIndex === 0) {
    } else {
      console.log('End of groups');
      console.log('Initiate logic for showing output');
    }
  }

  public navigateToPreviousGroup() {
    /**
     * @todo: check if this keeps groups active that shouldn't be
     */

    const activeGroup = this.getActiveGroup();
    if (!activeGroup) return;

    const { name } = activeGroup;

    /**
     * @todo:
     * - update the remaining code for this
     * - add logic to determine group visibility
     * - add flag on groups for whether all required questions are answered
     * - e.g.
     */
    if (name === 'customer-identifier' && activeGroup instanceof MainGroup) {
      // do nothing
    } else if (name !== 'output' && activeGroup instanceof MainGroup) {
      // return to identifier group

      const previousGroup = this.getGroupByName('customer-identifier') as MainGroup;
      const previousGroupIndex = this.groups.indexOf(previousGroup);
      this.activeGroupIndex = previousGroupIndex;
      this.showHeader('static');
      const lastVisibleIndex = previousGroup.getPrevVisibleIndex(previousGroup.questions.length);
      if (lastVisibleIndex < 0) return sharedUtils.logError('No previous group found');

      previousGroup.activeQuestionIndex = lastVisibleIndex;
      previousGroup.activateQuestion(previousGroup.getActiveQuestion());
      return;
    } else if (name === 'output' && activeGroup instanceof OutputGroup) {
      // return to profile group
    } else {
      // decide what to do
    }

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
    this.groups.forEach((group) => (group instanceof MainGroup ? group.reset() : null));
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
