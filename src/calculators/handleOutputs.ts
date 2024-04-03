import Chart from 'chart.js/auto';

import { isStaging } from '$utils/isStaging';
import { numberToCurrency } from '$utils/numberToCurrency';
import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import type { CalculatorOutputs } from './calculatorConfig';
import type { BasicObject, HandleCalculator, Result } from './handleCalculator';

type Output = HTMLDivElement | HTMLSpanElement;

const attr = 'data-calc';

/**
 * @docs data-calc-output-mod - number to multiply the output by (update to data-calc-output-multiplier)
 */

export class HandleOutputs {
  private config: CalculatorOutputs;
  private all: Output[];
  private repeatTemplates: HTMLDivElement[];
  private repeatOutputs: Output[];
  private outputs: Output[];
  private repeatClones: { [key: string]: HTMLElement[] };
  private chart: HTMLCanvasElement | undefined;
  private chartJS?: Chart;
  private results: HTMLDivElement;
  private result?: Result;

  constructor(calculator: HandleCalculator) {
    this.config = calculator.config.outputs;
    this.all = queryElements(`[${attr}-output]`, calculator.component);
    this.repeatTemplates = queryElements(`[${attr}-output-repeat]`, calculator.component);
    this.repeatOutputs = queryElements(
      `[${attr}-output-repeat] [${attr}-output]`,
      calculator.component
    );
    this.outputs = this.all.filter((output) => !this.repeatOutputs.includes(output));
    this.repeatClones = {};
    this.chart = queryElement(`[${attr}-el="chart"]`, calculator.component);
    this.results = queryElement(`[${attr}-el="results"]`, calculator.component) as HTMLDivElement;
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

    this.results.style.display = 'block';
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
        this.populateOutput(output, value);
      }
    });
  }

  private populateChart(): void {
    if (!this.result || !this.chart) return;

    const chartLabels = this.result.ChartLabels as string;
    const labels = chartLabels.split(',');

    const chartData = this.result.ChartData as string;
    const data = chartData.split(',').map(Number);

    if (this.chartJS) {
      this.chartJS.data.labels = labels;
      this.chartJS.data.datasets[0].data = data;
      this.chartJS.update();
    } else {
      this.chartJS = new Chart(this.chart, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: this.chart.dataset.calcChartTitle,
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
