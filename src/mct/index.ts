import { initDOMRefs } from './shared/dom';
import { route } from './shared/route';

export const mct = () => {
  initDOMRefs();
  route();
};
