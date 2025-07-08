import { StageIDENUM } from '$mct/types';
import type { FormOptions } from '../../shared/types/common';
import { MainFormManager } from './Manager';
import { BaseFormManager, type BaseFormManagerOptions } from './Base';

// export const initForm = (options: QuestionsManagerOptions): NewFormManager => {
//   return new NewFormManager({
//     element: options.element,
//     id: options.id,
//     prefillFrom: options.prefillFrom,
//   });
// };

export const initForm = (component: HTMLElement, options: FormOptions): MainFormManager | null => {
  const manager = options.mode === 'main' ? new MainFormManager(component) : null;
  if (!manager) return null;

  const newManager = new BaseFormManager({
    element: component,
    id: StageIDENUM.Questions,
    prefillFrom: 'none',
  });

  newManager.initialise();

  return manager;
};
