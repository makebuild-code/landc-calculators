import { queryElements } from '$utils/queryelements';

export const output = (config: any, result: any) => {
  // eslint-disable-next-line no-console
  console.log('output');

  const calcOutputs = queryElements('[data-calc-output]', config.calculator);

  calcOutputs.forEach((calcOutput) => {
    const name = calcOutput.dataset.calcOutput;
    calcOutput.textContent = result.result[name];
  });

  config.buttonText.textContent = 'Recalculate';
  config.button.style.removeProperty('color');
  config.loader.style.opacity = '0';
};
