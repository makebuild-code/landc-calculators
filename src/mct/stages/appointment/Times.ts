import { StatefulInputGroup, type StatefulInputGroupOptions, type StatefulInputGroupState } from '$mct/components';
import type { AppointmentSlot, Input } from '$mct/types';
import { DOM_CONFIG } from '$mct/config';
import { formatToHHMM } from '$utils/formatting/formatToHHMM';

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

  protected onInit(): void {}

  private generateTimeSlot(timeSlot: AppointmentSlot): HTMLElement {
    const startTime = formatToHHMM(timeSlot.startTime);
    const endTime = formatToHHMM(timeSlot.endTime);

    const element = this.template.cloneNode(true) as HTMLElement;
    const input = this.queryElement('input', element) as Input;
    const name = input.name;
    input.id = `${name}-${startTime}-${endTime}`;
    input.value = `${startTime} - ${endTime}`;
    input.disabled = !timeSlot.enabled;

    const label = this.queryElement('label', element) as HTMLLabelElement;
    label.setAttribute('for', input.id);
    label.textContent = `${startTime} - ${endTime}`;

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
