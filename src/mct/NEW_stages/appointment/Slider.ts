import Splide, { type SlideComponent } from '@splidejs/splide';
import { ConfigManager } from './Config';

type SliderOptions = {
  wrapper: HTMLElement;
  onThresholdReached: () => void;
};

export class Slider {
  private component: HTMLElement;
  private isInitialised: boolean = false;
  private wrapper: HTMLElement;
  private onThresholdReached: () => void;
  private configManager: ConfigManager;

  public splide!: Splide;

  constructor(component: HTMLElement, options: SliderOptions) {
    this.component = component;
    console.log('component', component);
    this.wrapper = options.wrapper;
    this.onThresholdReached = options.onThresholdReached;
    this.configManager = ConfigManager.getInstance();

    this.init();
  }

  public init(): void {
    if (this.isInitialised) return;
    this.isInitialised = true;

    this.splide = this.initSlider();
    this.bindEvents();
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => {
      this.configManager.updateBreakpoint();
      this.updateSliderOptions();
    });

    // Add event listener for slider movement
    this.splide.on('moved', (newIndex: number, prevIndex: number) => {
      console.log('Slider moved from index', prevIndex, 'to', newIndex);

      // Check if we're moving towards the end and need to load more days
      const totalSlides = this.splide.length;
      const slidesPerView = this.configManager.getDaysPerView();
      const threshold = totalSlides - slidesPerView * 2; // Load more when we're within one view of the end

      if (newIndex + 1 >= threshold) {
        console.log('Approaching end of slider, loading more days...');
        this.onThresholdReached();
      }
    });
  }

  private calculateWidth(): number | string {
    if (!this.wrapper) return '100%';
    const style = window.getComputedStyle(this.wrapper);
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    const width = this.wrapper.clientWidth - paddingLeft - paddingRight;
    return width;
  }

  private initSlider(): Splide {
    const slider = new Splide(this.component, {
      type: 'slide',
      start: 1,
      perPage: this.configManager.getDaysPerView('desktop'),
      perMove: this.configManager.getDaysPerMove('desktop'),
      gap: 'calc(1.25rem - 8px)',
      pagination: false,
      width: this.calculateWidth(),
      breakpoints: {
        991: {
          perPage: this.configManager.getDaysPerView('tablet'),
          perMove: this.configManager.getDaysPerMove('tablet'),
        },
        767: {
          perPage: this.configManager.getDaysPerView('landscape'),
          perMove: this.configManager.getDaysPerMove('landscape'),
        },
        478: {
          perPage: this.configManager.getDaysPerView('portrait'),
          perMove: this.configManager.getDaysPerMove('portrait'),
        },
      },
    });

    slider.mount();
    return slider;
  }

  private updateSliderOptions(): void {
    this.splide.options.perPage = this.configManager.getDaysPerView();
    this.splide.options.perMove = this.configManager.getDaysPerMove();
    this.splide.options.width = this.calculateWidth();
    this.splide.refresh();
  }

  public addSlides(slides: HTMLElement[]): void {
    slides.forEach((slide) => {
      this.splide.add(slide);
    });
  }

  public getLastSlide(): SlideComponent | null {
    if (this.splide.length === 0) return null;

    const slides = this.splide.Components.Slides.get();
    return slides[slides.length - 1];
  }
}
