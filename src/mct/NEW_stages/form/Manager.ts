import { DOM_CONFIG } from '$mct/config';
import { MainGroup, OutputGroup } from './Groups';
import { MCTManager } from 'src/mct/shared/MCTManager';
import { logError } from '$mct/utils';
import type { Profile } from '$mct/types';
import { FormEventNames, GroupNameENUM } from '$mct/types';
import { StageIDENUM } from '$mct/types';
import { BaseFormManager, type BaseFormManagerOptions, type BaseFormManagerState } from './Base';

const attr = DOM_CONFIG.attributes.form;

export interface MainFormManagerOptions extends BaseFormManagerOptions {}

export interface MainFormManagerState extends BaseFormManagerState {}

export class MainFormManager extends BaseFormManager {
  public components: {
    header: HTMLElement;
    stickyHeader: HTMLElement;
    identifier: HTMLElement;
    wrapper: HTMLElement;
    scroll: HTMLElement;
    nextButton: HTMLButtonElement;
    prevButton: HTMLButtonElement;
    groupElements: HTMLElement[];
    hideOnGroup: HTMLElement[];
    showOnGroup: HTMLElement[];
  };

  constructor(options: MainFormManagerOptions) {
    super(options);

    this.components = {
      header: this.queryElement(`[${attr.components}="header"]`) as HTMLElement,
      stickyHeader: this.queryElement(`[${attr.components}="sticky-header"]`) as HTMLElement,
      identifier: this.queryElement(`[${attr.components}="identifier"]`) as HTMLElement,
      wrapper: this.queryElement(`[${attr.components}="wrapper"]`) as HTMLElement,
      scroll: this.queryElement(`[${attr.components}="scroll"]`) as HTMLElement,
      nextButton: this.queryElement(`[${attr.components}="next"]`) as HTMLButtonElement,
      prevButton: this.queryElement(`[${attr.components}="previous"]`) as HTMLButtonElement,
      groupElements: this.queryElements(`[${attr.group}]`) as HTMLElement[],
      hideOnGroup: this.queryElements(`[${attr.hideOnGroup}]`) as HTMLElement[],
      showOnGroup: this.queryElements(`[${attr.showOnGroup}]`) as HTMLElement[],
    };
  }

  protected init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.onInit();

    this.showHeader('static');

    this.components.groupElements.forEach((groupEl, index) => {
      const name = groupEl.getAttribute(attr.group) as GroupNameENUM;
      if (!name) return;

      const group = name === GroupNameENUM.Output ? new OutputGroup(groupEl, this) : new MainGroup(groupEl, this);
      index === 0 ? group.show() : group.hide();

      const groups = this.getStateValue('groups');
      groups.push(group);
      this.setStateValue('groups', groups);
    });

    this.handleShowHideOnGroup();

    this.prepareWrapper();

    const initialGroup = this.getActiveGroup();
    if (initialGroup) initialGroup.show();

    // Handle profile option if provided
    this.handleIdentifier();

    this.eventBus.on(FormEventNames.NAVIGATION_UPDATE, (payload) => {
      const { nextEnabled, prevEnabled } = payload;
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
    if (this.getStateValue('groups').length === 0) return;

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
    const group = this.getStateValue('groups')[0];
    if (group instanceof MainGroup) return group.questions[0].getElement();
    if (group instanceof OutputGroup) return group.getComponent();
    return null;
  }

  private getLastEl(): HTMLElement | undefined {
    const group = this.getStateValue('groups').at(this.getStateValue('activeGroupIndex'));
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
    this.eventBus.emit(FormEventNames.NAVIGATION_UPDATE, options);
  }

  public handleInputChange(isValid: boolean) {
    this.updateNavigation({ nextEnabled: isValid });
  }

  private getActiveGroup(): MainGroup | OutputGroup | undefined {
    return this.getStateValue('groups')[this.getStateValue('activeGroupIndex')];
  }

  private getGroupByName(name: GroupNameENUM): MainGroup | OutputGroup | undefined {
    return this.getStateValue('groups').find((group) => group.name === name);
  }

  public updateGroupVisibility(): void {
    // Always show customer-identifier
    const identifierGroup = this.getGroupByName(GroupNameENUM.CustomerIdentifier) as MainGroup;
    identifierGroup.show();

    // Get the profile
    const profile = this.determineProfile();
    if (!profile) {
      this.getStateValue('groups')
        .filter((group) => group !== identifierGroup)
        .forEach((group) => group.hide());
      return;
    }

    // Show the profile group if it exists
    const profileGroup = this.getGroupByName(profile.name as any) as MainGroup;
    profileGroup.show();

    // Show output group if it exists
    const outputGroup = this.getGroupByName(GroupNameENUM.Output) as OutputGroup;
    profileGroup.isComplete() ? outputGroup.show() : outputGroup.hide();

    this.getStateValue('groups')
      .filter((group) => group !== identifierGroup && group !== profileGroup && group !== outputGroup)
      .forEach((group) => group.hide());
  }

  public getPreviousGroupInSequence(): MainGroup | OutputGroup | undefined {
    if (this.getStateValue('activeGroupIndex') <= 0) return undefined;
    return this.getStateValue('groups')[0];
  }

  public navigateToNextGroup() {
    const activeGroup = this.getActiveGroup();
    if (!activeGroup) return logError(`Next group: No active group found`);
    const profile = this.getStateValue('profile');
    if (!profile) return logError(`Next group: No profile found`);

    const { name } = activeGroup;
    if (name === GroupNameENUM.CustomerIdentifier && activeGroup instanceof MainGroup) {
      // progress to profile group from identifier group
      this.handleIdentifier(profile);

      const profileGroup = this.getGroupByName(profile.name as any) as MainGroup;
      if (!profileGroup) return logError(`Next group: No matching group for profile: ${profile.name}`);

      const profileGroupIndex = this.getStateValue('groups').indexOf(profileGroup);
      if (profileGroupIndex === -1) return logError(`Next group: No group index for profile: ${profile.name}`);

      this.setStateValue('activeGroupIndex', profileGroupIndex);
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

      const outputGroupIndex = this.getStateValue('groups').indexOf(outputGroup);
      if (outputGroupIndex === -1) return logError(`Next group: No group index for output`);

      this.setStateValue('activeGroupIndex', outputGroupIndex);
      outputGroup.activate();
    } else if (name === GroupNameENUM.Output && activeGroup instanceof OutputGroup) {
      // End of form, navigate to results
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
    const profile = this.getStateValue('profile');
    if (!profile) return logError(`Previous group: No profile found`);

    // save previous group to determine which group to navigate to
    let previousGroup: MainGroup | OutputGroup | undefined;

    const { name } = activeGroup;
    if (name === GroupNameENUM.Output && activeGroup instanceof OutputGroup) {
      // revert to profile group from output group
      const profileGroup = this.getGroupByName(profile.name as any) as MainGroup;
      if (!profileGroup) return logError(`Previous group: No matching group for profile: ${profile.name}`);

      const profileGroupIndex = this.getStateValue('groups').indexOf(profileGroup);
      if (profileGroupIndex === -1) return logError(`Previous group: No group index for profile: ${profile.name}`);

      this.setStateValue('activeGroupIndex', profileGroupIndex);
      this.showHeader('sticky');
      previousGroup = profileGroup;
    } else if (name !== GroupNameENUM.CustomerIdentifier && activeGroup instanceof MainGroup) {
      // revert to the identifier group from profile group
      const identifierGroup = this.getGroupByName(GroupNameENUM.CustomerIdentifier) as MainGroup;
      if (!identifierGroup) return logError(`Previous group: No identifier group found`);

      const identifierGroupIndex = this.getStateValue('groups').indexOf(identifierGroup);
      if (identifierGroupIndex === -1) return logError(`Previous group: No group index for identifier`);

      this.setStateValue('activeGroupIndex', identifierGroupIndex);
      this.showHeader('static');
      previousGroup = identifierGroup;
    } else return this.handleShowHideOnGroup();

    if (!previousGroup) return logError(`Previous group: No previous group found`);
    if (!(previousGroup instanceof MainGroup)) return logError(`Previous group: Previous group is not a main group`);

    // get the last visible question in the identifier group and activate it
    const lastVisibleIndex = previousGroup.getPrevVisibleIndex(previousGroup.questions.length);
    if (lastVisibleIndex < 0) return logError(`Previous group: No last visible index group for profile: ${profile}`);

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
}
