import Chart from 'chart.js/auto';
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
  private chart: HTMLCanvasElement | undefined;
  private chartJS?: Chart;
  private result?: APIResponse;

  constructor(component: HTMLDivElement) {
    this.component = component;
    this.outputs = queryElements(`[${attr}-output]`, component) as Output[];
    this.chart = queryElement(`[${attr}-el="chart"]`, component) as HTMLCanvasElement;
  }

  displayResults(result: APIResponse): void {
    this.result = result;
    console.log("Results to process are: ", this.result);
    this.populateOutputs();
    this.populateChart();

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

    const chartLabels = this.result.result.ChartLabels as string;
    const labels = chartLabels.split(',');

    const chartData1 = this.result.result.ChartData as string;
    const data1 = chartData1.split(',').map(Number);

    let data2 = null;
    if (this.result.result.ChartData2) {
      const chartData2 = this.result.result.ChartData2 as string;
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
