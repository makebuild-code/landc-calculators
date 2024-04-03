import { queryElements } from '$utils/queryelements';

import { HandleTable } from './handleTable';

export const bestbuys = () => {
  const attr = 'data-bb';
  const components = queryElements<HTMLDivElement>(`[${attr}]`);

  components.forEach((component) => {
    const { bb } = component.dataset;
    if (!bb) return;

    const bestbuy = new HandleTable(component);
    bestbuy.init();
  });
};
