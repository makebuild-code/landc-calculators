import { initDOMRefs } from './shared/dom';
import { initQuestionsStage } from './stages/questions';

export const mct = () => {
  initDOMRefs();
  initQuestionsStage();
};
