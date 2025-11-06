import { ResultsManager } from './Manager';

export const initResults = (component: HTMLElement): ResultsManager => {
  return new ResultsManager(component);
};
