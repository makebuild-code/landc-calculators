/**
 * entry point for the stage
 */

import { MCTManager } from 'src/mct/shared/manager';
import { questionsManager } from 'src/mct/stages/questions/QuestionsManager';

import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import { attr } from './constants';
import { QuestionGroup } from './QuestionGroup';
import { utils } from './utils';

export const initQuestions = () => {
  const component = MCTManager.getStage('questions');
  if (!component) throw new Error('Questions stage not found');
  questionsManager.setComponent(component);

  const header = queryElement(`[${attr.components}="header"]`, component) as HTMLElement;
  const stickyHeader = queryElement(`[${attr.components}="sticky-header"]`, component) as HTMLElement;
  const profileSelect = queryElement(`[${attr.components}="profile-select"]`, component) as HTMLSelectElement;

  if (header) questionsManager.setHeader(header);
  if (stickyHeader) questionsManager.setStickyHeader(stickyHeader);
  if (profileSelect) questionsManager.setProfileSelect(profileSelect);
  questionsManager.showHeader('static');

  const nextButton = queryElement(`[${attr.components}="next"]`, component) as HTMLButtonElement;

  const handleInputChange = (isValid: boolean) => {
    utils.updateNavigation({ nextEnabled: isValid });
  };

  const groupEls = queryElements(`[${attr.group}]`, component) as HTMLElement[];
  groupEls.forEach((groupEl, index) => {
    const group = new QuestionGroup(groupEl, handleInputChange);
    index === 0 ? group.show() : group.hide();
    questionsManager.registerGroup(group);
  });

  utils.prepareWrapper();

  // Initialize first group
  const initialGroup = questionsManager.getActiveGroup();
  if (initialGroup) initialGroup.show();

  component.addEventListener('mct:navigation:update', (event: Event) => {
    const { nextEnabled, prevEnabled } = (event as CustomEvent).detail;
    if (typeof nextEnabled === 'boolean') nextButton.disabled = !nextEnabled;
    if (typeof prevEnabled === 'boolean') prevButton.disabled = !prevEnabled;
  });

  nextButton.addEventListener('click', () => {
    const currentGroup = questionsManager.getActiveGroup();
    if (!currentGroup) return;

    const currentItem = currentGroup.getActiveQuestion();
    if (!currentItem.isValid()) return;

    currentGroup.navigate('next');
  });

  const prevButton = queryElement(`[${attr.components}="previous"]`, component) as HTMLButtonElement;

  prevButton.addEventListener('click', () => {
    const currentGroup = questionsManager.getActiveGroup();
    if (!currentGroup) return;

    currentGroup.navigate('prev');
  });
};
