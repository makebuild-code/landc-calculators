import { StatefulComponent, type StatefulComponentOptions } from '../base/StatefulComponent';
import { APIEventNames, type APIEvents } from '$mct/types';

export interface APIState {
  isLoading: boolean;
  hasError: boolean;
  lastError: Error | null;
  lastResponse: any;
  requestCount: number;
  activeRequests: Set<string>;
  lastRequestTime: number | null;
}

export interface APIStateComponentOptions extends StatefulComponentOptions<APIState> {
  trackAllRequests?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  showErrorMessages?: boolean;
  errorContainerSelector?: string;
}

/**
 * APIStateComponent manages the global API state across the MCT application.
 * It tracks loading states, errors, and provides unified API state management.
 * 
 * Usage:
 * ```typescript
 * const apiState = new APIStateComponent({
 *   element: document.querySelector('[data-mct-api-state]'),
 *   trackAllRequests: true,
 *   maxRetries: 3,
 *   showErrorMessages: true
 * });
 * ```
 */
export class APIStateComponent extends StatefulComponent<APIState> {
  private errorContainer: HTMLElement | null = null;
  private retryTimers: Map<string, number> = new Map();
  
  private trackAllRequests: boolean;
  private maxRetries: number;
  private retryDelay: number;
  private showErrorMessages: boolean;
  private errorContainerSelector: string;

  constructor(options: APIStateComponentOptions) {
    const defaultState: APIState = {
      isLoading: false,
      hasError: false,
      lastError: null,
      lastResponse: null,
      requestCount: 0,
      activeRequests: new Set(),
      lastRequestTime: null,
    };

    super({
      ...options,
      initialState: { ...defaultState, ...options.initialState },
    });
    
    this.trackAllRequests = options.trackAllRequests ?? true;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.showErrorMessages = options.showErrorMessages ?? true;
    this.errorContainerSelector = options.errorContainerSelector || '.api-errors';
  }

  protected onInit(): void {
    this.findAPIElements();
    this.updateAPIDisplay();
    this.subscribeToEvents();
  }

  protected bindEvents(): void {
    // No direct user interaction events needed for API state component
  }

  private findAPIElements(): void {
    if (this.showErrorMessages) {
      this.errorContainer = this.queryElement(this.errorContainerSelector);
      
      if (!this.errorContainer) {
        this.log(`Warning: Error container not found with selector: ${this.errorContainerSelector}`);
      }
    }
  }

  private subscribeToEvents(): void {
    // Generic API events (if tracking all)
    if (this.trackAllRequests) {
      this.on(APIEventNames.REQUEST_START, (payload: APIEvents[APIEventNames.REQUEST_START]) => {
        this.handleRequestStart(payload.endpoint);
      });

      this.on(APIEventNames.REQUEST_SUCCESS, (payload: APIEvents[APIEventNames.REQUEST_SUCCESS]) => {
        this.handleRequestSuccess(payload.endpoint, payload.response);
      });

      this.on(APIEventNames.REQUEST_ERROR, (payload: APIEvents[APIEventNames.REQUEST_ERROR]) => {
        this.handleRequestError(payload.endpoint, payload.error);
      });
    }

    // Specific API events
    this.on(APIEventNames.PRODUCTS_LOADING, () => {
      this.handleRequestStart('products');
    });

    this.on(APIEventNames.PRODUCTS_SUCCESS, (payload: APIEvents[APIEventNames.PRODUCTS_SUCCESS]) => {
      this.handleRequestSuccess('products', payload.products);
    });

    this.on(APIEventNames.PRODUCTS_ERROR, (payload: APIEvents[APIEventNames.PRODUCTS_ERROR]) => {
      this.handleRequestError('products', payload.error);
    });

    this.on(APIEventNames.LENDERS_LOADING, () => {
      this.handleRequestStart('lenders');
    });

    this.on(APIEventNames.LENDERS_SUCCESS, (payload: APIEvents[APIEventNames.LENDERS_SUCCESS]) => {
      this.handleRequestSuccess('lenders', payload.lenders);
    });

    this.on(APIEventNames.LENDERS_ERROR, (payload: APIEvents[APIEventNames.LENDERS_ERROR]) => {
      this.handleRequestError('lenders', payload.error);
    });
  }

  private handleRequestStart(endpoint: string): void {
    const currentState = this.getState();
    const activeRequests = new Set(currentState.activeRequests);
    activeRequests.add(endpoint);

    this.setState({
      isLoading: true,
      activeRequests,
      requestCount: currentState.requestCount + 1,
      lastRequestTime: Date.now(),
    });

    this.log(`API request started: ${endpoint}`);
  }

  private handleRequestSuccess(endpoint: string, response: any): void {
    const currentState = this.getState();
    const activeRequests = new Set(currentState.activeRequests);
    activeRequests.delete(endpoint);

    this.setState({
      isLoading: activeRequests.size > 0,
      hasError: false,
      lastError: null,
      lastResponse: response,
      activeRequests,
    });

    this.clearRetryTimer(endpoint);
    this.log(`API request succeeded: ${endpoint}`, response);
  }

  private handleRequestError(endpoint: string, error: Error): void {
    const currentState = this.getState();
    const activeRequests = new Set(currentState.activeRequests);
    activeRequests.delete(endpoint);

    this.setState({
      isLoading: activeRequests.size > 0,
      hasError: true,
      lastError: error,
      activeRequests,
    });

    this.log(`API request failed: ${endpoint}`, error);
    
    // Handle retry logic if needed
    this.scheduleRetry(endpoint, error);
  }

  private scheduleRetry(endpoint: string, _error: Error): void {
    // Simple retry logic - could be enhanced with exponential backoff
    const retryCount = this.getRetryCount(endpoint);
    
    if (retryCount < this.maxRetries) {
      this.log(`Scheduling retry ${retryCount + 1}/${this.maxRetries} for ${endpoint}`);
      
      const timerId = window.setTimeout(() => {
        this.emit(APIEventNames.REQUEST_START, {
          endpoint,
          method: 'retry',
        });
      }, this.retryDelay * (retryCount + 1)); // Progressive delay
      
      this.retryTimers.set(endpoint, timerId);
    }
  }

  private getRetryCount(_endpoint: string): number {
    // This would need to be enhanced to track retry counts per endpoint
    return 0; // Simplified for now
  }

  private clearRetryTimer(endpoint: string): void {
    const timerId = this.retryTimers.get(endpoint);
    if (timerId) {
      clearTimeout(timerId);
      this.retryTimers.delete(endpoint);
    }
  }

  protected onStateChange(previousState: APIState, currentState: APIState): void {
    this.log('API state changed:', {
      previous: previousState,
      current: currentState,
    });

    this.updateAPIDisplay();
    this.updateAccessibility(currentState);
  }

  private updateAPIDisplay(): void {
    const state = this.getState();

    // Update loading state
    this.toggleClass(this.element, 'is-loading', state.isLoading);
    this.toggleClass(this.element, 'has-error', state.hasError);
    
    // Update data attributes for CSS styling
    this.setAttribute(this.element, 'data-request-count', String(state.requestCount));
    this.setAttribute(this.element, 'data-active-requests', String(state.activeRequests.size));

    // Update error display
    if (this.showErrorMessages && this.errorContainer) {
      this.updateErrorDisplay(state);
    }
  }

  private updateErrorDisplay(state: APIState): void {
    if (!this.errorContainer) return;

    if (state.hasError && state.lastError) {
      this.removeClass(this.errorContainer, 'is-hidden');
      this.errorContainer.innerHTML = '';
      
      const errorEl = document.createElement('div');
      errorEl.className = 'api-error';
      errorEl.setAttribute('role', 'alert');
      errorEl.setAttribute('aria-live', 'polite');
      errorEl.textContent = this.getErrorMessage(state.lastError);
      this.errorContainer.appendChild(errorEl);
    } else {
      this.addClass(this.errorContainer, 'is-hidden');
    }
  }

  private getErrorMessage(error: Error): string {
    // Enhanced error message formatting
    if (error.message.includes('404')) {
      return 'The requested information could not be found.';
    }
    if (error.message.includes('500')) {
      return 'A server error occurred. Please try again later.';
    }
    if (error.message.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    return error.message || 'An unexpected error occurred.';
  }

  private updateAccessibility(state: APIState): void {
    // Update ARIA attributes for accessibility
    this.setAttribute(this.element, 'aria-busy', String(state.isLoading));
    
    if (state.isLoading) {
      this.setAttribute(this.element, 'aria-label', 'Loading data...');
    } else if (state.hasError) {
      this.setAttribute(this.element, 'aria-label', 'Error occurred while loading data');
    } else {
      this.element.removeAttribute('aria-label');
    }
  }

  // Public API
  public isLoading(): boolean {
    return this.getState().isLoading;
  }

  public hasError(): boolean {
    return this.getState().hasError;
  }

  public getLastError(): Error | null {
    return this.getState().lastError;
  }

  public getActiveRequests(): string[] {
    return Array.from(this.getState().activeRequests);
  }

  public clearError(): void {
    this.setState({
      hasError: false,
      lastError: null,
    });
  }

  public reset(): void {
    this.setState({
      isLoading: false,
      hasError: false,
      lastError: null,
      lastResponse: null,
      requestCount: 0,
      activeRequests: new Set(),
      lastRequestTime: null,
    });
  }

  protected onDestroy(): void {
    // Clear all retry timers
    this.retryTimers.forEach(timerId => clearTimeout(timerId));
    this.retryTimers.clear();
    
    this.errorContainer = null;
  }
}