import { MCTManager } from './shared/manager';

export const mct = () => {
  MCTManager.initDOM();
  MCTManager.preInit();
  MCTManager.route();
};
