import { expect, test } from '@playwright/test';
import { StateManager } from '../src/mct/shared/state/StateManager';

// Note: This is a basic test to verify our state manager works
// In a real project, you'd want to use a proper unit testing framework like Jest or Vitest

let stateManager: StateManager;

test.beforeEach(() => {
  stateManager = new StateManager();
});

test('should initialize with default state', () => {
  const state = stateManager.getState();
  expect(state.lcid).toBeNull();
  expect(state.icid).toBeNull();
  expect(state.currentStageId).toBeNull();
  expect(state.inputs).toEqual({});
  expect(state.summary).toBeNull();
  expect(state.products).toBeNull();
});

test('should update state correctly', () => {
  stateManager.setState({ lcid: 'test-lcid', icid: 'test-icid' });

  const state = stateManager.getState();
  expect(state.lcid).toBe('test-lcid');
  expect(state.icid).toBe('test-icid');
});

test('should notify subscribers of state changes', () => {
  let changeEvent: any = null;

  const unsubscribe = stateManager.subscribe((event) => {
    changeEvent = event;
  });

  stateManager.setState({ lcid: 'new-lcid' });

  expect(changeEvent).not.toBeNull();
  expect(changeEvent.previousState.lcid).toBeNull();
  expect(changeEvent.currentState.lcid).toBe('new-lcid');
  expect(changeEvent.changes.lcid).toBe('new-lcid');

  unsubscribe();
});

test('should handle answer operations correctly', () => {
  stateManager.setAnswer({
    id: 'test-id',
    key: 'test-key',
    value: 'test-value',
  });
  expect(stateManager.getAnswer('test-key')).toBe('test-value');

  expect(stateManager.getAnswer('test-key')).toBeNull();
});

test('should provide immutable state copies', () => {
  const state1 = stateManager.getState();
  stateManager.setState({ lcid: 'test' });
  const state2 = stateManager.getState();

  expect(state1).not.toEqual(state2);
  expect(state1.lcid).toBeNull();
  expect(state2.lcid).toBe('test');
});
