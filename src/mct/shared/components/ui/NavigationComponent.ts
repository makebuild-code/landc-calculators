import { InteractiveComponent, type InteractiveComponentOptions } from '../base/InteractiveComponent';
import { FormEventNames, type FormEvents } from '$mct/types';

export interface NavigationState {
  nextEnabled: boolean;
  prevEnabled: boolean;
  currentGroup?: string;
  totalGroups?: number;
  currentStage?: string;
}

export interface NavigationComponentOptions extends InteractiveComponentOptions {
  nextSelector?: string;
  prevSelector?: string;
  initialState?: Partial<NavigationState>;
}

/**
 * NavigationComponent handles the state and interactions of navigation elements (prev/next buttons)
 * throughout the MCT application. It listens to form events and updates button states accordingly.
 * 
 * Usage:
 * ```typescript
 * const navigation = new NavigationComponent({
 *   element: document.querySelector('[data-mct-navigation]'),
 *   nextSelector: '[data-nav="next"]',
 *   prevSelector: '[data-nav="prev"]'
 * });
 * ```
 */
export class NavigationComponent extends InteractiveComponent {
  private nextButton: HTMLButtonElement | null = null;
  private prevButton: HTMLButtonElement | null = null;
  private state: NavigationState;
  
  private nextSelector: string;
  private prevSelector: string;

  constructor(options: NavigationComponentOptions) {
    super(options);
    
    this.nextSelector = options.nextSelector || '[data-nav="next"]';
    this.prevSelector = options.prevSelector || '[data-nav="prev"]';
    
    // Initialize state
    this.state = {
      nextEnabled: false,
      prevEnabled: false,
      ...options.initialState,
    };
  }

  protected onInit(): void {
    this.findNavigationElements();
    this.updateButtonStates();
    this.subscribeToEvents();
  }

  protected bindEvents(): void {
    // Handle next button clicks
    if (this.nextButton) {
      this.addEventListener({
        element: this.nextButton,
        event: 'click',
        handler: (event: Event) => {
          this.preventDefaultAndStop(event);
          this.handleNextClick();
        },
      });
    }

    // Handle prev button clicks
    if (this.prevButton) {
      this.addEventListener({
        element: this.prevButton,
        event: 'click',
        handler: (event: Event) => {
          this.preventDefaultAndStop(event);
          this.handlePrevClick();
        },
      });
    }
  }

  private findNavigationElements(): void {
    this.nextButton = this.queryElement(this.nextSelector) as HTMLButtonElement;
    this.prevButton = this.queryElement(this.prevSelector) as HTMLButtonElement;

    if (!this.nextButton) {
      this.log(`Warning: Next button not found with selector: ${this.nextSelector}`);
    }
    if (!this.prevButton) {
      this.log(`Warning: Prev button not found with selector: ${this.prevSelector}`);
    }
  }

  private subscribeToEvents(): void {
    // Listen for navigation updates from forms
    this.on(FormEventNames.NAVIGATION_UPDATE, (payload: FormEvents[FormEventNames.NAVIGATION_UPDATE]) => {
      this.updateState({
        nextEnabled: payload.nextEnabled ?? this.state.nextEnabled,
        prevEnabled: payload.prevEnabled ?? this.state.prevEnabled,
      });
    });

    // Listen for group changes to track progress
    this.on(FormEventNames.GROUP_CHANGED, (payload: FormEvents[FormEventNames.GROUP_CHANGED]) => {
      this.updateState({
        currentGroup: payload.groupId,
        totalGroups: payload.totalQuestions, // Assuming this maps correctly
      });
    });
  }

  private updateState(partialState: Partial<NavigationState>): void {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...partialState };
    
    this.updateButtonStates();
    this.onStateChange(previousState, this.state);
  }

  private updateButtonStates(): void {
    if (this.nextButton) {
      this.nextButton.disabled = !this.state.nextEnabled;
      this.toggleClass(this.nextButton, 'disabled', !this.state.nextEnabled);
      this.setAttribute(this.nextButton, 'aria-disabled', String(!this.state.nextEnabled));
    }

    if (this.prevButton) {
      this.prevButton.disabled = !this.state.prevEnabled;
      this.toggleClass(this.prevButton, 'disabled', !this.state.prevEnabled);
      this.setAttribute(this.prevButton, 'aria-disabled', String(!this.state.prevEnabled));
    }
  }

  private handleNextClick(): void {
    if (!this.state.nextEnabled) return;

    this.log('Next button clicked');
    
    // Emit navigation event
    this.emit(FormEventNames.NAVIGATION_NEXT, {
      fromGroup: this.state.currentGroup || 'unknown',
    });
  }

  private handlePrevClick(): void {
    if (!this.state.prevEnabled) return;

    this.log('Previous button clicked');
    
    // Emit navigation event
    this.emit(FormEventNames.NAVIGATION_PREV, {
      fromGroup: this.state.currentGroup || 'unknown',
    });
  }

  protected onStateChange(previousState: NavigationState, currentState: NavigationState): void {
    // Override in subclasses if needed
    this.log('Navigation state changed:', {
      previous: previousState,
      current: currentState,
    });
  }

  // Public API
  public enableNext(): void {
    this.updateState({ nextEnabled: true });
  }

  public disableNext(): void {
    this.updateState({ nextEnabled: false });
  }

  public enablePrev(): void {
    this.updateState({ prevEnabled: true });
  }

  public disablePrev(): void {
    this.updateState({ prevEnabled: false });
  }

  public getState(): NavigationState {
    return { ...this.state };
  }

  public setCurrentGroup(groupId: string): void {
    this.updateState({ currentGroup: groupId });
  }

  protected onDestroy(): void {
    this.nextButton = null;
    this.prevButton = null;
  }
}