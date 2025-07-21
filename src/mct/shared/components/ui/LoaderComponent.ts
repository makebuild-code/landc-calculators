import { InteractiveComponent, type InteractiveComponentOptions } from '../base/InteractiveComponent';
import { APIEventNames, type APIEvents } from '$mct/types';

export interface LoaderState {
  isLoading: boolean;
  loadingType?: 'products' | 'lenders' | 'booking' | 'generic';
  message?: string;
  progress?: number; // 0-100 for progress bars
}

export interface LoaderComponentOptions extends InteractiveComponentOptions {
  loaderSelector?: string;
  messageSelector?: string;
  progressSelector?: string;
  autoHide?: boolean;
  hideDelay?: number; // ms
  initialState?: Partial<LoaderState>;
}

/**
 * LoaderComponent manages loading states across the MCT application.
 * It can show/hide loading indicators, update messages, and handle progress.
 * 
 * Usage:
 * ```typescript
 * const loader = new LoaderComponent({
 *   element: document.querySelector('[data-mct-loader]'),
 *   loaderSelector: '.loader',
 *   messageSelector: '.loader-message',
 *   autoHide: true
 * });
 * ```
 */
export class LoaderComponent extends InteractiveComponent {
  private loaderElement: HTMLElement | null = null;
  private messageElement: HTMLElement | null = null;
  private progressElement: HTMLElement | null = null;
  private state: LoaderState;
  private hideTimer: number | null = null;
  
  private loaderSelector: string;
  private messageSelector: string;
  private progressSelector: string;
  private autoHide: boolean;
  private hideDelay: number;

  constructor(options: LoaderComponentOptions) {
    super(options);
    
    this.loaderSelector = options.loaderSelector || '.loader';
    this.messageSelector = options.messageSelector || '.loader-message';
    this.progressSelector = options.progressSelector || '.loader-progress';
    this.autoHide = options.autoHide ?? true;
    this.hideDelay = options.hideDelay || 500;
    
    // Initialize state
    this.state = {
      isLoading: false,
      loadingType: 'generic',
      message: '',
      progress: 0,
      ...options.initialState,
    };
  }

  protected onInit(): void {
    this.findLoaderElements();
    this.updateLoaderDisplay();
    this.subscribeToEvents();
  }

  protected bindEvents(): void {
    // No user interaction events needed for loader
  }

  private findLoaderElements(): void {
    this.loaderElement = this.queryElement(this.loaderSelector);
    this.messageElement = this.queryElement(this.messageSelector);
    this.progressElement = this.queryElement(this.progressSelector);

    if (!this.loaderElement) {
      this.log(`Warning: Loader element not found with selector: ${this.loaderSelector}`);
    }
  }

  private subscribeToEvents(): void {
    // Products API events
    this.on(APIEventNames.PRODUCTS_LOADING, () => {
      this.showLoader({
        loadingType: 'products',
        message: 'Searching for products...',
      });
    });

    this.on(APIEventNames.PRODUCTS_SUCCESS, () => {
      this.hide();
    });

    this.on(APIEventNames.PRODUCTS_ERROR, () => {
      this.hide();
    });

    // Lenders API events
    this.on(APIEventNames.LENDERS_LOADING, () => {
      this.showLoader({
        loadingType: 'lenders',
        message: 'Loading lenders...',
      });
    });

    this.on(APIEventNames.LENDERS_SUCCESS, () => {
      this.hide();
    });

    this.on(APIEventNames.LENDERS_ERROR, () => {
      this.hide();
    });

    // Generic API events
    this.on(APIEventNames.REQUEST_START, (payload: APIEvents[APIEventNames.REQUEST_START]) => {
      this.showLoader({
        loadingType: 'generic',
        message: this.getMessageForEndpoint(payload.endpoint),
      });
    });

    this.on(APIEventNames.REQUEST_SUCCESS, () => {
      if (this.autoHide) {
        this.hide();
      }
    });

    this.on(APIEventNames.REQUEST_ERROR, () => {
      this.hide();
    });
  }

  private getMessageForEndpoint(endpoint: string): string {
    if (endpoint.includes('products')) return 'Loading products...';
    if (endpoint.includes('lenders')) return 'Loading lenders...';
    if (endpoint.includes('booking')) return 'Creating booking...';
    if (endpoint.includes('appointment')) return 'Loading appointments...';
    return 'Loading...';
  }

  private updateState(partialState: Partial<LoaderState>): void {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...partialState };
    
    this.updateLoaderDisplay();
    this.onStateChange(previousState, this.state);
  }

  private updateLoaderDisplay(): void {
    if (!this.loaderElement) return;

    // Clear any existing hide timer
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    // Show/hide loader
    this.toggleClass(this.loaderElement, 'is-loading', this.state.isLoading);
    this.toggleClass(this.loaderElement, 'is-hidden', !this.state.isLoading);
    
    // Update loading type class
    if (this.state.loadingType) {
      this.setAttribute(this.loaderElement, 'data-loading-type', this.state.loadingType);
    }

    // Update message
    if (this.messageElement && this.state.message) {
      this.messageElement.textContent = this.state.message;
    }

    // Update progress
    if (this.progressElement && typeof this.state.progress === 'number') {
      if (this.progressElement instanceof HTMLProgressElement) {
        this.progressElement.value = this.state.progress;
      } else {
        this.setAttribute(this.progressElement, 'data-progress', String(this.state.progress));
        if (this.progressElement instanceof HTMLElement) {
          this.progressElement.style.setProperty('width', `${this.state.progress}%`);
        }
      }
    }
  }

  protected onStateChange(previousState: LoaderState, currentState: LoaderState): void {
    this.log('Loader state changed:', {
      previous: previousState,
      current: currentState,
    });

    // Emit accessibility updates
    if (this.loaderElement) {
      this.setAttribute(this.loaderElement, 'aria-busy', String(currentState.isLoading));
      
      if (currentState.isLoading && currentState.message) {
        this.setAttribute(this.loaderElement, 'aria-label', currentState.message);
      }
    }
  }

  // Public API
  public showLoader(options: Partial<Pick<LoaderState, 'loadingType' | 'message' | 'progress'>> = {}): void {
    this.updateState({
      isLoading: true,
      ...options,
    });
  }

  public hide(): void {
    if (this.autoHide && this.hideDelay > 0) {
      this.hideTimer = window.setTimeout(() => {
        this.updateState({ isLoading: false });
      }, this.hideDelay);
    } else {
      this.updateState({ isLoading: false });
    }
  }

  public updateMessage(message: string): void {
    this.updateState({ message });
  }

  public updateProgress(progress: number): void {
    this.updateState({ progress: Math.max(0, Math.min(100, progress)) });
  }

  public getState(): LoaderState {
    return { ...this.state };
  }

  protected onDestroy(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    
    this.loaderElement = null;
    this.messageElement = null;
    this.progressElement = null;
  }
}