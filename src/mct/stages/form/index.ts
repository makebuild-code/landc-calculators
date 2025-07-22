import type { FormOptions } from '$mct/types';
import { MainFormManager } from './Manager_Main';

export const initForm = (component: HTMLElement, options: FormOptions): MainFormManager | null => {
  const manager = options.mode === 'main' ? new MainFormManager(component) : null;
  if (!manager) return null;
  return manager;
};
