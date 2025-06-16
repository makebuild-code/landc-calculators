/**
 * helper functions
 */

import { getStage } from 'src/mct/shared/dom';
import { manager } from 'src/mct/shared/manager';

import { queryElement } from '$utils/queryElement';

import { attr } from '../constants';

export const prepareWrapper = (): void => {
  const stage = getStage('questions');
  const wrapper = queryElement(`[${attr.components}="wrapper"]`, stage) as HTMLElement;
  const scroll = queryElement(`[${attr.components}="scroll"]`, stage) as HTMLElement;
  if (!wrapper || !scroll) return;

  const groups = manager.getGroups();
  if (groups.length === 0) return;

  const firstItem = manager.getFirstQuestion()?.el;
  const lastItem = manager.getLastQuestion()?.el;
  if (!firstItem || !lastItem) return;

  const topPad = scroll.offsetHeight / 2 - firstItem.offsetHeight / 2;
  const bottomPad = scroll.offsetHeight / 2 - lastItem.offsetHeight / 2;

  wrapper.style.paddingTop = `${topPad}px`;
  wrapper.style.paddingBottom = `${bottomPad}px`;
};
