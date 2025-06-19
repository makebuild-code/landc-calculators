/**
 * helper functions
 */

import { MCTManager } from 'src/mct/shared/manager';
import { questionsManager } from 'src/mct/stages/questions/QuestionsManager';

import { queryElement } from '$utils/queryElement';

import { attr } from '../constants';

export const prepareWrapper = (): void => {
  const stage = MCTManager.getStage('questions') as HTMLElement;
  const wrapper = queryElement(`[${attr.components}="wrapper"]`, stage) as HTMLElement;
  const scroll = queryElement(`[${attr.components}="scroll"]`, stage) as HTMLElement;
  if (!wrapper || !scroll) return;

  const groups = questionsManager.getGroups();
  if (groups.length === 0) return;

  const firstItem = questionsManager.getFirstQuestion()?.el;
  const lastItem = questionsManager.getLastQuestion()?.el;
  if (!firstItem || !lastItem) return;

  const topPad = scroll.offsetHeight / 2 - firstItem.offsetHeight / 2;
  const bottomPad = scroll.offsetHeight / 2 - lastItem.offsetHeight / 2;

  wrapper.style.paddingTop = `${topPad}px`;
  wrapper.style.paddingBottom = `${bottomPad}px`;
};
