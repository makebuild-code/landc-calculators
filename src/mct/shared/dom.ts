import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import type { Stage } from '../stages/questions/types';
import { globalAttr } from './constants';

let component: HTMLElement | null = null;
const stages: Record<string, HTMLElement> = {};

export const initDOMRefs = () => {
  component = queryElement(`[${globalAttr.component}="component"]`) as HTMLElement;
  if (!component) throw new Error('MCT component wrapper not found');

  const stageElements = queryElements(`[${globalAttr.stage}]`, component);
  stageElements.forEach((stage) => {
    const name = stage.getAttribute(globalAttr.stage);
    if (name) stages[name] = stage as HTMLElement;
  });
};

export const getComponent = (): HTMLElement => {
  if (!component) throw new Error('Component element not initialised');
  return component;
};

export const getStage = (name: Stage): HTMLElement => {
  const stage = stages[name];
  if (!stage) throw new Error(`Stage '${name}' not found`);
  return stage;
};
