/**
 * Example usage of the improved CalculationManager with type safety
 *
 * This file demonstrates how to use the CalculationManager with the new
 * type-safe calculation keys and methods.
 */

import { CalculationManager } from './CalculationManager';
import { StateManager } from './StateManager';
import type { CalculationKey, CalculationValue } from '$mct/types';

// Example: How to use the CalculationManager with type safety
export function exampleUsage() {
  // Initialize the managers
  const stateManager = new StateManager();
  const calculationManager = new CalculationManager(stateManager);

  // Get available calculation keys - this is now type-safe
  const availableKeys: CalculationKey[] = calculationManager.getAvailableCalculationKeys();
  console.log('Available calculation keys:', availableKeys);
  // Output: ['isProceedable', 'offerAccepted', 'LTV', 'IncludeRetention', 'RepaymentValue', 'InterestOnlyValue']

  // Get a specific calculation with type safety
  const isProceedable = calculationManager.getCalculation('isProceedable');
  const ltv = calculationManager.getCalculation('LTV');
  const offerAccepted = calculationManager.getCalculation('offerAccepted');

  // Check if a calculation exists
  if (calculationManager.hasCalculation('isProceedable')) {
    console.log('isProceedable calculation exists');
  }

  // TypeScript will provide autocomplete and type checking for calculation keys
  // This will cause a TypeScript error if you try to access a non-existent key:
  // const invalidKey = calculationManager.getCalculation('nonExistentKey'); // ❌ TypeScript error

  // Example: Adding a new calculation rule with type safety
  calculationManager.addCalculationRule('NewAnswerKey', (answers) => {
    // This function must return Partial<Calculations>
    const someValue = answers.someValue;
    if (someValue) {
      return { LTV: 75 }; // ✅ Valid calculation key
      // return { invalidKey: 'value' }; // ❌ TypeScript error
    }
    return {};
  });

  // Example: Setting specific calculations
  calculationManager.setCalculations({
    RepaymentValue: 150000,
    InterestOnlyValue: 50000,
  });

  // Example: Setting a single calculation
  calculationManager.setCalculation('LTV', 75);
}

// Example: Type-safe calculation access in components
export function exampleComponentUsage() {
  const stateManager = new StateManager();
  const calculationManager = new CalculationManager(stateManager);

  // In a component, you can now safely access calculations
  function getCalculationDisplay() {
    const isProceedable = calculationManager.getCalculation('isProceedable');
    const ltv = calculationManager.getCalculation('LTV');
    const offerAccepted = calculationManager.getCalculation('offerAccepted');
    const includeRetention = calculationManager.getCalculation('IncludeRetention');

    return {
      isProceedable: isProceedable ?? false,
      ltv: ltv ?? 0,
      offerAccepted: offerAccepted ?? 'N',
      includeRetention: includeRetention ?? false,
    };
  }

  return getCalculationDisplay();
}

// Example: Type-safe calculation key iteration
export function exampleIteration() {
  const stateManager = new StateManager();
  const calculationManager = new CalculationManager(stateManager);

  // You can iterate over available keys with full type safety
  const availableKeys = calculationManager.getAvailableCalculationKeys();

  availableKeys.forEach((key: CalculationKey) => {
    const value: CalculationValue | undefined = calculationManager.getCalculation(key);
    console.log(`Calculation ${key}:`, value);
  });
}

// Example: Setting calculations like in generateProductsAPIInput.ts
export function exampleSetCalculations() {
  const stateManager = new StateManager();
  const calculationManager = new CalculationManager(stateManager);

  // Method 1: Set multiple calculations at once (like in generateProductsAPIInput.ts)
  calculationManager.setCalculations({
    RepaymentValue: 200000,
    InterestOnlyValue: 50000,
  });

  // Method 2: Set calculations one by one
  calculationManager.setCalculation('RepaymentValue', 200000);
  calculationManager.setCalculation('InterestOnlyValue', 50000);

  // Method 3: Set calculations with type safety
  const calculations = {
    RepaymentValue: 200000,
    InterestOnlyValue: 50000,
    LTV: 75,
  } as const;

  calculationManager.setCalculations(calculations);

  // Verify the calculations were set
  console.log('RepaymentValue:', calculationManager.getCalculation('RepaymentValue'));
  console.log('InterestOnlyValue:', calculationManager.getCalculation('InterestOnlyValue'));
  console.log('LTV:', calculationManager.getCalculation('LTV'));
}
