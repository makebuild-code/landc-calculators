import { testFetchProducts } from './shared/api/tests/testFetchProducts';
import { MCTManager } from './shared/MCTManager';

export const mct = () => {
  MCTManager.initDOM();
  MCTManager.preInit();
  MCTManager.route();

  testFetchProducts();
};
