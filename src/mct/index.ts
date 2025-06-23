import { MCTManager } from './shared/MCTManager';

export const mct = () => {
  MCTManager.start();
  MCTManager.route();
};
