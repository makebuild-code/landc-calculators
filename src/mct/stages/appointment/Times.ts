import { StatefulInputGroup, type StatefulInputGroupOptions, type StatefulInputGroupState } from '$mct/components';
import type { AppointmentSlot, Input } from '$mct/types';
import { queryElement } from '$utils/dom';
import { DOM_CONFIG } from '$mct/config';

const mctAttr = DOM_CONFIG.attributes.component;
const attr = DOM_CONFIG.attributes.appointment;

interface TimesOptions extends StatefulInputGroupOptions<TimesState> {}

interface TimesState extends StatefulInputGroupState {}

export class TimesComponent extends StatefulInputGroup<TimesState> {
  private list: HTMLElement;
  private template: HTMLElement;

  constructor(options: TimesOptions) {
    super(options);

    this.setStateValue('type', 'radio');

    this.list = this.queryElement(`[${attr.components}="times-list"]`) as HTMLElement;
    const slot = this.queryElement(`[${mctAttr}="pill"]`) as HTMLElement;
    this.template = slot.cloneNode(true) as HTMLElement;
    this.template.remove();
  }

  protected init(): void {}

  private generateTimeSlot(timeSlot: AppointmentSlot): HTMLElement {
    const element = this.template.cloneNode(true) as HTMLElement;
    const input = this.queryElement('input', element) as Input;
    const name = input.name;
    input.id = `${name}-${timeSlot.startTime}-${timeSlot.endTime}`;
    input.value = `${timeSlot.startTime}-${timeSlot.endTime}`;
    input.disabled = !timeSlot.enabled;

    const label = this.queryElement('label', element) as HTMLLabelElement;
    label.setAttribute('for', input.id);
    label.textContent = `${timeSlot.startTime} - ${timeSlot.endTime}`;

    this.inputs.push(input);
    this.bindInputEvents(input);

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
    this.element.style.removeProperty('display');
    this.onChange();
  }
}
