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
import { QuestionComponent } from './Questions';

const attr = DOM_CONFIG.attributes.form;

export class MainFormManager extends FormManager {
  public activeGroupIndex: number = 0;
  private header: HTMLElement;
  private secondHeader: HTMLElement;
  private identifier: HTMLElement | null = null;
  // profileSelect: HTMLSelectElement;
  private container: HTMLElement;
  public track: HTMLElement;
  private list: HTMLElement;
  private buttonContainer: HTMLElement;
  private nextButton: HTMLButtonElement;
  private prevButton: HTMLButtonElement;
  private groupElements: HTMLElement[];
  private hideOnGroup: HTMLElement[];
  private showOnGroup: HTMLElement[];
  private loader: HTMLElement;
  private activeHeader: 'static' | 'sticky' = 'static';

  constructor(component: HTMLElement) {
    super(component);

    this.header = queryElement(`[${attr.components}="header"]`, component) as HTMLElement;
    this.secondHeader = queryElement(`[${attr.components}="sticky-header"]`, component) as HTMLElement;
    this.identifier = queryElement(`[${attr.components}="identifier"]`, this.secondHeader) as HTMLElement | null;
    this.container = queryElement(`[${attr.components}="container"]`, component) as HTMLElement;
    this.track = queryElement(`[${attr.components}="track"]`, this.container) as HTMLElement;
    this.list = queryElement(`[${attr.components}="list"]`, this.track) as HTMLElement;
    this.buttonContainer = queryElement(`[${attr.components}="button-container"]`, this.component) as HTMLElement;
    this.nextButton = queryElement(`[${attr.components}="next"]`, this.buttonContainer) as HTMLButtonElement;
    this.prevButton = queryElement(`[${attr.components}="previous"]`, this.buttonContainer) as HTMLButtonElement;
    this.groupElements = queryElements(`[${attr.group}]`, this.list) as HTMLElement[];
    this.hideOnGroup = queryElements(`[${attr.hideOnGroup}]`, component) as HTMLElement[];
    this.showOnGroup = queryElements(`[${attr.showOnGroup}]`, component) as HTMLElement[];
    this.loader = queryElement(`[${attr.components}="loader"]`, component) as HTMLElement;
  }

  public init(): void {
    if (this.isInitialised) return;
    this.isInitialised = true;

    this.showLoader(true);
    this.showHeader('static');

    this.groupElements.forEach((groupEl, index) => {
      const name = groupEl.getAttribute(attr.group) as GroupNameENUM;
      if (!name) return;

      const group = name === GroupNameENUM.Output ? new OutputGroup(groupEl, this) : new MainGroup(groupEl, this);
      index === 0 ? group.show() : group.hide();
      this.groups.push(group);
    });

    this.handleShowHideOnGroup();

    // Handle profile option if provided
    this.handleIdentifier(null);

    this.nextButton.addEventListener('click', () => {
      // const currentGroup = this.getActiveGroup();
      const currentGroup = this.getLastVisibleGroup();

      if (!currentGroup) return;
      else if (currentGroup instanceof OutputGroup) {
        currentGroup.activate();
        this.updateNavigation({ nextEnabled: false });
      } else if (currentGroup instanceof MainGroup) {
        const currentItem = currentGroup.getActiveQuestion();
        if (!currentItem.isValid()) {
          this.scrollTo('bottom');
          return;
        }

        currentGroup.navigate('next');
      }
    });

    this.prevButton.addEventListener('click', () => {
      const currentGroup = this.getActiveGroup();
      if (!currentGroup || currentGroup instanceof OutputGroup) {
        this.navigateToPreviousGroup();
        return;
      }

      currentGroup.navigate('prev');
    });

    this.onMount();

    this.prepareWrapper();
    window.addEventListener('resize', () => {
      this.prepareWrapper();
    });

    this.showLoader(false);
  }

  public getLastVisibleGroup(): MainGroup | OutputGroup | undefined {
    let lastVisibleGroup: MainGroup | OutputGroup | undefined;
    this.groups.forEach((group) => {
      if (group.isVisible) lastVisibleGroup = group;
    });
    return lastVisibleGroup;
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
    if (this.groups.length === 0) return;

    // Get the first question
    const firstGroup = this.groups[0] as MainGroup;
    const firstQuestion = firstGroup.questions[0];
    const firstQuestionEl = firstQuestion.getElement();

    // Get the bounding rectangles of the first question and the component
    const firstQuestionRect = firstQuestionEl.getBoundingClientRect();
    const topComponentRect = this.component.getBoundingClientRect();

    // Get the desired and actual distance from the top, and current margin top
    const desiredTop = window.innerHeight / 2 - firstQuestionRect.height / 2;
    const actualDistanceFromTop = firstQuestionRect.top - topComponentRect.top;
    const currentMarginTop = firstQuestionEl.style.marginTop;

    // Margin is the desired - actual + current
    const topMargin = desiredTop - actualDistanceFromTop + parseInt(currentMarginTop || '0');
    firstQuestionEl.style.marginTop = `${topMargin}px`;

    // Get the last visible group and last visible item within
    const lastGroup = this.getLastVisibleGroup();
    const lastItem =
      lastGroup instanceof MainGroup ? lastGroup.getVisibleQuestions().at(-1)?.getElement() : lastGroup?.getComponent();
    if (!lastItem) return;

    const lastItemRect = lastItem?.getBoundingClientRect();
    const bottomComponentRect = this.component.getBoundingClientRect();

    // Get the desired and actual distance from the bottom, and current paddingbottom
    const desiredBottom = window.innerHeight / 2 - lastItemRect.height / 2;
    const actualDistanceFromBottom = bottomComponentRect.bottom - lastItemRect.bottom;
    const currentPaddingBottom = this.track.style.paddingBottom;

    // Padding is the desired - actual + current
    const bottomPadding = desiredBottom - actualDistanceFromBottom + parseInt(currentPaddingBottom || '0');
    this.track.style.paddingBottom = `${bottomPadding}px`;
  }

  public scrollTo(location: 'top' | 'bottom' | QuestionComponent): void {
    if (location === 'top') {
      // Scroll so that the top of this.component is at the top of the page
      window.scrollTo({
        top: this.component.getBoundingClientRect().top + window.scrollY,
        behavior: 'smooth',
      });
    } else if (location === 'bottom') {
      // Scroll so that the bottom of this.component is at the bottom of the page
      const componentRect = this.component.getBoundingClientRect();
      const scrollY = window.scrollY;
      const bottom = componentRect.bottom + scrollY;
      const offset = window.innerHeight;
      window.scrollTo({
        top: bottom - offset,
        behavior: 'smooth',
      });
    } else if (location instanceof QuestionComponent) {
      // Scroll the question element so it appears halfway down the viewport
      const questionEl = location.getElement();
      const rect = questionEl.getBoundingClientRect();
      const scrollY = window.scrollY;
      const elementTop = rect.top + scrollY;
      const elementHeight = rect.height;
      const viewportHeight = window.innerHeight;

      // Calculate the scroll position so the element is centered vertically
      const scrollTo = elementTop - viewportHeight / 2 + elementHeight / 2;

      window.scrollTo({
        top: scrollTo,
        behavior: 'smooth',
      });
    }
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
    if (typeof options.nextEnabled === 'boolean') this.nextButton.disabled = !options.nextEnabled;
    if (typeof options.prevEnabled === 'boolean') this.prevButton.disabled = !options.prevEnabled;
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

    // Get the profile and update the tag (update text or remove tag)
    const profile = this.determineProfile();
    this.handleIdentifier(profile);
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

      const firstRequiredIndex = profileGroup.getNextRequiredIndex(-1);
      if (firstRequiredIndex < profileGroup.questions.length) {
        profileGroup.activeQuestionIndex = firstRequiredIndex;
        const firstQuestion = profileGroup.getActiveQuestion();
        profileGroup.activateQuestion(firstQuestion);
        this.updateNavigation({ nextEnabled: firstQuestion.isValid(), prevEnabled: true });
      }
    } else if (name !== GroupNameENUM.Output && activeGroup instanceof MainGroup) {
      // progress to the output group from profile group
      const outputGroup = this.getGroupByName(GroupNameENUM.Output) as OutputGroup;
      if (!outputGroup) return logError(`Next group: No output group found`);

      const outputGroupIndex = this.groups.indexOf(outputGroup);
      if (outputGroupIndex === -1) return logError(`Next group: No group index for output`);

      this.activeGroupIndex = outputGroupIndex;
      outputGroup.activate();

      this.updateNavigation({ nextEnabled: false, prevEnabled: true });

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
      MCTManager.goToStage(StageIDENUM.Results);
    } else this.updateNavigation({ nextEnabled: true, prevEnabled: true });

    this.handleShowHideOnGroup();
  }

  private handleShowHideOnGroup(): void {
    const activeGroup = this.getActiveGroup();
    if (!activeGroup) return;

    const { name } = activeGroup;

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
      this.updateNavigation({ nextEnabled: true, prevEnabled: true });
    } else if (name !== GroupNameENUM.CustomerIdentifier && activeGroup instanceof MainGroup) {
      // revert to the identifier group from profile group
      const identifierGroup = this.getGroupByName(GroupNameENUM.CustomerIdentifier) as MainGroup;
      if (!identifierGroup) return logError(`Previous group: No identifier group found`);

      const identifierGroupIndex = this.groups.indexOf(identifierGroup);
      if (identifierGroupIndex === -1) return logError(`Previous group: No group index for identifier`);

      this.activeGroupIndex = identifierGroupIndex;
      this.showHeader('static');
      previousGroup = identifierGroup;
      this.updateNavigation({ nextEnabled: true, prevEnabled: true });
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

  private handleIdentifier(profile: Profile | null) {
    if (!this.identifier) return;
    if (!profile) {
      this.identifier.style.display = 'none';
    } else {
      this.identifier.textContent = profile.display;
      this.identifier.style.removeProperty('display');
    }
  }

  public showHeader(type: 'static' | 'sticky') {
    if (!this.header || !this.secondHeader) return;
    if (type === 'static') {
      this.header.style.removeProperty('display');
      this.secondHeader.style.display = 'none';
      this.activeHeader = 'static';
    } else if (type === 'sticky') {
      this.header.style.display = 'none';
      this.secondHeader.style.removeProperty('display');
      this.activeHeader = 'sticky';
    }

    this.prepareWrapper();
  }

  // public reset() {
  //   MCTManager.clearAnswers();
  //   this.groups.forEach((group) => (group instanceof MainGroup ? group.reset() : null));
  // }
}
