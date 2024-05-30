import { CostOfDoingNothingCalculator } from './handleCostOfDoingNothing';

export const costOfDoingNothing = () => {
  console.log('Cost of Doing Nothing');
  console.log('DOM Loaded');
  const component = document.querySelector('[data-calc="costofdoingnothing"]') as HTMLDivElement;
  if (component) {
    new CostOfDoingNothingCalculator(component);
  };
 };

