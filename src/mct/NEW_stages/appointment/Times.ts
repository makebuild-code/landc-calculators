import { InputGroupBase } from '$mct/components';
import type { AppointmentSlot, Input, InputGroupOptions } from '$mct/types';
import { queryElement } from '$utils/dom';
import { DOM_CONFIG } from '$mct/config';

const mctAttr = DOM_CONFIG.attributes.component;
const attr = DOM_CONFIG.attributes.appointment;

type TimeOptions = {
  onEnter: () => void;
} & InputGroupOptions;

export class Times extends InputGroupBase {
  private list: HTMLElement;
  private template: HTMLElement;
  private onEnter: () => void;

  constructor(el: HTMLElement, options: TimeOptions) {
    super(el, options);
    this.onEnter = options.onEnter;

    this.list = queryElement(`[${attr.components}="times-list"]`, this.el) as HTMLElement;
    const slot = queryElement(`[${mctAttr}="pill"]`, this.list) as HTMLElement;
    this.template = slot.cloneNode(true) as HTMLElement;
    this.template.remove();
  }

  protected init(): void {
    // Any additional initialization if needed
  }

  private generateTimeSlot(timeSlot: AppointmentSlot): HTMLElement {
    const element = this.template.cloneNode(true) as HTMLElement;
    const input = queryElement('input', element) as Input;
    const name = input.name;
    input.id = `${name}-${timeSlot.startTime}-${timeSlot.endTime}`;
    input.value = `${timeSlot.startTime}-${timeSlot.endTime}`;
    input.disabled = !timeSlot.enabled;

    const label = queryElement('label', element) as HTMLLabelElement;
    label.setAttribute('for', input.id);
    label.textContent = `${timeSlot.startTime} - ${timeSlot.endTime}`;

    this.inputs.push(input);
    input.addEventListener('change', () => this.onChange());

    // Add keyboard event listener for Enter key
    input.addEventListener('keydown', (event: Event) => {
      const ke = event as KeyboardEvent;
      if (ke.key !== 'Enter') return;

      this.onEnter();
    });

    return element;
  }

  public renderTimeSlots(timeSlots: AppointmentSlot[]): void {
    this.list.innerHTML = '';
    this.inputs = [];

    const fragment = document.createDocumentFragment();

    timeSlots.forEach((timeSlot) => {
      const element = this.generateTimeSlot(timeSlot);
      fragment.appendChild(element);
    });

    this.list.appendChild(fragment);
    this.el.style.removeProperty('display');
    this.onChange();
  }
}
