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

  const tabTriggers = document.querySelectorAll('[tabs-click-id]');

  tabTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      
      const tabId = trigger.getAttribute('tabs-click-id');
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
        //initRangeSlider();
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

export const initRangeSlider = (): void => {
  alert('me');
  setTimeout(() => {
    window.Webflow = window.Webflow || [];

    window.Webflow.push(() => {
      // Find all sliders on the page
      const sliders = document.querySelectorAll('[fs-rangeslider-element="wrapper"]');

      sliders.forEach(sliderElement => {
        // Find the input element inside each slider
        const inputElement = sliderElement.querySelector('input');

        if (inputElement) {
          const currentValue = inputElement.value; // Save the current value of the input
          console.log('Current Slider Value:', currentValue);

          const sliderAttr = window.fsAttributes?.['rangeslider'];

          if (sliderAttr && typeof sliderAttr.init === 'function') {
            // Initialize the slider
            console.log(sliderAttr.attributes)
            sliderAttr.init();

            // Restore the value after initialization
            inputElement.value = currentValue;
            inputElement.setAttribute('aria-valuenow', currentValue); // Update accessibility attribute
            
            // Update related elements (slider handle and display value)
            const handleElement = sliderElement.querySelector('[fs-rangeslider-element="handle"]');
            const displayValueElement = sliderElement.querySelector('[fs-rangeslider-element="display-value"]');

            if (handleElement && displayValueElement) {
              displayValueElement.textContent = currentValue; // Update the displayed value
              handleElement.style.left = `${(currentValue / inputElement.max) * 100}%`; // Adjust the handle position based on the value
            }

            console.log('Slider value restored:', currentValue);
          } else {
            console.error('RangeSlider initialization failed: Attributes or init function missing');
          }
        }
      });
    });
  }, 1000); // Delay to ensure Webflow scripts are loaded
}

