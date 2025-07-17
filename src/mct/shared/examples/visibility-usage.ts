/**
 * Visibility Manager Usage Examples
 *
 * This file demonstrates how to use the VisibilityManager in your MCT application.
 */

import { MCTManager } from '$mct/manager';
import type { VisibilityManager } from '$mct/state';

// Example 1: Basic usage with HTML attributes
// Add this to your HTML:
/*
<div data-mct-visible-if="{PurchRemo} = Purchase">
  <h3>Purchase-specific content</h3>
  <p>This only shows for purchase customers.</p>
</div>

<div data-mct-visible-if="{LTV} > 80">
  <div class="warning">
    <strong>High LTV Warning:</strong> 
    Your loan-to-value ratio is above 80%.
  </div>
</div>
*/

// Example 2: Programmatic usage
export function setupCustomVisibility() {
  const visibilityManager = MCTManager.getVisibilityManager();

  // Get an element you want to control
  const customElement = document.getElementById('custom-element') as HTMLElement;

  if (customElement) {
    // Add custom visibility condition
    visibilityManager.addElement(customElement, '{PropertyValue} > 500000');

    // Check if element is currently visible
    const isVisible = visibilityManager.isElementVisible(customElement);
    console.log('Custom element visible:', isVisible);
  }
}

// Example 3: Dynamic visibility based on calculations
export function setupCalculationBasedVisibility() {
  const visibilityManager = MCTManager.getVisibilityManager();

  // Show different content based on LTV
  const highLTVElement = document.getElementById('high-ltv-content') as HTMLElement;
  const standardLTVElement = document.getElementById('standard-ltv-content') as HTMLElement;

  if (highLTVElement) {
    visibilityManager.addElement(highLTVElement, '{LTV} > 80');
  }

  if (standardLTVElement) {
    visibilityManager.addElement(standardLTVElement, '{LTV} <= 80');
  }
}

// Example 4: Conditional form sections
export function setupFormSectionVisibility() {
  const visibilityManager = MCTManager.getVisibilityManager();

  // Show different form sections based on purchase type
  const purchaseSection = document.getElementById('purchase-section') as HTMLElement;
  const remortgageSection = document.getElementById('remortgage-section') as HTMLElement;

  if (purchaseSection) {
    visibilityManager.addElement(purchaseSection, '{PurchRemo} = Purchase');
  }

  if (remortgageSection) {
    visibilityManager.addElement(remortgageSection, '{PurchRemo} = Remortgage');
  }
}

// Example 5: Proceedable logic
export function setupProceedableVisibility() {
  const visibilityManager = MCTManager.getVisibilityManager();

  const proceedButton = document.getElementById('proceed-button') as HTMLElement;
  const requirementsMessage = document.getElementById('requirements-message') as HTMLElement;

  if (proceedButton) {
    visibilityManager.addElement(proceedButton, '{isProceedable} = true');
  }

  if (requirementsMessage) {
    visibilityManager.addElement(requirementsMessage, '{isProceedable} = false');
  }
}

// Example 6: Property value dependent content
export function setupPropertyValueVisibility() {
  const visibilityManager = MCTManager.getVisibilityManager();

  const highValueContent = document.getElementById('high-value-content') as HTMLElement;
  const standardValueContent = document.getElementById('standard-value-content') as HTMLElement;
  const noValueMessage = document.getElementById('no-value-message') as HTMLElement;

  if (highValueContent) {
    visibilityManager.addElement(highValueContent, '{PropertyValue} > 500000');
  }

  if (standardValueContent) {
    visibilityManager.addElement(standardValueContent, '{PropertyValue} <= 500000');
  }

  if (noValueMessage) {
    visibilityManager.addElement(noValueMessage, '{PropertyValue} empty');
  }
}

// Example 7: Complex conditional logic
export function setupComplexVisibility() {
  const visibilityManager = MCTManager.getVisibilityManager();

  // Show premium rates for high-value properties with high LTV
  const premiumRatesElement = document.getElementById('premium-rates') as HTMLElement;

  if (premiumRatesElement) {
    // Note: For complex AND logic, you can use nested elements
    // The outer element checks property value
    // The inner element checks LTV
    visibilityManager.addElement(premiumRatesElement, '{PropertyValue} > 500000');
  }

  // Alternative: Use multiple conditions on the same element
  // This would require extending the VisibilityManager to support AND/OR logic
}

// Example 8: Monitoring visibility changes
export function monitorVisibilityChanges() {
  const visibilityManager = MCTManager.getVisibilityManager();

  // Get all managed elements
  const managedElements = visibilityManager.getManagedElements();

  console.log('Currently managing visibility for', managedElements.length, 'elements');

  // Check visibility state of specific elements
  managedElements.forEach((element) => {
    const isVisible = visibilityManager.isElementVisible(element);
    console.log('Element', element.id || element.className, 'is visible:', isVisible);
  });
}

// Example 9: Force update visibility
export function forceUpdateVisibility() {
  const visibilityManager = MCTManager.getVisibilityManager();

  // Force re-evaluation of all visibility conditions
  visibilityManager.forceUpdate();

  console.log('Visibility updated for all elements');
}

// Example 10: Cleanup
export function cleanupVisibility() {
  const visibilityManager = MCTManager.getVisibilityManager();

  // Remove specific element from visibility management
  const elementToRemove = document.getElementById('temporary-element') as HTMLElement;

  if (elementToRemove) {
    visibilityManager.removeElement(elementToRemove);
    console.log('Element removed from visibility management');
  }
}

// Example 11: Integration with existing MCT stages
export function integrateWithMCTStages() {
  // The VisibilityManager is automatically initialized when MCT starts
  // You can access it from any stage manager or component

  const visibilityManager = MCTManager.getVisibilityManager();

  // Example: Add visibility to form questions
  const conditionalQuestion = document.querySelector('[data-mct-questions-question]') as HTMLElement;

  if (conditionalQuestion) {
    visibilityManager.addElement(conditionalQuestion, '{ReadinessToBuy} = OfferAccepted');
  }

  // Example: Add visibility to results
  const conditionalResult = document.querySelector('[data-mct-results-element]') as HTMLElement;

  if (conditionalResult) {
    visibilityManager.addElement(conditionalResult, '{isProceedable} = true');
  }
}

// Example 12: Debug visibility conditions
export function debugVisibilityConditions() {
  const visibilityManager = MCTManager.getVisibilityManager();

  // Log all managed elements and their conditions
  const managedElements = visibilityManager.getManagedElements();

  managedElements.forEach((element) => {
    const isVisible = visibilityManager.isElementVisible(element);
    const elementInfo = {
      id: element.id,
      className: element.className,
      tagName: element.tagName,
      isVisible,
      hasVisibilityAttribute: element.hasAttribute('data-mct-visible-if'),
      visibilityCondition: element.getAttribute('data-mct-visible-if'),
    };

    console.log('Visibility debug info:', elementInfo);
  });
}
