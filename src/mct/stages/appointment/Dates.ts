import { StatefulInputGroup, type StatefulInputGroupConfig, type StatefulInputGroupState } from '$mct/components';
import type { AppointmentDay, Input } from '$mct/types';
import { queryElement } from '$utils/dom';
import { DOM_CONFIG } from '$mct/config';
import { getOrginalDate } from '$utils/formatting';
import { Slider } from './Slider';

const attr = DOM_CONFIG.attributes.appointment;

interface DatesConfig extends StatefulInputGroupConfig {
  wrapper: HTMLElement;
  onLoadMore: () => void;
}

interface DatesState extends StatefulInputGroupState {
  appointmentDays: AppointmentDay[];
  selectedDate: AppointmentDay | null;
}

export class DatesComponent extends StatefulInputGroup<DatesState> {
  private wrapper: HTMLElement;
  private onLoadMore: () => void;
  private slider!: Slider;
  private slideTemplate!: HTMLElement;

  constructor(config: DatesConfig) {
    // Define the custom state extensions for DatesComponent
    const customState: Partial<DatesState> = {
      appointmentDays: [],
      selectedDate: null,
    };

    super(config, customState);

    this.wrapper = config.wrapper;
    this.onLoadMore = config.onLoadMore;

    // Set the type after construction since it's part of base state
    this.setStateValue('type', 'radio');
  }

  protected onInit(): void {
    const slider = this.queryElement(`[${attr.slider}="component"]`, this.wrapper) as HTMLElement;
    this.slider = new Slider(slider, {
      wrapper: this.wrapper,
      onThresholdReached: () => this.onThresholdReached(),
    });

    this.slideTemplate = this.createSlideTemplate();
  }

  public addDays(days: AppointmentDay[]): void {
    const currentDays = this.getStateValue('appointmentDays');
    const newDays = [...currentDays, ...days];
    this.setStateValue('appointmentDays', newDays);

    const slides = days.map((day, index) => this.createDateSlide(day, index));
    this.slider.addSlides(slides);
  }

  public getSelectedDate(): AppointmentDay | null {
    return this.getStateValue('selectedDate');
  }

  public getLastDate(): Date | null {
    const appointmentDays = this.getStateValue('appointmentDays');
    if (appointmentDays.length === 0) return null;
    const lastDay = appointmentDays[appointmentDays.length - 1];
    return new Date(lastDay.date);
  }

  private createSlideTemplate(): HTMLElement {
    const slide = queryElement(`[${attr.slider}="slide-template"]`, this.element) as HTMLElement;
    if (!slide) throw new Error(`Slide template element with attribute [${attr.slider}="slide-template"] not found`);

    const template = slide.cloneNode(true) as HTMLElement;
    const slideParent = slide.parentElement;
    if (slideParent) [...slideParent.children].forEach((child) => child.remove());

    return template;
  }

  private createDateSlide(day: AppointmentDay, index: number): HTMLElement {
    const slide = this.slideTemplate.cloneNode(true) as HTMLElement;
    slide.setAttribute(attr.date, day.date);

    const monthLabel = queryElement(`[${attr.inputLabel}="month"]`, slide) as HTMLSpanElement;
    const dayLabel = queryElement(`[${attr.inputLabel}="day"]`, slide) as HTMLSpanElement;

    const date = new Date(day.date);
    const month = date.toLocaleDateString('en-GB', { month: 'short' });
    const ordinalDate = getOrginalDate(date);

    monthLabel.textContent = month;
    dayLabel.textContent = ordinalDate;

    const enabled = day.slots.some((slot) => slot.enabled);
    const input = queryElement('input', slide) as Input;

    input.id = `preferred-date-${day.date}`;
    input.disabled = !enabled;
    input.value = day.date;

    const label = queryElement('label', slide) as HTMLLabelElement;
    label.setAttribute('for', input.id);
    label.textContent = `${month}, ${ordinalDate}`;

    input.addEventListener('change', () => this.setStateValue('selectedDate', day));

    this.inputs.push(input);
    this.bindInputEvents(input);

    return slide;
  }

  private onThresholdReached(): void {
    this.onLoadMore();
  }

  public selectFirstActiveDay(date: string): void {
    this.setValue(date);

    const appointmentDays = this.getStateValue('appointmentDays');
    const selectedDate = appointmentDays.find((day) => day.date === date)!;
    this.setStateValue('selectedDate', selectedDate);

    this.onChange();
  }
}
