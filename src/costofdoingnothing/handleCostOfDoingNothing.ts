import type { CostOfDoingNothingRequest } from 'src/calculators/calculators';
import { API_ENDPOINTS } from 'src/constants';
import type { APIResponse, Input } from 'src/types';
import { checkInputValidity } from 'src/utils/checkInputValidity';
import { formatInput } from 'src/utils/formatInput';
import { getInputValue } from 'src/utils/getInputValue';
import { queryElement } from 'src/utils/queryElement';
import { queryElements } from 'src/utils/queryelements';
import { setError } from 'src/utils/setError';

import type {
  Inputs as BestBuyInputs,
  Outputs as BestBuyOutputs,
  PropertyType,
  SortColumn,
} from '../bestbuys/types';
import { HandleCODNOutputs } from './handleCODNOutputs';

export class CostOfDoingNothingCalculator {
  private component: HTMLDivElement;
  private inputs: Input[];
  private buttons: HTMLButtonElement[];
  private buttonsText: HTMLDivElement;
  private buttonsLoader: HTMLDivElement;
  private currentLenderDropdown: HTMLSelectElement;
  private mortgageTypeDropdown: HTMLSelectElement;
  private followOnField: HTMLInputElement;
  private isLoading: boolean;
  private formattedValues: BestBuyInputs;
  private formattedCostOfDoingNothingValues: CostOfDoingNothingRequest;
  private outputHandler: HandleCODNOutputs;

  constructor(component: HTMLDivElement) {
    this.component = component;
    this.inputs = queryElements(`[data-input], input, select`, component);
    this.buttons = queryElements(`[data-calc-el="button"]`, component);
    this.buttonsText = queryElement(`[data-calc-el="button-text"]`, component) as HTMLDivElement;
    this.buttonsLoader = queryElement(
      `[data-calc-el="button-loader"]`,
      component
    ) as HTMLDivElement;
    this.currentLenderDropdown = queryElement(`#CurrentLender`, component) as HTMLSelectElement;
    this.mortgageTypeDropdown = queryElement(`#MortgageType`, component) as HTMLSelectElement;
    this.followOnField = queryElement(`#FollowOn`, component) as HTMLInputElement;
    this.isLoading = false;
    this.outputHandler = new HandleCODNOutputs(component);

    this.bindEvents();
    this.init();
  }

  private bindEvents(): void {
    this.inputs.forEach((input) => {
      input.addEventListener('change', () => {
        formatInput(input);
        this.validateInput(input);
      });
    });

    this.buttons.forEach((button) => {
      button.addEventListener('click', async () => {
        const valid = this.validateInputs();
        if (!valid) return;
        this.toggleLoading();
        try {
          const bestBuyResult = await this.handleBestBuyRequest();
          if (bestBuyResult) {
            await this.handleCalculationRequest(bestBuyResult);
            this.toggleLoading(true);
          }
        } catch (error) {
          console.error('Error during calculation:', error);
          this.toggleLoading(false); // Ensure loading is toggled off in case of an error
        }
      });
    });

    // Add event listeners for the MortgageType and CurrentLender dropdowns
    this.mortgageTypeDropdown.addEventListener('change', () => {
      this.updateFollowOnField();
    });

    this.currentLenderDropdown.addEventListener('change', () => {
      this.updateFollowOnField();
    });
  }

  private validateInput(input: Input): boolean {
    const validity = checkInputValidity(input);

    if (!validity.error) {
      setError(input);
    } else {
      setError(input, validity.error);
    }

    return validity.isValid;
  }

  private validateInputs(): boolean {
    return this.inputs.every((input) => {
      return this.validateInput(input);
    });
  }

  private toggleLoading(success?: boolean): void {
    this.isLoading = !this.isLoading;
    if (this.isLoading) {
      this.buttonsText.style.opacity = '0';
      this.buttonsLoader.style.opacity = '1';
    } else if (success) {
      this.buttonsText.textContent = 'Recalculate';
      this.buttonsText.style.opacity = '1';
      this.buttonsLoader.style.opacity = '0';
    } else {
      this.buttonsText.textContent = 'Try again...';
      this.buttonsText.style.opacity = '1';
      this.buttonsLoader.style.opacity = '0';
    }
  }

  private getValues() {
    const values: { [key: string]: any } = {};
    this.inputs.forEach((input) => {
      const key = input.dataset.input;
      const value = getInputValue(input);
      if (key) {
        values[key] = value;
      }
    });
    return values;
  }

  //TODO: Make sure all defaults are correct here
  private getBestBuyInput(): BestBuyInputs {
    const propertyValueInput = queryElement(
      `[data-input="PropertyValue"]`,
      this.component
    ) as HTMLInputElement;
    const loanAmountInput = queryElement(
      `[data-input="LoanAmount"]`,
      this.component
    ) as HTMLInputElement;
    const typeInput = queryElement(`[data-input="Type"]`, this.component) as HTMLSelectElement;
    const termYearsInput = queryElement(`[data-input="Term"]`, this.component) as HTMLInputElement;

    const propertyValue = propertyValueInput ? propertyValueInput.value : '0';
    const loanAmount = loanAmountInput ? loanAmountInput.value : '0';
    const type = typeInput ? typeInput.value : '';
    const termYears = termYearsInput ? termYearsInput.value : '0';
    const mortgageType = this.mortgageTypeDropdown.value === 'Residential' ? '1' : '2';

    const formattedValues: BestBuyInputs = {
      PropertyValue: propertyValue,
      RepaymentValue: type === 'R' ? loanAmount : '0',
      InterestOnlyValue: type === 'I' ? loanAmount : '0',
      PropertyType: '1' as PropertyType,
      MortgageType: mortgageType,
      TermYears: termYears,
      SchemePurpose: '2',
      SchemePeriods: ['1'],
      SchemeTypes: ['1'],
      NumberOfResults: '1',
      Features: {
        Erc: true,
        Offset: false,
        NewBuild: false,
      },
      SortColumn: '1' as SortColumn,
      UseStaticApr: false,
    };

    this.formattedValues = formattedValues;

    return formattedValues;
  }

  private async getCostOfDoingNothingInput(
    bestBuyResult: BestBuyOutputs
  ): Promise<CostOfDoingNothingRequest> {
    const propertyValueInput = queryElement(
      `[data-input="PropertyValue"]`,
      this.component
    ) as HTMLInputElement;
    const loanAmountInput = queryElement(
      `[data-input="LoanAmount"]`,
      this.component
    ) as HTMLInputElement;
    const typeInput = queryElement(`[data-input="Type"]`, this.component) as HTMLSelectElement;
    const termYearsInput = queryElement(`[data-input="Term"]`, this.component) as HTMLInputElement;
    const followOnInput = queryElement(
      `[data-input="FollowOn"]`,
      this.component
    ) as HTMLInputElement;

    const propertyValue = propertyValueInput ? parseInt(propertyValueInput.value) : 0;
    const loanAmount = loanAmountInput ? parseInt(loanAmountInput.value) : 0;
    const type = typeInput ? typeInput.value : 'R';
    const termYears = termYearsInput ? parseInt(termYearsInput.value) : 0;
    const followOnRate = followOnInput ? parseFloat(followOnInput.value) : 0;

    const formattedCostOfDoingNothingValues: CostOfDoingNothingRequest = {
      calculator: 'comparerates',
      input: {
        PropertyValue: propertyValue, // min: 1, max: 10000000, step: 500, value: 250000
        LoanAmount: loanAmount, // min: 5000, max: 10000000, step: 1000, value: 125000
        Term: termYears, // min: 1, max: 40, step: 1, value: 25
        Type: type,
        ComparisonRates: [
          {
            Rate: followOnRate, // min: 0.1, max: 15, step: 0.05, value: null | 4.99
            Fees: 0, // min: -10000000, max: 10000000, step: 100, value: null | 850
            Type: 'V',
            SchemeLength: 24, // min: 1, max: 480 | 300, step: 12, value: null | 36
            ERCAmount: 0, // min: 0, max: 100000, step: 100, value: null
            ERCTerm: 0, // min: 0, max: 300, step: 1, value: 0
            ERCAdd: true,
            FollowOn: followOnRate, // min: 0.1, max: 15, step: 0.05, value: 5.6 | 7
          },
          {
            Rate: bestBuyResult.Rate, // min: 0.1, max: 15, step: 0.05, value: null | 4.99
            Fees: bestBuyResult.TotalFees, // min: -10000000, max: 10000000, step: 100, value: null | 850
            Type: 'F',
            SchemeLength: 24, // min: 1, max: 480 | 300, step: 12, value: null | 36
            ERCAmount: 0, // min: 0, max: 100000, step: 100, value: null
            ERCTerm: 0, // min: 0, max: 300, step: 1, value: 0
            ERCAdd: true,
            FollowOn: bestBuyResult.FollowOnRateValue, // min: 0.1, max: 15, step: 0.05, value: 5.6 | 7
          },
        ],
        ComparisonTerm: 12, // min: 2, max: 60, step: 12, value: 24
        InterestRateEnvironment: 1,
      },
    };

    this.formattedCostOfDoingNothingValues = formattedCostOfDoingNothingValues;

    return formattedCostOfDoingNothingValues;
  }

  private async handleCalculationRequest(bestBuyResult: BestBuyOutputs): Promise<void> {
    const values = await this.getCostOfDoingNothingInput(bestBuyResult);
    const body = JSON.stringify(values);

    try {
      const response = await fetch(API_ENDPOINTS.costOfDoingNothing, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const result = await response.json();
      this.outputHandler.displayResults(result);
    } catch (error) {
      console.error('Error retrieving calculation', error);
    }
  }

  private async handleSVRRequest(): Promise<void> {
    const body = JSON.stringify({});

    try {
      const response = await fetch(API_ENDPOINTS.svrForLenders, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const result = await response.json();
      console.log(result.result.data);
      this.populateCurrentLenderDropdown(result.result.data);
      this.updateFollowOnField(); // Update FollowOn field after dropdown is populated
    } catch (error) {
      console.error('Error retrieving SVR data', error);
    }
  }

  private async handleBestBuyRequest(): Promise<BestBuyOutputs> {
    const body = JSON.stringify({ input: this.getBestBuyInput() });

    try {
      const response = await fetch(API_ENDPOINTS.productsTrigger, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const result = await response.json();
      return result.result.data[0] as BestBuyOutputs;
    } catch (error) {
      console.error('Error retrieving Best Buy data', error);
      throw error;
    }
  }

  private populateCurrentLenderDropdown(lenders: any[]): void {
    this.currentLenderDropdown.innerHTML = ''; // Clear existing options

    lenders.forEach((lender) => {
      const option = document.createElement('option');
      option.value = lender.MasterLenderId; // Assuming 'MasterLenderId' is the identifier for the lender
      option.text = lender.Lender; // Assuming 'Lender' is the name of the lender

      // Add additional data attributes
      option.dataset.buyToLetRate = lender.BuyToLetRate; // Assuming 'BuyToLetRate' is the attribute name
      option.dataset.residentialRate = lender.ResidentialRate; // Assuming 'ResidentialRate' is the attribute name

      this.currentLenderDropdown.add(option);
    });
  }

  private updateFollowOnField(): void {
    const selectedLenderOption = this.currentLenderDropdown.selectedOptions[0];
    if (!selectedLenderOption) return;

    const mortgageType = this.mortgageTypeDropdown.value;
    let followOnRate = '';

    if (mortgageType === 'Residential') {
      followOnRate = selectedLenderOption.dataset.residentialRate || '';
    } else if (mortgageType === 'BuyToLet') {
      followOnRate = selectedLenderOption.dataset.buyToLetRate || '';
    }

    this.followOnField.value = followOnRate;
  }

  private handleResponse(response: APIResponse): void {
    const costOfRate1 = response.data.CostOfRate1;
    const costOfRate2 = response.data.CostOfRate2;

    const costOfRate1Element = queryElement(`[data-calc-output="CostOfRate1"]`, this.component);
    const costOfRate2Element = queryElement(`[data-calc-output="CostOfRate2"]`, this.component);

    if (costOfRate1Element) costOfRate1Element.textContent = `£${costOfRate1}`;
    if (costOfRate2Element) costOfRate2Element.textContent = `£${costOfRate2}`;

    // Additional handling for chart or other response data can be added here
  }

  private async init(): Promise<void> {
    await this.handleSVRRequest(); // Fetch and populate lender data on initialization
    this.updateFollowOnField(); // Populate FollowOn field on page load
  }
}
