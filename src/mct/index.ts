import { queryElement } from '$utils/queryElement';

import { componentAttr } from './constants';
import { handleMCT } from './handleMCT';

export const mct = () => {
  const component = queryElement<HTMLDivElement>(`[${componentAttr}="component"]`);
  if (!component) return;

  new handleMCT(component);
};
