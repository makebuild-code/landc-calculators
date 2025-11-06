import { MainFormManager } from './Manager_Main';

export { QuestionComponent } from './Questions';
export { QuestionRegistry } from './QuestionRegistry';
export { QuestionFactory } from './QuestionFactory';
export type { QuestionFactoryOptions } from './QuestionFactory';

export const initForm = (component: HTMLElement): MainFormManager => {
  return new MainFormManager(component);
};
