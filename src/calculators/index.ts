/* eslint-disable no-console */
import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import { output } from './output';
import { request } from './request';

export const calculators = () => {
  console.log('calculators');

  const attr = 'data-calc';
  const components = queryElements<HTMLDivElement>(`[${attr}]`);

  console.log(components);

  components.forEach((component) => {
    const button = queryElement<HTMLButtonElement>(`[${attr}="button"]`, component);
    if (!button) return;

    button.addEventListener('click', async () => {
      const buttonText = queryElement<HTMLDivElement>(`[${attr}="button-text"]`, button);
      const loader = queryElement<HTMLDivElement>(`[${attr}="button-loader"]`);
      if (loader) loader.style.opacity = '1';
      button.style.color = 'transparent';

      const calcInputs = queryElements(`[${attr}-input]`, component);

      const input = {};
      calcInputs.forEach((calcInput) => {
        const key = calcInput.dataset.calcInput;
        input[key] = calcInput.value;
      });

      try {
        console.time('API Request');
        const result = await request(component.dataset.calc.toString(), input);
        console.timeEnd('API Request');

        output({ component, buttonText, button, loader }, result);
      } catch (error) {
        console.error('Error retrieving calculation', error);
        if (buttonText) {
          buttonText.textContent = 'Try again';
          button.style.removeProperty('color');
          if (loader) loader.style.opacity = '0';
        }
      }
    });
  });
};
