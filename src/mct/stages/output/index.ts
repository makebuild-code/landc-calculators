import { outputStageManager } from './OutputStageManager';
import type { OutputStageConfig } from './types';

export const initializeOutputStage = (config: OutputStageConfig): void => {
  outputStageManager.initialize(config);
};
