import { queryElements } from '$utils/queryelements';

export const output = (calculator: string, result: any) => {
  // eslint-disable-next-line no-console
  console.log('output');

  const calcOutputs = queryElements('[data-calc-output]', calculator);

  calcOutputs.forEach((calcOutput) => {
    const name = calcOutput.dataset.calcOutput;
    calcOutput.textContent = result.result[name];
  });
};
