import { BaseComponent, type ComponentOptions } from '$mct/components';

// Simple test component
class SimpleTestComponent extends BaseComponent {
  constructor(options: ComponentOptions) {
    super(options);
  }

  protected onInit(): void {
    this.logDebug('SimpleTestComponent initialized');
    console.log('✅ SimpleTestComponent works!');
  }

  protected onDestroy(): void {
    this.logDebug('SimpleTestComponent destroyed');
  }
}

// Simple test function
export const testSimpleComponent = () => {
  console.log('🧪 Testing Simple Component...');

  try {
    // Create a test element
    const testElement = document.createElement('div');
    testElement.innerHTML = '<p>Test component</p>';

    // Create test component
    const component = new SimpleTestComponent({
      element: testElement,
      debug: true,
    });

    // Initialize after construction
    component.initialise();

    console.log('✅ Simple component test passed!');

    // Cleanup
    component.destroy();

    return component;
  } catch (error) {
    console.error('❌ Simple component test failed:', error);
    throw error;
  }
};

// Make available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testSimpleComponent = testSimpleComponent;
}
