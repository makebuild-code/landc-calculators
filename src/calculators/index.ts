import { queryElement } from '$utils/dom/queryElement';
import { queryElements } from '$utils/dom/queryelements';

import { HandleCalculator } from './handleCalculator';

export const calculators = () => {
  const attr = 'data-calc';

  // Forces Outputs to Sliders - Mortgage Calc page New
  const repaymentValueSlider = queryElement<HTMLInputElement>(`[data-input="RepaymentValue"]`);
  const depositAmountSlider = queryElement<HTMLInputElement>(`[data-input="DepositAmountSlider"]`);
  const rateSlider = queryElement<HTMLInputElement>(`[data-input="Rate"]`);

  if (repaymentValueSlider) repaymentValueSlider.setAttribute(`${attr}-output`, 'BorrowingAmountHigher');
  if (depositAmountSlider) depositAmountSlider.setAttribute(`${attr}-output`, 'DepositAmount');
  if (rateSlider) rateSlider.setAttribute(`${attr}-output`, 'InitialRate');
  // ----- End

  const components = queryElements<HTMLDivElement>(`[${attr}]`);

  components.forEach((component) => {
    const calculator = new HandleCalculator(component);
    calculator.init();
  });
};
