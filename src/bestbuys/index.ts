import { queryElements } from '$utils/dom/queryelements';

import { HandleMini } from './handleMini';
import { HandleTable } from './handleTable';

export const bestbuys = () => {
  const attr = 'data-bb';
  const components = queryElements<HTMLDivElement>(`[${attr}]`);

  components.forEach((component) => {
    const { bb } = component.dataset;
    if (!bb) return;

    const bestbuy = bb === 'table' ? new HandleTable(component) : bb === 'mini' ? new HandleMini(component) : null;

    if (bestbuy === null) return;
    bestbuy.init();
  });
};
