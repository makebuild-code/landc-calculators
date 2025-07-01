import { ResultsManager } from './Manager';
import type { ResultsOptions } from './types';

export const initResults = (component: HTMLElement): ResultsManager | null => {
  const manager = new ResultsManager(component);
  if (!manager) return null;
  return manager;
};
