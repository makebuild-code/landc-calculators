import { EventBus } from './EventBus';

// Create a global event bus instance
// This will be shared across all components in the MCT application
export const globalEventBus = new EventBus({
  debug: process.env.NODE_ENV === 'development',
});

// Export for convenience
export default globalEventBus;
