import type { APIResponse } from 'src/types';
import { numberToCurrency } from 'src/utils/numberToCurrency';
import { queryElement } from 'src/utils/queryElement';
import { queryElements } from 'src/utils/queryelements';

type Output = HTMLDivElement | HTMLSpanElement;
type BasicObject = { [key: string]: any };

const attr = 'data-calc';

export class HandleCODNOutputs {
  private component: HTMLDivElement;
  private outputs: Output[];
  private result?: APIResponse;

  constructor(component: HTMLDivElement) {
    this.component = component;
    this.outputs = queryElements(`[${attr}-output]`, component) as Output[];
  }

  displayResults(result: APIResponse): void {
    this.result = result;
    console.log('Results to process are: ', this.result);
    this.populateOutputs();

    const resultsElement = queryElement(`[${attr}-el="results"]`, this.component) as HTMLDivElement;
    resultsElement.style.display = 'block';
  }

  private populateOutput(output: HTMLElement, value: string | number) {
    if (typeof value === 'number') {
      const { calcOutputMod } = output.dataset;
      if (calcOutputMod) value = Number(calcOutputMod) * value;
      output.textContent = numberToCurrency(value);
    } else {
      output.textContent = value;
    }
  }

  private populateOutputs(outputs?: Output[], data?: BasicObject): void {
    if (!outputs || !data) {
      outputs = this.outputs;
      data = this.result?.result;
    }

    const savingElement = queryElement(
      `[${attr}-output="SavingBlock"]`,
      this.component
    ) as HTMLDivElement;
    const noSavingElement = queryElement(
      `[${attr}-output="NoSavingBlock"]`,
      this.component
    ) as HTMLDivElement;

    // Check if the current rate is less than the new rate and show text if so
    if (data['CostOfRate1'] < data['CostOfRate2']) {
      savingElement.style.display = 'none';
      noSavingElement.style.display = 'block';
    }

    // Check if the current rate is more than the new rate and show new rate breakdown
    if (data['CostOfRate1'] >= data['CostOfRate2']) {
      noSavingElement.style.display = 'none';
      savingElement.style.display = 'block';
      console.log('Outputs array is: ', outputs);
      //Add values to the data object
      data['AnnualCost'] = (data['CostOfRate1'] - data['CostOfRate2']) / 2;
      data['MonthlyCost'] = (data['CostOfRate1'] - data['CostOfRate2']) / 12;
      data['FollowOnPayments'] = data['CostOfRate1'] / 12;
      data['PaymentsAfterSwitch'] = data['CostOfRate2'] / 12;
      outputs.forEach((output) => {
        const key = output.dataset.calcOutput;
        if (!key) return;

        const value = data[key];
        if (value === 0 || data[key]) {
          this.populateOutput(output, value);
        }
      });
    }
  }
}
