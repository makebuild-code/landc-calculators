import { CostOfDoingNothingCalculator } from './handleCostOfDoingNothing';

export const costOfDoingNothing = () => {

  const component = document.querySelector('[data-calc="costofdoingnothing"]') as HTMLDivElement;
  if (component) {
    new CostOfDoingNothingCalculator(component);
  };
 };

