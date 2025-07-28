# MCT Component Architecture

This directory contains the new component architecture system for the MCT application. It provides a foundation for building reusable, maintainable components with proper lifecycle management, event handling, and state management.

## Architecture Overview

The component system is built on three main base classes:

### 1. BaseComponent

The foundation class that provides:

- Component lifecycle management (init/destroy)
- DOM element management
- Event bus integration
- Debug logging
- Utility methods for DOM manipulation

### 2. InteractiveComponent

Extends BaseComponent with:

- Event listener management
- Automatic cleanup of event listeners
- Debounced and throttled event handlers
- Event utility methods

### 3. StatefulComponent

Extends InteractiveComponent with:

- Internal state management
- State change notifications
- State subscribers
- State change events

## Usage Examples

### Basic Component

```typescript
import { BaseComponent, type ComponentOptions } from '$mct/components';

class MyComponent extends BaseComponent {
  constructor(options: ComponentOptions) {
    super(options);
  }

  protected onInit(): void {
    this.log('Component initialized');
    // Add initialization logic
  }

  protected onDestroy(): void {
    this.log('Component destroyed');
    // Add cleanup logic
  }
}
```

### Interactive Component

```typescript
import { InteractiveComponent, type InteractiveComponentOptions } from '$mct/components';

class MyInteractiveComponent extends InteractiveComponent {
  private button: HTMLButtonElement | null = null;

  constructor(options: InteractiveComponentOptions) {
    super(options);
  }

  protected bindEvents(): void {
    this.button = this.queryElement('button');

    if (this.button) {
      this.addEventListener(this.button, 'click', this.handleClick.bind(this));
    }
  }

  private handleClick(event: Event): void {
    this.preventDefaultAndStop(event);
    this.emit('button:clicked', { timestamp: Date.now() });
  }
}
```

### Stateful Component

```typescript
import { StatefulComponent, type StatefulComponentOptions } from '$mct/components';

interface MyComponentState {
  value: string;
  isValid: boolean;
}

class MyStatefulComponent extends StatefulComponent<MyComponentState> {
  constructor(options: StatefulComponentOptions<MyComponentState>) {
    super(options);
  }

  protected onStateChange(previousState: MyComponentState, currentState: MyComponentState): void {
    if (this.hasStateChanged('isValid')) {
      this.toggleClass('valid', currentState.isValid);
    }
  }

  public setValue(value: string): void {
    this.setStateValue('value', value);
  }
}
```

## Event System

The component system integrates with the global event bus for component communication:

```typescript
// Emit events
this.emit('form:question:changed', {
  questionId: 'my-question',
  value: 'new-value',
  isValid: true,
  groupName: 'my-group',
});

// Subscribe to events
this.on('form:navigation:update', (payload) => {
  console.log('Navigation updated:', payload);
});
```

## Testing

The component system includes testing utilities:

```javascript
// In browser console on MCT site:
testComponents(); // Test base components
globalEventBus.emit('form:question:changed', {...}); // Test events
```

## Migration Strategy

When migrating existing components:

1. **Start with simple components** - Convert basic UI components first
2. **Add event bus integration** - Replace direct method calls with events
3. **Gradual migration** - Keep existing components working while building new ones
4. **Test thoroughly** - Use the provided testing utilities

## Benefits

- **Decoupled Communication** - Components communicate via events
- **Better Testing** - Easy to mock and test individual components
- **Lifecycle Management** - Proper initialization and cleanup
- **Type Safety** - Full TypeScript support
- **Performance** - Event batching and debouncing
- **Debugging** - Built-in logging and debugging tools
