import { queryElements } from '$utils/queryelements';

import { Calculator } from './calculatorClass';

export const calculators = () => {
  console.log('calculators');

  const attr = 'data-calc';
  const components = queryElements<HTMLDivElement>(`[${attr}]`);

  components.forEach((component) => {
    const { calc } = component.dataset;
    if (!calc) return;

    const calculator = new Calculator(calc);
    calculator.init();
  });
};
