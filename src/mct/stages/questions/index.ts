/**
 * entry point for the stage
 */

import { MainQuestionsManager } from 'src/mct/stages/questions/QuestionsManager';
import type { Options } from './types';

export const initQuestions = (component: HTMLElement, options: Options) => {
  const manager = options.mode === 'main' ? new MainQuestionsManager(component) : null;
  if (!manager) return;

  manager.init();
};
