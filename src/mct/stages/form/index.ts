import { MainFormManager } from 'src/mct/stages/form/Manager';
import type { Options } from './types';

export const initForm = (component: HTMLElement, options: Options): MainFormManager | null => {
  const manager = options.mode === 'main' ? new MainFormManager(component) : null;
  if (!manager) return null;
  return manager;
};
