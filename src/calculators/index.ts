import { queryElements } from '$utils/queryelements';

import { HandleCalculator } from './handleCalculator';

export const calculators = () => {
  // Forces Outputs to Sliders - Mortgage Calc page New
  const repaymentValueSlider = document.getElementById('RepaymentValue') as HTMLInputElement | null;
  const depositAmountSlider = document.getElementById('DepositAmountSlider') as HTMLInputElement | null;
  
  if (repaymentValueSlider) {
    repaymentValueSlider.setAttribute('data-calc-output', 'BorrowingAmountHigher');
  }

  if (depositAmountSlider) {
    depositAmountSlider.setAttribute('data-calc-output', 'DepositAmount');
  }

  const attr = 'data-calc';

  const components = queryElements<HTMLDivElement>(`[${attr}]`);

  components.forEach((component) => {
    const calculator = new HandleCalculator(component);
    calculator.init();
  });
};
