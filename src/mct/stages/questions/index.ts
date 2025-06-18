/**
 * entry point for the stage
 */

import { getStage } from 'src/mct/shared/dom';
import { questionStageManager } from 'src/mct/stages/questions/QuestionStageManager';

import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import { attr } from './constants';
import { QuestionGroup } from './QuestionGroup';
import { utils } from './utils';

export const initQuestionsStage = () => {
  const component = getStage('questions');
  questionStageManager.setQuestionsComponent(component);

  const header = queryElement(`[${attr.components}="header"]`, component) as HTMLElement;
  const stickyHeader = queryElement(
    `[${attr.components}="sticky-header"]`,
    component
  ) as HTMLElement;
  const profileSelect = queryElement(
    `[${attr.components}="profile-select"]`,
    component
  ) as HTMLSelectElement;

  if (header) questionStageManager.setHeader(header);
  if (stickyHeader) questionStageManager.setStickyHeader(stickyHeader);
  if (profileSelect) questionStageManager.setProfileSelect(profileSelect);
  questionStageManager.showHeader('static');

  const nextButton = queryElement(`[${attr.components}="next"]`, component) as HTMLButtonElement;

  const handleInputChange = (isValid: boolean) => {
    utils.updateNavigation({ nextEnabled: isValid });
  };

  const groupEls = queryElements(`[${attr.group}]`, component) as HTMLElement[];
  groupEls.forEach((groupEl, index) => {
    const group = new QuestionGroup(groupEl, handleInputChange);
    index === 0 ? group.show() : group.hide();
    questionStageManager.registerGroup(group);
  });

  utils.prepareWrapper();

  // Initialize first group
  const initialGroup = questionStageManager.getActiveGroup();
  if (initialGroup) initialGroup.show();

  component.addEventListener('mct:navigation:update', (event: Event) => {
    const { nextEnabled, prevEnabled } = (event as CustomEvent).detail;
    if (typeof nextEnabled === 'boolean') nextButton.disabled = !nextEnabled;
    if (typeof prevEnabled === 'boolean') prevButton.disabled = !prevEnabled;
  });

  nextButton.addEventListener('click', () => {
    const currentGroup = questionStageManager.getActiveGroup();
    if (!currentGroup) return;

    const currentItem = currentGroup.getActiveQuestion();
    if (!currentItem.isValid()) return;

    currentGroup.navigate('next');
  });

  const prevButton = queryElement(
    `[${attr.components}="previous"]`,
    component
  ) as HTMLButtonElement;

  prevButton.addEventListener('click', () => {
    const currentGroup = questionStageManager.getActiveGroup();
    if (!currentGroup) return;

    currentGroup.navigate('prev');
  });
};
