import type { FormOptions } from '$mct/types';
import { MainFormManager } from './Manager_Main';

export { QuestionComponent } from './Questions';
export { QuestionRegistry } from './QuestionRegistry';
export { QuestionFactory } from './QuestionFactory';
export type { QuestionFactoryOptions } from './QuestionFactory';

export const initForm = (component: HTMLElement, options: FormOptions): MainFormManager | null => {
  const manager = options.mode === 'main' ? new MainFormManager(component) : null;
  if (!manager) return null;
  return manager;
};
