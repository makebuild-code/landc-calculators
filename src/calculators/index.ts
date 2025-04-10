import { queryElements } from '$utils/queryelements';

import { HandleCalculator } from './handleCalculator';

export const calculators = () => {


  // Forces Outputs to Sliders - Mortgage Calc page New
  const repaymentValueSlider = document.getElementById('RepaymentValue') as HTMLInputElement | null;
  const depositAmountSlider = document.getElementById('DepositAmountSlider') as HTMLInputElement | null;
  const rateSlider = document.querySelector('[data-input="Rate"]') as HTMLInputElement | null;
  
  
  if (repaymentValueSlider) {
    repaymentValueSlider.setAttribute('data-calc-output', 'BorrowingAmountHigher');
  }

  if (depositAmountSlider) {
    depositAmountSlider.setAttribute('data-calc-output', 'DepositAmount');
  }

  if (rateSlider) {
    rateSlider.setAttribute('data-calc-output', 'InitialRate');
  }
  // ----- End

  const tabTriggers = document.querySelectorAll('[tabs-id]');

  tabTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      
      const tabId = trigger.getAttribute('tabs-id');
      if (!tabId) return;

      // Hide all tab content elements first (optional, if you're switching)
      document.querySelectorAll('.tab-content').forEach(tab => {
        (tab as HTMLElement).style.display = 'none';
        (tab as HTMLElement).classList.remove('current');
      });

      tabTriggers.forEach(tab => {
        (tab as HTMLElement).classList.remove('current');
      });

      // Show the matching tab content
      const targetTab = document.getElementById(tabId);
      if (targetTab) {
        targetTab.style.display = 'block';
        trigger.classList.add('current');
      }
    });
  });

  const attr = 'data-calc';

  const components = queryElements<HTMLDivElement>(`[${attr}]`);

  components.forEach((component) => {
    const calculator = new HandleCalculator(component);
    calculator.init();
  });
};
