import { simulateEvent } from '@finsweet/ts-utils';

import { attr } from './constants';
import { MainGroup, OutputGroup } from './Groups';
import { MCTManager } from 'src/mct/shared/MCTManager';
import { logError } from '$mct/utils';
import { queryElement } from '$utils/dom/queryElement';
import { queryElements } from '$utils/dom/queryelements';
import type { Profile, QuestionsStageOptions } from '$mct/types';
import { GroupNameENUM } from '$mct/types';
import { ProfileNameENUM, StageIDENUM } from '$mct/types';
import { FormManager } from './Manager_Base';

export class MainFormManager extends FormManager {
  public activeGroupIndex: number = 0;
  public components: {
    header: HTMLElement;
    stickyHeader: HTMLElement;
    identifier: HTMLElement;
    // profileSelect: HTMLSelectElement;
    wrapper: HTMLElement;
    scroll: HTMLElement;
    nextButton: HTMLButtonElement;
    prevButton: HTMLButtonElement;
    groupElements: HTMLElement[];
    hideOnGroup: HTMLElement[];
    showOnGroup: HTMLElement[];
  };
  private optionRemoved: boolean = false;

  constructor(component: HTMLElement) {
    super(component);
    this.components = {
      header: queryElement(`[${attr.components}="header"]`, component) as HTMLElement,
      stickyHeader: queryElement(`[${attr.components}="sticky-header"]`, component) as HTMLElement,
      identifier: queryElement(`[${attr.components}="identifier"]`, component) as HTMLElement,
      // profileSelect: queryElement(`[${attr.components}="profile-select"]`, component) as HTMLSelectElement,
      wrapper: queryElement(`[${attr.components}="wrapper"]`, component) as HTMLElement,
      scroll: queryElement(`[${attr.components}="scroll"]`, component) as HTMLElement,
      nextButton: queryElement(`[${attr.components}="next"]`, component) as HTMLButtonElement,
      prevButton: queryElement(`[${attr.components}="previous"]`, component) as HTMLButtonElement,
      groupElements: queryElements(`[${attr.group}]`, component) as HTMLElement[],
      hideOnGroup: queryElements(`[${attr.hideOnGroup}]`, component) as HTMLElement[],
      showOnGroup: queryElements(`[${attr.showOnGroup}]`, component) as HTMLElement[],
    };
  }

  public init(options?: QuestionsStageOptions): void {
    if (this.isInitialised) return;
    this.isInitialised = true;

    this.showHeader('static');

    this.components.groupElements.forEach((groupEl, index) => {
      const name = groupEl.getAttribute(attr.group) as GroupNameENUM;
      if (!name) return;

      const group = name === GroupNameENUM.Output ? new OutputGroup(groupEl, this) : new MainGroup(groupEl, this);
      index === 0 ? group.show() : group.hide();
      this.groups.push(group);
    });

    this.handleShowHideOnGroup();

    this.prepareWrapper();

    const initialGroup = this.getActiveGroup();
    if (initialGroup) initialGroup.show();

    // Handle profile option if provided
    this.handleIdentifier();

    // // Handle prefill option if provided
    // if (options?.prefill) {
    //   const answers = this.getAnswers();
    //   this.prefill(answers);
    // }

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

  public show(): void {
    this.component.style.removeProperty('display');
  }

  public hide(): void {
    this.component.style.display = 'none';
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
    if (group instanceof MainGroup) return group.questions[0].getElement();
    if (group instanceof OutputGroup) return group.getComponent();
    return null;
  }

  private getLastEl(): HTMLElement | undefined {
    const group = this.groups.at(this.activeGroupIndex);
    if (group instanceof MainGroup) {
      // Find the last visible question
      const visibleQuestions = group.getVisibleQuestions();
      if (visibleQuestions.length === 0) return undefined;
      return visibleQuestions.at(-1)?.getElement();
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

  private getGroupByName(name: GroupNameENUM): MainGroup | OutputGroup | undefined {
    return this.groups.find((group) => group.name === name);
  }

  public updateGroupVisibility(): void {
    // Always show customer-identifier
    const identifierGroup = this.getGroupByName(GroupNameENUM.CustomerIdentifier) as MainGroup;
    identifierGroup.show();

    // Get the profile
    const profile = this.determineProfile();
    if (!profile) {
      this.groups.filter((group) => group !== identifierGroup).forEach((group) => group.hide());
      return;
    }

    // Show the profile group if it exists
    const profileGroup = this.getGroupByName(profile.name as any) as MainGroup;
    profileGroup.show();

    // Show output group if it exists
    const outputGroup = this.getGroupByName(GroupNameENUM.Output) as OutputGroup;
    profileGroup.isComplete() ? outputGroup.show() : outputGroup.hide();

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
    if (!activeGroup) return logError(`Next group: No active group found`);
    if (!this.profile) return logError(`Next group: No profile found`);

    const { name } = activeGroup;
    if (name === GroupNameENUM.CustomerIdentifier && activeGroup instanceof MainGroup) {
      // progress to profile group from identifier group
      this.handleIdentifier(this.profile);

      const profileGroup = this.getGroupByName(this.profile.name as any) as MainGroup;
      if (!profileGroup) return logError(`Next group: No matching group for profile: ${this.profile.name}`);

      const profileGroupIndex = this.groups.indexOf(profileGroup);
      if (profileGroupIndex === -1) return logError(`Next group: No group index for profile: ${this.profile.name}`);

      this.activeGroupIndex = profileGroupIndex;
      this.showHeader('sticky');

      const firstVisibleIndex = profileGroup.getNextVisibleIndex(-1);
      if (firstVisibleIndex < profileGroup.questions.length) {
        profileGroup.activeQuestionIndex = firstVisibleIndex;
        const firstQuestion = profileGroup.getActiveQuestion();
        profileGroup.activateQuestion(firstQuestion);
        profileGroup.handleNextButton(firstQuestion.isValid());
      }
    } else if (name !== GroupNameENUM.Output && activeGroup instanceof MainGroup) {
      // progress to the output group from profile group
      const outputGroup = this.getGroupByName(GroupNameENUM.Output) as OutputGroup;
      if (!outputGroup) return logError(`Next group: No output group found`);

      const outputGroupIndex = this.groups.indexOf(outputGroup);
      if (outputGroupIndex === -1) return logError(`Next group: No group index for output`);

      this.activeGroupIndex = outputGroupIndex;
      outputGroup.activate();
    } else if (name === GroupNameENUM.Output && activeGroup instanceof OutputGroup) {
      // end of form, determine next step
      // console.log('End of form, navigate to results');
      // console.log(MCTManager.getAnswers());
      MCTManager.goToStage(StageIDENUM.Results);
    }

    this.components.hideOnGroup.forEach((element) => {
      element.style.display = 'none';
    });

    this.components.showOnGroup.forEach((element) => {
      element.style.display = 'block';
    });

    this.handleShowHideOnGroup();
  }

  private handleShowHideOnGroup(): void {
    console.log('handleShowHideOnGroup');
    const activeGroup = this.getActiveGroup();
    console.log(activeGroup);
    if (!activeGroup) return;

    const { name } = activeGroup;
    console.log(name);

    // hide elements that are in the hideOnGroup array
    this.components.hideOnGroup.forEach((element) => {
      const group = element.getAttribute(attr.hideOnGroup);

      if (group === name) {
        element.style.display = 'none';
      } else {
        element.style.removeProperty('display');
      }
    });

    // show elements that are in the showOnGroup array
    this.components.showOnGroup.forEach((element) => {
      const group = element.getAttribute(attr.showOnGroup);

      if (group === name) {
        element.style.removeProperty('display');
      } else {
        element.style.display = 'none';
      }
    });
  }

  public navigateToPreviousGroup() {
    const activeGroup = this.getActiveGroup();
    if (!activeGroup) return logError(`Previous group: No active group found`);
    if (!this.profile) return logError(`Previous group: No profile found`);

    // save previous group to determine which group to navigate to
    let previousGroup: MainGroup | OutputGroup | undefined;

    const { name } = activeGroup;
    if (name === GroupNameENUM.Output && activeGroup instanceof OutputGroup) {
      // revert to profile group from output group
      const profileGroup = this.getGroupByName(this.profile.name as any) as MainGroup;
      if (!profileGroup) return logError(`Previous group: No matching group for profile: ${this.profile.name}`);

      const profileGroupIndex = this.groups.indexOf(profileGroup);
      if (profileGroupIndex === -1) return logError(`Previous group: No group index for profile: ${this.profile.name}`);

      this.activeGroupIndex = profileGroupIndex;
      this.showHeader('sticky');
      previousGroup = profileGroup;
    } else if (name !== GroupNameENUM.CustomerIdentifier && activeGroup instanceof MainGroup) {
      // revert to the identifier group from profile group
      const identifierGroup = this.getGroupByName(GroupNameENUM.CustomerIdentifier) as MainGroup;
      if (!identifierGroup) return logError(`Previous group: No identifier group found`);

      const identifierGroupIndex = this.groups.indexOf(identifierGroup);
      if (identifierGroupIndex === -1) return logError(`Previous group: No group index for identifier`);

      this.activeGroupIndex = identifierGroupIndex;
      this.showHeader('static');
      previousGroup = identifierGroup;
    } else return this.handleShowHideOnGroup();

    if (!previousGroup) return logError(`Previous group: No previous group found`);
    if (!(previousGroup instanceof MainGroup)) return logError(`Previous group: Previous group is not a main group`);

    // get the last visible question in the identifier group and activate it
    const lastVisibleIndex = previousGroup.getPrevVisibleIndex(previousGroup.questions.length);
    if (lastVisibleIndex < 0)
      return logError(`Previous group: No last visible index group for profile: ${this.profile}`);

    previousGroup.activeQuestionIndex = lastVisibleIndex;
    previousGroup.activateQuestion(previousGroup.getActiveQuestion());

    this.handleShowHideOnGroup();
  }

  private handleIdentifier(profile?: Profile) {
    console.log('handleIdentifier', profile);
    if (!profile) {
      this.components.identifier.style.display = 'none';
    } else {
      this.components.identifier.textContent = profile.display;
      this.components.identifier.style.removeProperty('display');
    }
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

  // public reset() {
  //   MCTManager.clearAnswers();
  //   this.groups.forEach((group) => (group instanceof MainGroup ? group.reset() : null));
  // }
}
