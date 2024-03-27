import Chart from 'chart.js/auto';

import { numberToCurrency } from '$utils/numberToCurrency';
import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import { calculatorConfig } from './calculatorConfig';

// type InputValues = Record<string, any>;
type Input = HTMLInputElement | HTMLSelectElement | HTMLDivElement;
type Output = HTMLDivElement | HTMLSpanElement;

type BasicObject = {
  [key: string]: string | number;
};

interface APIResponse {
  body: string;
  endpoint: string;
  result: { [key: string]: string | number | BasicObject[] };
}

const attr = 'data-calc';
const API_ENDPOINT = 'https://landc-website.azurewebsites.net/api/calculatorhttptrigger';
// const API_ENDPOINT = 'http://localhost:7071/api/CalculatorHttpTrigger';

/**
 * @docs data-calc-output-mod - number to multiply the output by
 */

export class Calculator {
  name: string;
  component: HTMLDivElement;
  inputs: Input[];
  outputs: Output[];
  outputRepeatTemplates: HTMLDivElement[];
  outputRepeats: { [key: string]: HTMLElement[] };
  graph: HTMLCanvasElement | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chart?: any;
  results: HTMLDivElement;
  button: HTMLButtonElement;
  buttonText: HTMLDivElement;
  buttonLoader: HTMLDivElement;
  isLoading: boolean;
  result?: { [key: string]: string | number | BasicObject[] };

  constructor(name: string) {
    this.name = name;
    this.component = queryElement(`[${attr}="${this.name}"]`) as HTMLDivElement;
    this.inputs = queryElements(`[${attr}-input]`, this.component);
    this.outputs = queryElements(`[${attr}-output]`, this.component);
    this.outputRepeatTemplates = queryElements(`[${attr}-output-repeat]`, this.component);
    this.outputRepeats = {};
    this.graph = queryElement(`[${attr}-el="graph"]`, this.component);
    this.results = queryElement(`[${attr}-el="results"]`, this.component) as HTMLDivElement;
    this.button = queryElement(`[${attr}-el="button"]`, this.component) as HTMLButtonElement;
    this.buttonText = queryElement(`[${attr}-el="button-text"]`, this.button) as HTMLDivElement;
    this.buttonLoader = queryElement(`[${attr}-el="button-loader"]`, this.button) as HTMLDivElement;
    this.isLoading = false;
  }

  init(): void {
    console.groupCollapsed(this.name);
    console.log(this);
    this.checkInputs(true);
    this.checkOutputs(true);
    console.groupEnd();

    this.bindInputEvents();
  }

  checkInputs(log?: boolean): boolean {
    const config = calculatorConfig[this.name];
    if (!config) {
      console.error(`${this.name}: configuration not found.`);
      return false;
    }

    const tableData: { input: string; present: boolean }[] = [];
    let allPresent = true;

    // check which inputs are/aren't present
    config.inputNames.forEach((inputName) => {
      const input = this.inputs.find((input) => input.dataset.calcInput === inputName);
      tableData.push({
        input: inputName,
        present: !!input,
      });

      if (!input) allPresent = false;
    });

    if (log) {
      console.groupCollapsed(`${allPresent ? 'all inputs present' : 'inputs missing'}`);
      console.table(tableData);
      console.groupEnd();
    }

    return allPresent;
  }

  checkOutputs(log?: boolean): boolean {
    const config = calculatorConfig[this.name];
    if (!config) {
      console.error(`${this.name}: configuration not found.`);
      return false;
    }

    const tableData: { output: string; present: boolean }[] = [];
    let allPresent = true;

    // check which outputs are/aren't present
    config.outputNames.forEach((outputName) => {
      const output = this.outputs.find((output) => output.dataset.calcOutput === outputName);
      tableData.push({
        output: outputName,
        present: !!output,
      });

      if (!output) allPresent = false;
    });

    if (log) {
      console.groupCollapsed(`${allPresent ? 'all outputs present' : 'outputs missing'}`);
      console.table(tableData);
      console.groupEnd();
    }

    return allPresent;
  }

  toggleLoading(success?: boolean): void {
    this.isLoading = !this.isLoading;
    if (this.isLoading) {
      this.buttonText.style.opacity = '0';
      this.buttonLoader.style.opacity = '1';
    } else if (success) {
      this.buttonText.textContent = 'Recalculate';
      this.buttonText.style.opacity = '1';
      this.buttonLoader.style.opacity = '0';
    } else {
      this.buttonText.textContent = 'Try again...';
      this.buttonText.style.opacity = '1';
      this.buttonLoader.style.opacity = '0';
    }
  }

  getInputWrapper(input: Input): HTMLElement | undefined {
    let child: HTMLElement = input,
      inputWrapper: HTMLElement | undefined;

    while (child) {
      if (
        child.parentElement &&
        child.parentElement.classList &&
        child.parentElement.classList.contains('calculator-field_component')
      ) {
        inputWrapper = child.parentElement;
        break;
      } else if (child.parentElement) {
        child = child.parentElement;
      } else {
        break;
      }
    }

    return inputWrapper;
  }

  setInputMessage(input: Input, message?: string): void {
    const inputWrapper = this.getInputWrapper(input);
    if (!inputWrapper) return;

    const inputMessage = queryElement('.calculator-field_message', inputWrapper);
    if (!inputMessage) return;

    const { originalMessage } = inputMessage.dataset;
    if (!originalMessage && inputMessage.textContent) {
      inputMessage.dataset.originalMessage = inputMessage.textContent;
    }

    if (message) {
      inputMessage.textContent = message;
    } else if (inputMessage.dataset.originalMessage) {
      inputMessage.textContent = inputMessage.dataset.originalMessage;
    }
  }

  validateInput(input: Input): boolean {
    let isValid = true,
      error: string | undefined;

    if (input instanceof HTMLInputElement) {
      const { type } = input;
      switch (type) {
        case 'text':
          isValid = input.checkValidity();
          error = input.validationMessage;
        case 'number':
          const { min, max, value } = input;

          let minValid = true;
          if (!!min) minValid = Number(value) >= Number(min);

          let maxValid = true;
          if (!!max) maxValid = Number(value) <= Number(max);

          isValid = minValid && maxValid;
          if (isValid) break;

          if (!minValid) {
            error = `Input needs to be greater than ${min}`;
          } else if (!maxValid) {
            error = `Input needs to be smaller than ${max}`;
          }
      }
    } else if (input instanceof HTMLSelectElement) {
      isValid = input.checkValidity();
      error = input.validationMessage;
    }

    if (!error) {
      this.setInputMessage(input);
    } else {
      this.setInputMessage(input, error);
    }

    return isValid;
  }

  validateInputs(): boolean {
    return this.inputs.every((input) => {
      return this.validateInput(input);
    });
  }

  getInputValue(input: Input): string | boolean | undefined {
    let value;
    if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) {
      value = input.value;
    }

    if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    }

    return value;
  }

  getInputValues(): { [key: string]: string } {
    const inputValues: { [key: string]: string } = {};
    this.inputs.forEach((input: Input) => {
      const { calcInput } = input.dataset;
      const value = this.getInputValue(input);
      if (!calcInput || !value) return;

      inputValues[calcInput] = value;
    });

    return inputValues;
  }

  bindInputEvents(): void {
    // validate inputs on value change
    this.inputs.forEach((input) => {
      input.addEventListener('change', () => {
        this.validateInput(input);
      });
    });

    // run sequence on button click
    this.button.addEventListener('click', () => {
      this.toggleLoading();
      const isValid = this.validateInputs();
      const allPresent = this.checkInputs();

      // cancel if inputs are invalid or not all present
      if (!isValid || !allPresent) {
        console.log('inputs not valid or not all present');
        this.toggleLoading(false);
        return;
      }

      this.handleAzureRequest();
    });
  }

  async handleAzureRequest(): Promise<void> {
    console.groupCollapsed('API Call');
    console.time('API Request');

    try {
      const result = await this.makeAzureRequest();
      this.result = result.result;
      console.log(result);
      this.toggleLoading(true);
      this.displayResults();
    } catch (error) {
      console.error('Error retrieving calculation', error);
      this.toggleLoading(false);
    }

    console.timeEnd('API Request');
    console.groupEnd();
  }

  async makeAzureRequest(): Promise<APIResponse> {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    const body = JSON.stringify({ calculator: this.name, input: this.getInputValues() });

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    return response.json();
  }

  // displayResults(): void {
  //   if (!this.result || this.result === undefined) return;

  //   this.outputRepeatTemplates.forEach((outputRepeatTemplate) => {
  //     // hide the template
  //     outputRepeatTemplate.style.display = 'none';

  //     // get the repeat name
  //     const outputRepeatName = outputRepeatTemplate.dataset.calcOutputRepeat;
  //     if (!outputRepeatName) return;

  //     // find and delete any old clones
  //     const clonesToDelete = this.outputRepeats[outputRepeatName];
  //     if (clonesToDelete) {
  //       clonesToDelete.forEach((cloneToDelete) => {
  //         cloneToDelete.remove();
  //       });
  //     }

  //     // get the data from the result
  //     const outputRepeatData = this.result[outputRepeatName];

  //     // make a list of clones
  //     const clones: HTMLElement[] = [];
  //     const { parentElement } = outputRepeatTemplate;
  //     if (!parentElement) console.error(`No parent element for ${outputRepeatName} elements`);

  //     // for each item in the array of data
  //     outputRepeatData.forEach((item) => {
  //       // clone the template
  //       const clone = outputRepeatTemplate.cloneNode(true) as HTMLElement;

  //       // get the outputs within the template and loop through them
  //       const outputs = queryElements(`[${attr}-output]`, clone);
  //       outputs.forEach((output) => {
  //         // get the output name
  //         const { calcOutput } = output.dataset;
  //         if (!calcOutput) return;

  //         // assign the relevant data as the output text
  //         output.textContent = item[calcOutput];
  //       });

  //       // show the clone and add it to the array of clones
  //       clone.style.removeProperty('display');
  //       parentElement.appendChild(clone);
  //       clones.push(clone);
  //     });

  //     this.outputRepeats[outputRepeatName] = clones;
  //   });

  //   this.outputs.forEach((output) => {
  //     const { calcOutput } = output.dataset;
  //     if (!calcOutput) return;

  //     const resultValue = this.result[calcOutput];
  //     if (resultValue === 0 || !!resultValue) output.textContent = resultValue.toString();
  //   });

  //   this.results.style.display = 'block';
  // }

  displayResults(): void {
    if (this.outputRepeatTemplates.length > 0) {
      this.outputRepeatTemplates.forEach((template) => {
        template.style.display = 'none';
        const fragment = document.createDocumentFragment();
        this.handleTemplateRepeats(template, fragment);
        template.parentElement.appendChild(fragment);
      });
    }

    this.populateOutputs();
    this.populateChart();

    // Append the fragment once after all updates
    this.results.style.display = 'block';
  }

  handleTemplateRepeats(template: HTMLDivElement, fragment: DocumentFragment): void {
    const outputRepeatName = template.dataset.calcOutputRepeat;
    if (!outputRepeatName || !this.result || !this.result[outputRepeatName]) return;

    // find and delete any old clones
    const clonesToDelete = this.outputRepeats[outputRepeatName];
    if (clonesToDelete) {
      clonesToDelete.forEach((cloneToDelete) => {
        cloneToDelete.remove();
      });
    }

    const dataItems = this.result[outputRepeatName];
    if (!Array.isArray(dataItems)) return;

    const clones: HTMLElement[] = [];
    dataItems.forEach((item) => {
      const clone = this.prepareClone(template, item);
      if (clone) {
        fragment.appendChild(clone);
        clones.push(clone);
      }
    });

    this.outputRepeats[outputRepeatName] = clones;
  }

  prepareClone(template: HTMLDivElement, item: BasicObject): HTMLElement | null {
    const clone = template.cloneNode(true) as HTMLElement;
    clone.style.removeProperty('display');

    const outputs = queryElements(`[${attr}-output]`, clone) as HTMLElement[];
    this.populateOutputs(outputs, item);

    return clone;
  }

  populateOutput(output: HTMLElement, value: string | number) {
    if (typeof value === 'number') {
      const { calcOutputMod } = output.dataset;
      if (calcOutputMod) value = Number(calcOutputMod) * value;
      output.textContent = numberToCurrency(value);
    } else {
      output.textContent = value;
    }
  }

  populateOutputs(): void {
    if (!this.result) return;

    this.outputs.forEach((output) => {
      const outputKey = output.dataset.calcOutput;
      if (!outputKey) return;

      const outputValue = this.result[outputKey];
      if (outputValue === 0 || this.result[outputKey]) {
        this.populateOutput(output, outputValue);
      }
    });
  }

  populateChart(): void {
    if (!this.result || !this.graph) return;

    const chartLabels = this.result.ChartLabels as string;
    const labels = chartLabels.split(',');

    const chartData = this.result.ChartData as string;
    const data = chartData.split(',').map(Number);

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = data;
      this.chart.update();
    } else {
      this.chart = new Chart(this.graph, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Your data', // pull from attr
              data,
              borderColor: '#fff',
              backgroundColor: '#fff',
              borderWidth: 1,
            },
          ],
        },
        options: {
          plugins: {
            legend: { labels: { font: { family: 'Gotham, sans-serif;' } } },
          },
          scales: {
            x: { ticks: { color: '#fff' } },
            y: { ticks: { color: '#fff' } },
          },
        },
      });

      Chart.defaults.color = '#fff';
    }
  }
}
