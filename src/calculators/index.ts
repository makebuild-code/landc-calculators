import { queryElements } from '$utils/queryelements';

import { HandleCalculator } from './handleCalculator';

export const calculators = () => {
  const attr = 'data-calc';
  const components = queryElements<HTMLDivElement>(`[${attr}]`);

  components.forEach((component) => {
    const calculator = new HandleCalculator(component);
    calculator.init();
  });
};
