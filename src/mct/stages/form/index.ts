/**
 * entry point for the stage
 */

import { MainFormManager } from 'src/mct/stages/form/Manager';
import type { Options } from './types';

export const initForm = (component: HTMLElement, options: Options) => {
  const manager = options.mode === 'main' ? new MainFormManager(component) : null;
  if (!manager) return;

  manager.init();
};
