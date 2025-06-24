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

export abstract class FormManager {
  protected component: HTMLElement;
  protected profile: Profile | null = null;
  protected groups: (MainGroup | OutputGroup)[] = [];
  protected questions: Set<Question> = new Set();

  constructor(component: HTMLElement) {
    this.component = component;
  }

  public abstract init(): void;

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

  public saveQuestion(question: Question): void {
    this.questions.add(question);
  }

  public removeQuestion(question: Question): void {
    this.questions.delete(question);
  }

  public getQuestions(): Set<Question> {
    return this.questions;
  }

  public determineProfile(): Profile | null {
    const answers = this.getAnswers();
    const profile: Profile | undefined = PROFILES.find((profile) => {
      return Object.entries(profile.requirements).every(([key, value]) => answers[key] === value);
    });

    this.profile = profile ? profile : null;
    return profile ? profile : null;
  }

  protected reset(): void {
    MCTManager.clearAnswers();
    this.groups.forEach((group) => (group instanceof MainGroup ? group.reset() : null));
  }
}

export class MainFormManager extends FormManager {
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
      if (!currentGroup || currentGroup instanceof OutputGroup) {
        this.navigateToPreviousGroup();
        return;
      }

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

  public updateGroupVisibility(): void {
    // Always show customer-identifier
    const identifierGroup = this.getGroupByName('customer-identifier') as MainGroup;
    identifierGroup.show();

    // Get the profile
    const profile = this.determineProfile();
    if (!profile) return;

    // Show the profile group if it exists
    const profileGroup = this.getGroupByName(profile.name) as MainGroup;
    profileGroup.show();

    // Show output group if it exists
    const outputGroup = this.getGroupByName('output') as OutputGroup;
    if (profileGroup.isComplete()) {
      outputGroup.show();
    } else {
      outputGroup.hide();
    }

    this.groups
      .filter((group) => group !== identifierGroup && group !== profileGroup && group !== outputGroup)
      .forEach((group) => group.hide());
  }

  public getPreviousGroupInSequence(): MainGroup | OutputGroup | undefined {
    if (this.activeGroupIndex <= 0) return undefined;
    return this.groups[0];
  }

  public navigateToNextGroup() {
    const activeGroup = this.getActiveGroup();
    if (!activeGroup) return sharedUtils.logError(`Next group: No active group found`);
    if (!this.profile) return sharedUtils.logError(`Next group: No profile found`);

    const { name } = activeGroup;
    if (name === 'customer-identifier' && activeGroup instanceof MainGroup) {
      // progress to profile group from identifier group
      this.initialiseProfileSelect(this.profile.name);

      const profileGroup = this.getGroupByName(this.profile.name) as MainGroup;
      if (!profileGroup) return sharedUtils.logError(`Next group: No matching group for profile: ${this.profile.name}`);

      const profileGroupIndex = this.groups.indexOf(profileGroup);
      if (profileGroupIndex === -1)
        return sharedUtils.logError(`Next group: No group index for profile: ${this.profile.name}`);

      this.activeGroupIndex = profileGroupIndex;
      this.showHeader('sticky');

      const firstVisibleIndex = profileGroup.getNextVisibleIndex(-1);
      if (firstVisibleIndex < profileGroup.questions.length) {
        profileGroup.activeQuestionIndex = firstVisibleIndex;
        const firstQuestion = profileGroup.getActiveQuestion();
        profileGroup.activateQuestion(firstQuestion);
        profileGroup.handleNextButton(firstQuestion.isValid());
      }
    } else if (name !== 'output' && activeGroup instanceof MainGroup) {
      // progress to the output group from profile group
      const outputGroup = this.getGroupByName('output') as OutputGroup;
      if (!outputGroup) return sharedUtils.logError(`Next group: No output group found`);

      const outputGroupIndex = this.groups.indexOf(outputGroup);
      if (outputGroupIndex === -1) return sharedUtils.logError(`Next group: No group index for output`);

      this.activeGroupIndex = outputGroupIndex;
      outputGroup.activate();
    } else if (name === 'output' && activeGroup instanceof OutputGroup) {
      // end of form, determine next step
      console.log('End of form, navigate to results');
      MCTManager.goToStage('results');
    }
  }

  public navigateToPreviousGroup() {
    const activeGroup = this.getActiveGroup();
    if (!activeGroup) return sharedUtils.logError(`Previous group: No active group found`);
    if (!this.profile) return sharedUtils.logError(`Previous group: No profile found`);

    // save previous group to determine which group to navigate to
    let previousGroup: MainGroup | OutputGroup | undefined;

    const { name } = activeGroup;
    if (name === 'output' && activeGroup instanceof OutputGroup) {
      // revert to profile group from output group
      const profileGroup = this.getGroupByName(this.profile.name) as MainGroup;
      if (!profileGroup)
        return sharedUtils.logError(`Previous group: No matching group for profile: ${this.profile.name}`);

      const profileGroupIndex = this.groups.indexOf(profileGroup);
      if (profileGroupIndex === -1)
        return sharedUtils.logError(`Previous group: No group index for profile: ${this.profile.name}`);

      this.activeGroupIndex = profileGroupIndex;
      this.showHeader('sticky');
      previousGroup = profileGroup;
    } else if (name !== 'customer-identifier' && activeGroup instanceof MainGroup) {
      // revert to the identifier group from profile group
      const identifierGroup = this.getGroupByName('customer-identifier') as MainGroup;
      if (!identifierGroup) return sharedUtils.logError(`Previous group: No identifier group found`);

      const identifierGroupIndex = this.groups.indexOf(identifierGroup);
      if (identifierGroupIndex === -1) return sharedUtils.logError(`Previous group: No group index for identifier`);

      this.activeGroupIndex = identifierGroupIndex;
      this.showHeader('static');
      previousGroup = identifierGroup;
    } else return; // start of form, do nothing

    if (!previousGroup) return sharedUtils.logError(`Previous group: No previous group found`);
    if (!(previousGroup instanceof MainGroup))
      return sharedUtils.logError(`Previous group: Previous group is not a main group`);

    // get the last visible question in the identifier group and activate it
    const lastVisibleIndex = previousGroup.getPrevVisibleIndex(previousGroup.questions.length);
    if (lastVisibleIndex < 0)
      return sharedUtils.logError(`Previous group: No last visible index group for profile: ${this.profile}`);

    previousGroup.activeQuestionIndex = lastVisibleIndex;
    previousGroup.activateQuestion(previousGroup.getActiveQuestion());
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

    this.prepareWrapper();
  }

  public reset() {
    MCTManager.clearAnswers();
    this.groups.forEach((group) => (group instanceof MainGroup ? group.reset() : null));
  }
}
