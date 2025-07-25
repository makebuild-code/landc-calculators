import { StatefulComponent, type StatefulComponentOptions } from '$mct/components';

// Test state interface
interface TestComponentState {
  value: string;
  isValid: boolean;
  isVisible: boolean;
}

// Test component that extends StatefulComponent
class TestComponent extends StatefulComponent<TestComponentState> {
  private input: HTMLInputElement | null = null;
  private button: HTMLButtonElement | null = null;

  constructor(options: StatefulComponentOptions<TestComponentState>) {
    super(options);
  }

  protected onInit(): void {
    this.logDebug('TestComponent initialized');

    // Find elements - add null checks
    try {
      this.input = this.queryElement('input');
      this.button = this.queryElement('button');

      this.logDebug('Found elements:', {
        input: !!this.input,
        button: !!this.button,
      });
    } catch (error) {
      this.logDebug('Error finding elements:', error);
    }

    // Only bind events if elements exist
    if (this.input || this.button) {
      this.bindEvents();
    }

    // Emit initialization event
    this.emit('form:question:changed', {
      questionId: 'test-component',
      value: this.state.value,
      isValid: this.state.isValid,
      groupName: 'test-group',
    });
  }

  protected bindEvents(): void {
    try {
      if (this.input) {
        this.on({ element: this.input, event: 'input', handler: this.handleInput.bind(this) });
        this.logDebug('Added input event listener');
      }

      if (this.button) {
        this.on({ element: this.button, event: 'click', handler: this.handleButtonClick.bind(this) });
        this.logDebug('Added button event listener');
      }
    } catch (error) {
      this.logDebug('Error binding events:', error);
    }
  }

  protected onDestroy(): void {
    this.logDebug('TestComponent destroyed');
  }

  protected onStateChange(previousState: TestComponentState, currentState: TestComponentState): void {
    this.logDebug('State changed', { previous: previousState, current: currentState });

    // Update UI based on state changes
    if (this.hasStateChanged('isVisible')) {
      this.toggleClass(this.rootElement, 'hidden', !currentState.isVisible);
    }

    if (this.hasStateChanged('isValid')) {
      this.toggleClass(this.rootElement, 'valid', currentState.isValid);
      this.toggleClass(this.rootElement, 'invalid', !currentState.isValid);
    }
  }

  private handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    const isValid = value.length > 0;

    this.setState({
      value,
      isValid,
    });
  }

  private handleButtonClick(event: Event): void {
    this.preventDefaultAndStop(event);

    this.setState({
      isVisible: !this.state.isVisible,
    });
  }

  // Public methods for testing
  public setValue(value: string): void {
    this.setStateValue('value', value);
  }

  public setValid(isValid: boolean): void {
    this.setStateValue('isValid', isValid);
  }

  public setVisible(isVisible: boolean): void {
    this.setStateValue('isVisible', isVisible);
  }
}

// Test function
export const testComponents = () => {
  console.log('🧪 Testing Base Components...');

  try {
    // Create a test element and attach to DOM temporarily
    const testElement = document.createElement('div');
    testElement.innerHTML = `
      <input type="text" placeholder="Test input">
      <button>Toggle Visibility</button>
    `;

    // Attach to DOM temporarily for testing
    document.body.appendChild(testElement);

    // Create test component after DOM is ready
    const component = new TestComponent({
      element: testElement,
      debug: true,
      initialState: {
        value: '',
        isValid: false,
        isVisible: true,
      },
    });

    // Initialize after construction
    component.initialise();

    // Test state management
    console.log('Initial state:', component.getState());

    component.setValue('test value');
    component.setValid(true);

    console.log('Updated state:', component.getState());

    // Test event subscription
    const unsubscribe = component.subscribeToState((current: TestComponentState, previous: TestComponentState) => {
      console.log('State subscriber called:', { current, previous });
    });

    component.setVisible(false);

    // Cleanup
    unsubscribe();
    component.destroy();

    // Remove from DOM
    document.body.removeChild(testElement);

    console.log('✅ Base Components test completed!');

    return component;
  } catch (error) {
    console.error('❌ Base Components test failed:', error);
    throw error;
  }
};

// Make available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testComponents = testComponents;
  (window as any).TestComponent = TestComponent;
}
