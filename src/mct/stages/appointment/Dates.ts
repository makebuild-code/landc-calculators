import { InputGroupBase } from '$mct/components';
import type { AppointmentDay, Input, InputGroupOptions } from '$mct/types';
import { queryElement } from '$utils/dom';
import { DOM_CONFIG } from '$mct/config';
import { getOrginalDate } from '$utils/formatting';
import { Slider } from './Slider';

const attr = DOM_CONFIG.attributes.appointment;

type DateOptions = {
  wrapper: HTMLElement;
  onChange: () => void;
  onLoadMore: () => void;
  onEnter: () => void;
} & InputGroupOptions;

export class Dates extends InputGroupBase {
  private wrapper: HTMLElement;
  private onLoadMore: () => void;
  private onEnter: () => void;
  private slider: Slider;
  private slideTemplate: HTMLElement;
  private appointmentDays: AppointmentDay[] = [];
  private selectedDate: AppointmentDay | null = null;

  constructor(el: HTMLElement, options: DateOptions) {
    super(el, options);
    this.wrapper = options.wrapper;
    this.onLoadMore = options.onLoadMore;
    this.onEnter = options.onEnter;

    const slider = queryElement(`[${attr.slider}="component"]`, this.wrapper) as HTMLElement;
    this.slider = new Slider(slider, {
      wrapper: options.wrapper,
      onThresholdReached: () => this.onThresholdReached(),
    });

    this.slideTemplate = this.createSlideTemplate();
  }

  protected init(): void {
    // Any additional initialization if needed
  }

  public addDays(days: AppointmentDay[]): void {
    this.appointmentDays = [...this.appointmentDays, ...days];

    const slides = days.map((day, index) => this.createDateSlide(day, index));
    this.slider.addSlides(slides);
  }

  public getSelectedDate(): AppointmentDay | null {
    return this.selectedDate;
  }

  public getLastDate(): Date | null {
    if (this.appointmentDays.length === 0) return null;
    const lastDay = this.appointmentDays[this.appointmentDays.length - 1];
    return new Date(lastDay.date);
  }

  private createSlideTemplate(): HTMLElement {
    const slide = queryElement(`[${attr.slider}="slide-template"]`, this.el) as HTMLElement;
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

    this.inputs.push(input);

    // Add change listener for date selection
    input.addEventListener('change', () => {
      if (input instanceof HTMLInputElement && input.checked) {
        this.selectedDate = day;
        this.onChange();
      }
    });

    // Add keyboard event listener for Enter key
    input.addEventListener('keydown', (event: Event) => {
      const ke = event as KeyboardEvent;
      if (ke.key !== 'Enter') return;

      this.onEnter();
    });

    return slide;
  }

  private onThresholdReached(): void {
    // console.log('Threshold reached, requesting more dates...');
    this.onLoadMore();
  }

  public selectFirstActiveDay(date: string): void {
    this.setValue(date);
    this.selectedDate = this.appointmentDays.find((day) => day.date === date)!;
    this.onChange();
  }
}
