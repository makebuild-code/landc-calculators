import { EventBus } from './EventBus';
import type { FormEvents } from '$mct/types';

export const testEventBus = () => {
  console.log('🧪 Testing EventBus...');

  const eventBus = new EventBus({ debug: true });

  // Test basic event subscription
  const unsubscribe = eventBus.on<FormEvents['form:question:changed']>('form:question:changed', (payload) => {
    console.log('✅ Received question changed event:', payload);
  });

  // Test global event handler
  const unsubscribeGlobal = eventBus.onAll((payload) => {
    console.log('🌍 Global handler received:', payload);
  });

  // Test event emission
  eventBus.emit('form:question:changed', {
    questionId: 'test-question',
    value: 'test-value',
    isValid: true,
    groupName: 'test-group',
  });

  // Test unsubscription
  unsubscribe();
  eventBus.emit('form:question:changed', {
    questionId: 'test-question-2',
    value: 'test-value-2',
    isValid: false,
    groupName: 'test-group',
  });

  // Test handler count
  console.log('Handler count for form:question:changed:', eventBus.getHandlerCount('form:question:changed'));

  // Cleanup
  unsubscribeGlobal();
  eventBus.clear();

  console.log('✅ EventBus test completed!');
};

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
  (window as any).testEventBus = testEventBus;
} else if (typeof process !== 'undefined') {
  testEventBus();
}
