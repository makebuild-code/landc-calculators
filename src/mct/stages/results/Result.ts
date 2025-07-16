import { queryElement } from '$utils/dom/queryElement';
import { queryElements } from '$utils/dom/queryelements';
import { formatNumber } from '$utils/formatting/formatNumber';

import { DOM_CONFIG } from '$mct/config';
import type { Product } from '$mct/types';
import { OutputTypeENUM, SapValueENUM } from '$mct/types';
import { dialogs } from 'src/components/dialogs';

const attr = DOM_CONFIG.attributes.results;

interface Options {
  template: HTMLElement;
  product: Product;
  onClick: (product: Product) => void;
  buttonText: string;
}

export class Result {
  private wrapper: HTMLElement;
  private template: HTMLElement;
  private product: Product;
  private onClick: (product: Product) => void;
  private buttonText: string;

  private outputs: HTMLElement[] = [];
  private button: HTMLButtonElement;

  constructor(wrapper: HTMLElement, options: Options) {
    this.wrapper = wrapper;
    this.template = options.template.cloneNode(true) as HTMLElement;
    this.template.removeAttribute(DOM_CONFIG.attributes.initial);
    this.product = options.product;
    this.onClick = options.onClick;
    this.buttonText = options.buttonText;

    this.outputs = queryElements(`[${attr.output}]`, this.template) as HTMLElement[];
    this.button = queryElement(`[${attr.element}="template-cta"]`, this.template) as HTMLButtonElement;

    this.init();
  }

  private init(): void {
    this.populate();
    this.bindEvents();
  }

  private populate(): void {
    this.outputs.forEach((output) => {
      const outputName = output.getAttribute(attr.output) as keyof Product;
      const outputType = output.getAttribute(attr.type);
      let outputValue = this.product[outputName] ?? 0;

      switch (outputType) {
        case OutputTypeENUM.Currency:
          outputValue = formatNumber(outputValue as number, { type: 'currency' });
          break;
        case OutputTypeENUM.Number:
          const decimals = output.dataset.decimals;
          outputValue = formatNumber(outputValue as number, {
            type: 'number',
            decimals: decimals ? Number(decimals) : undefined,
          });
          break;
        case 'boolean':
          outputValue = outputValue ? true : false;
          break;
        default:
          outputValue = outputValue.toString();
      }

      if (outputName === 'SAP') {
        outputValue = Number(outputValue) >= SapValueENUM.Yes ? true : false;
      } else if (outputName === 'NewBuild') {
        outputValue = !!outputValue;
      }

      if (output instanceof HTMLImageElement) {
        output.src = outputValue.toString();
      } else if (outputType === 'boolean') {
        output.style.display = outputValue ? 'block' : 'none';
      } else {
        output.textContent = outputValue.toString();
      }
    });

    this.button.textContent = this.buttonText;
  }

  private initDialogs(): void {
    dialogs(this.template);
  }

  private bindEvents(): void {
    this.button?.addEventListener('click', () => {
      this.onClick(this.product);
    });
  }

  public render(): void {
    this.initDialogs();
    this.wrapper.appendChild(this.template);
  }

  public remove(): void {
    this.template.remove();
  }
}
