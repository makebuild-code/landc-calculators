import Chart from 'chart.js/auto';
import type { BasicObject, Result } from 'src/types';

import { handleConditionalVisibility } from '$utils/handleConditionalVisibility';
import { isStaging } from '$utils/isStaging';
import { numberToCurrency } from '$utils/numberToCurrency';
import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import type { CalculatorOutputs } from './calculatorConfig';
import type { HandleCalculator } from './handleCalculator';

type Output = HTMLDivElement | HTMLSpanElement;

const attr = 'data-calc';

/**
 * @docs data-calc-output-mod - number to multiply the output by (update to data-calc-output-multiplier)
 */

export class HandleOutputs {
  private calculator: HandleCalculator;
  private config: CalculatorOutputs;
  private all: Output[];
  private repeatTemplates: HTMLDivElement[];
  private repeatOutputs: Output[];
  private outputs: Output[];
  private repeatClones: { [key: string]: HTMLElement[] };
  private conditionals: HTMLDivElement[];
  private chart: HTMLCanvasElement | undefined;
  private chartJS?: Chart;
  private results: HTMLDivElement;
  private result?: Result;
  private calcElement: HTMLElement | null;
  private resultsId: string | null;

  constructor(calculator: HandleCalculator) {
    this.calculator = calculator;
    this.resultsId = calculator.component.getAttribute("data-results");
    this.config = calculator.config.outputs;
    
    this.all = this.resultsId
      ? queryElements(`#${this.resultsId} [${attr}-output]`, document)
      : queryElements(`[${attr}-output]`, calculator.component);

    this.repeatTemplates = queryElements(`[${attr}-output-repeat]`, calculator.component);
    this.repeatOutputs = queryElements(
      `[${attr}-output-repeat] [${attr}-output]`,
      calculator.component
    );
    this.outputs = this.all.filter((output) => !this.repeatOutputs.includes(output));
    this.repeatClones = {};
   
    this.chart = queryElement(`[${attr}-el="chart"]`, calculator.component);
    
    // Find the matching results container or fall back to default
    this.results = this.resultsId
      ? queryElement(`#${this.resultsId}`, document) as HTMLDivElement
      : queryElement(`[${attr}-el="results"]`, calculator.component) as HTMLDivElement;

    this.conditionals = this.resultsId
      ? queryElements(`#${this.resultsId}`, document)
      : queryElements('.calculator_results-wrapper [data-condition]', calculator.component);
  }
  

  check(): boolean {
    const tableData: { output: string; present: boolean }[] = [];
    let allPresent = true;

    // check which outputs are/aren't present
    this.config.names.forEach((name) => {
      const output = this.outputs.find((output) => output.dataset.calcOutput === name);
      tableData.push({
        output: name,
        present: !!output,
      });

      if (!output) allPresent = false;
    });

    if (isStaging) {
      console.groupCollapsed(`${allPresent ? 'all outputs present' : 'outputs missing'}`);
      console.table(tableData);
      console.groupEnd();
    }

    return allPresent;
  }

  handleConditionals(): void {
    this.conditionals.forEach((item) => {
      handleConditionalVisibility(item, this.calculator.inputs.inputs);
    });
  }

  displayResults(result: Result): void {
    this.result = result;

    if (this.repeatTemplates.length > 0) {
      this.repeatTemplates.forEach((template) => {
        template.style.display = 'none';
        const fragment = document.createDocumentFragment();
        this.handleTemplateRepeats(template, fragment);
        if (template.parentElement) template.parentElement.appendChild(fragment);
      });
    }

    this.populateOutputs();
    this.populateChart();
    this.handleConditionals();

    if(!this.resultsId){
      this.results.style.display = 'block';
    }

   
  }

  private handleTemplateRepeats(template: HTMLDivElement, fragment: DocumentFragment): void {
    const repeatName = template.dataset.calcOutputRepeat;
    if (!repeatName || !this.result || !this.result[repeatName]) return;

    // find and delete any old clones
    const clonesToDelete = this.repeatClones[repeatName];
    if (clonesToDelete) {
      clonesToDelete.forEach((cloneToDelete) => {
        cloneToDelete.remove();
      });
    }

    const dataItems = this.result[repeatName];
    if (!Array.isArray(dataItems)) return;

    const clones: HTMLElement[] = [];
    dataItems.forEach((dataItem) => {
      const clone = this.prepareClone(template, dataItem);
      if (clone) {
        fragment.appendChild(clone);
        clones.push(clone);
      }
    });

    this.repeatClones[repeatName] = clones;
  }

  private prepareClone(template: HTMLDivElement, dataItem: BasicObject): HTMLDivElement | null {
    const clone = template.cloneNode(true) as HTMLDivElement;
    clone.style.removeProperty('display');

    const outputs = queryElements(`[${attr}-output]`, clone) as HTMLDivElement[];
    this.populateOutputs(outputs, dataItem);

    return clone;
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

  private populateOutputs(outputs?: HTMLElement[], data?: BasicObject): void {
    if (!outputs || !data) {
      outputs = this.outputs;
      data = this.result;
    }

    

    outputs.forEach((output) => {
      const key = output.dataset.calcOutput;
      if (!key) return;
      const value = data[key];
      if (value === 0 || data[key]) {
        if (output instanceof HTMLInputElement) {
          output.value = String(value); // Update the input value
          output.placeholder = String(value); // Update the placeholder
        } else {
          this.populateOutput(output, value);
        }
      }
    });
  }

  private populateChart(): void {
    if (!this.result || !this.chart) return;

    const chartLabels = this.result.ChartLabels as string;
    const labels = chartLabels.split(',');

    const chartData1 = this.result.ChartData as string;
    const data1 = chartData1.split(',').map(Number);

    let data2 = null;
    if (this.result.ChartData2) {
      const chartData2 = this.result.ChartData2 as string;
      data2 = chartData2.split(',').map(Number);
    }

    const datasets = [
      {
        data: data1,
        borderColor: '#fff',
        backgroundColor: '#fff',
        borderWidth: 1,
      },
    ];

    if (data2) {
      datasets.push({
        data: data2,
        borderColor: '#d70206',
        backgroundColor: '#d70206',
        borderWidth: 1,
      });
    }

    if (this.chartJS) {
      this.chartJS.data.labels = labels;
      this.chartJS.data.datasets[0].data = data1;
      if (data2) this.chartJS.data.datasets[1].data = data2;
      this.chartJS.update();
    } else {
      this.chartJS = new Chart(this.chart, {
        type: this.chart.dataset.calcChartType,
        data: {
          labels,
          datasets,
        },
        options: {
          responsive: true,
          plugins: {
            // legend: { labels: { font: { family: 'Gotham, sans-serif;' } } },
            legend: {
              labels: {
                filter: (item, chart) => false,
              },
              title: {
                display: true,
                text: this.chart.dataset.calcChartTitle,
                font: { family: 'Gotham, sans-serif;' },
                padding: 10,
              },
            },
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
