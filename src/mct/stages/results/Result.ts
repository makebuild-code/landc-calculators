import { queryElement } from '$utils/dom/queryElement';
import { queryElements } from '$utils/dom/queryelements';
import { formatNumber } from '$utils/formatting/formatNumber';

import { attr } from './constants';
import type { Product } from '$mct/types';
import { OutputTypeENUM } from '$mct/types';

interface Options {
  template: HTMLElement;
  product: Product;
  onClick: (product: Product) => void;
}

export class Result {
  private wrapper: HTMLElement;
  private template: HTMLElement;
  private product: Product;
  private onClick: (product: Product) => void;

  private outputs: HTMLElement[] = [];
  private button: HTMLButtonElement | null = null;
  private dialogs: HTMLDialogElement[] = [];

  constructor(wrapper: HTMLElement, options: Options) {
    this.wrapper = wrapper;
    this.template = options.template.cloneNode(true) as HTMLElement;
    this.product = options.product;
    this.onClick = options.onClick;

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
        case 'boolean':
          outputValue = outputValue ? true : false;
          break;
        default:
          outputValue = outputValue.toString();
      }

      if (output instanceof HTMLImageElement) {
        output.src = outputValue.toString();
      } else if (outputType === 'boolean') {
        output.style.display = outputValue ? 'block' : 'none';
      } else {
        output.textContent = outputValue.toString();
      }
    });
  }

  private bindEvents(): void {
    this.button?.addEventListener('click', () => {
      this.onClick(this.product);
    });
  }

  public render(): void {
    this.wrapper.appendChild(this.template);
  }

  public remove(): void {
    this.template.remove();
  }
}
