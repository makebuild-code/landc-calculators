import { simulateEvent } from '@finsweet/ts-utils';

import { DOM_CONFIG, EVENTS_CONFIG } from '$mct/config';
import { MainGroup, OutputGroup } from './Groups';
import { MCTManager } from 'src/mct/shared/MCTManager';
import { logError } from '$mct/utils';
import { queryElement } from '$utils/dom/queryElement';
import { queryElements } from '$utils/dom/queryelements';
import type { InputKey, InputValue, LogUserEventCustom, Profile, QuestionsStageOptions } from '$mct/types';
import { GroupNameENUM } from '$mct/types';
import { StageIDENUM } from '$mct/types';
import { FormManager } from './Manager_Base';
import { trackGAEvent } from '$utils/analytics/trackGAEvent';

const attr = DOM_CONFIG.attributes.form;

export class MainFormManager extends FormManager {
  public activeGroupIndex: number = 0;
  private header: HTMLElement;
  private secondHeader: HTMLElement;
  private identifier: HTMLElement;
  // profileSelect: HTMLSelectElement;
  public track: HTMLElement;
  private list: HTMLElement;
  private nextButton: HTMLButtonElement;
  private prevButton: HTMLButtonElement;
  private groupElements: HTMLElement[];
  private hideOnGroup: HTMLElement[];
  private showOnGroup: HTMLElement[];
  private loader: HTMLElement;

  constructor(component: HTMLElement) {
    super(component);

    this.header = queryElement(`[${attr.components}="header"]`, component) as HTMLElement;
    this.secondHeader = queryElement(`[${attr.components}="sticky-header"]`, component) as HTMLElement;
    this.identifier = queryElement(`[${attr.components}="identifier"]`, this.secondHeader) as HTMLElement;
    this.track = queryElement(`[${attr.components}="track"]`, component) as HTMLElement;
    this.list = queryElement(`[${attr.components}="list"]`, this.track) as HTMLElement;
    this.nextButton = queryElement(`[${attr.components}="next"]`, component) as HTMLButtonElement;
    this.prevButton = queryElement(`[${attr.components}="previous"]`, component) as HTMLButtonElement;
    this.groupElements = queryElements(`[${attr.group}]`, this.list) as HTMLElement[];
    this.hideOnGroup = queryElements(`[${attr.hideOnGroup}]`, component) as HTMLElement[];
    this.showOnGroup = queryElements(`[${attr.showOnGroup}]`, component) as HTMLElement[];
    this.loader = queryElement(`[${attr.components}="loader"]`, component) as HTMLElement;

    console.log('this', this);
  }

  public init(): void {
    if (this.isInitialised) return;
    this.isInitialised = true;

    console.log('init: showLoader');
    this.showLoader(true);
    console.log('init: showHeader');
    this.showHeader('static');

    console.log('init: groupElements');
    this.groupElements.forEach((groupEl, index) => {
      const name = groupEl.getAttribute(attr.group) as GroupNameENUM;
      if (!name) return;

      const group = name === GroupNameENUM.Output ? new OutputGroup(groupEl, this) : new MainGroup(groupEl, this);
      index === 0 ? group.show() : group.hide();
      this.groups.push(group);
    });

    console.log('init: handleShowHideOnGroup');
    this.handleShowHideOnGroup();

    // this.prepareWrapper();

    // const initialGroup = this.getActiveGroup();
    // if (initialGroup) initialGroup.show();

    // Handle profile option if provided
    console.log('init: handleIdentifier');
    this.handleIdentifier();

    console.log('init: mct:navigation:update');
    this.component.addEventListener('mct:navigation:update', (event: Event) => {
      const { nextEnabled, prevEnabled } = (event as CustomEvent).detail;
      if (typeof nextEnabled === 'boolean') this.nextButton.disabled = !nextEnabled;
      if (typeof prevEnabled === 'boolean') this.prevButton.disabled = !prevEnabled;
    });

    console.log('init: nextButton');
    this.nextButton.addEventListener('click', () => {
      console.log('nextButton clicked');
      const currentGroup = this.getActiveGroup();
      if (!currentGroup || currentGroup instanceof OutputGroup) return;

      const currentItem = currentGroup.getActiveQuestion();
      if (!currentItem.isValid()) return;

      currentGroup.navigate('next');
    });

    console.log('init: prevButton');
    this.prevButton.addEventListener('click', () => {
      const currentGroup = this.getActiveGroup();
      if (!currentGroup || currentGroup instanceof OutputGroup) {
        this.navigateToPreviousGroup();
        return;
      }

      currentGroup.navigate('prev');
    });

    console.log('init: onMount');
    this.onMount();

    console.log('init: prepareWrapper');
    this.prepareWrapper();

    console.log('init: showLoader: false');
    this.showLoader(false);

    // setTimeout(() => {
    //   this.showLoader(false);
    //   this.prepareWrapper();
    // }, 1000);
  }

  public show(scrollTo: boolean = true): void {
    this.component.style.removeProperty('display');
    if (scrollTo) this.component.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  public hide(): void {
    this.component.style.display = 'none';
  }

  private showLoader(show: boolean): void {
    this.loader.style.display = show ? 'flex' : 'none';
  }

  /**
   * @plan
   *
   * - for the top padding, we want the
   */
  public prepareWrapper(): void {
    // if (this.groups.length === 0) return;
    // const firstItem = this.getFirstEl();
    // const lastItem = this.getLastEl();
    // console.log('firstItem', firstItem);
    // console.log('lastItem', lastItem);
    // if (!firstItem || !lastItem) return;
    // const topPad = this.track.offsetHeight / 2 - firstItem.offsetHeight / 2;
    // const bottomPad = this.track.offsetHeight / 2 - lastItem.offsetHeight / 2;
    // this.list.style.paddingTop = `${topPad}px`;
    // this.list.style.paddingBottom = `${bottomPad}px`;
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

      // Log user event for end of questions
      MCTManager.logUserEvent({
        EventName: EVENTS_CONFIG.questionsComplete,
        EventValue: EVENTS_CONFIG.questionsComplete,
      });

      // Track GA event for showing summary
      trackGAEvent('form_interaction', {
        event_category: 'MCTForm',
        event_label: `MCT_Show_Summary`,
      });
    } else if (name === GroupNameENUM.Output && activeGroup instanceof OutputGroup) {
      // end of form, determine next step
      // console.log('End of form, navigate to results');
      // console.log(MCTManager.getAnswers());

      MCTManager.goToStage(StageIDENUM.Results);
    }

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
    this.hideOnGroup.forEach((element) => {
      const group = element.getAttribute(attr.hideOnGroup);

      if (group === name) {
        element.style.display = 'none';
      } else {
        element.style.removeProperty('display');
      }
    });

    // show elements that are in the showOnGroup array
    this.showOnGroup.forEach((element) => {
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
      this.identifier.style.display = 'none';
    } else {
      this.identifier.textContent = profile.display;
      this.identifier.style.removeProperty('display');
    }
  }

  private showHeader(type: 'static' | 'sticky') {
    if (!this.header || !this.secondHeader) return;
    if (type === 'static') {
      this.header.style.removeProperty('display');
      this.secondHeader.style.display = 'none';
    } else if (type === 'sticky') {
      this.header.style.display = 'none';
      this.secondHeader.style.removeProperty('display');
    }

    this.prepareWrapper();
  }

  // public reset() {
  //   MCTManager.clearAnswers();
  //   this.groups.forEach((group) => (group instanceof MainGroup ? group.reset() : null));
  // }
}
