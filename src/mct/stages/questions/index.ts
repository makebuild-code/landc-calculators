/**
 * entry point for the stage
 */

import { getStage } from 'src/mct/shared/dom';
import { manager } from 'src/mct/shared/manager';

import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import { attr } from './constants';
import { QuestionGroup } from './QuestionGroup';
import { prepareWrapper } from './utils/prepareWrapper';
import { updateNavigation } from './utils/updateNavigation';

let currentGroup: QuestionGroup;

export const initQuestionsStage = () => {
  const component = getStage('questions');
  const nextButton = queryElement(`[${attr.components}="next"]`, component) as HTMLButtonElement;

  const handleInputChange = (isValid: boolean) => {
    updateNavigation({ nextEnabled: isValid });
  };

  const groupEls = queryElements(`[${attr.group}]`, component) as HTMLElement[];
  const groups = groupEls.map((groupEl) => {
    const group = new QuestionGroup(groupEl, handleInputChange);
    manager.registerGroup(group);
    return group;
  });

  prepareWrapper();

  [currentGroup] = groups;
  // currentGroup.show();
  // handleInputChange(currentGroup.getCurrentQuestion().isValid() ?? false);

  component.addEventListener('mct:navigation:update', (event: Event) => {
    const { nextEnabled, prevEnabled } = (event as CustomEvent).detail;
    if (typeof nextEnabled === 'boolean') nextButton.disabled = !nextEnabled;
    if (typeof prevEnabled === 'boolean') prevButton.disabled = !prevEnabled;
  });

  nextButton.addEventListener('click', () => {
    const currentItem = currentGroup.getCurrentQuestion();
    if (!currentItem.isValid()) return;

    currentGroup.advance();
  });

  const prevButton = queryElement(
    `[${attr.components}="previous"]`,
    component
  ) as HTMLButtonElement;

  prevButton.addEventListener('click', () => {
    const { currentQuestionIndex } = currentGroup;
    if (currentQuestionIndex === 0) return;
    currentGroup.goBack();
    if (currentQuestionIndex === 1) updateNavigation({ prevEnabled: false });
  });
};
