/**
 * Element Visibility Utilities
 *
 * Consolidates repeated patterns for showing/hiding DOM elements.
 * This provides consistent behavior and reduces code duplication.
 */

/**
 * Show an element by removing the display property
 */
export function showElement(element: HTMLElement): void {
  if (!element) return;
  element.style.removeProperty('display');
}

/**
 * Hide an element by setting display to none
 */
export function hideElement(element: HTMLElement): void {
  if (!element) return;
  element.style.display = 'none';
}

/**
 * Toggle element visibility based on boolean
 */
export function toggleElement(element: HTMLElement, show: boolean): void {
  if (!element) return;

  if (show) {
    showElement(element);
  } else {
    hideElement(element);
  }
}

/**
 * Toggle element visibility with conditional logic
 */
export function toggleElementConditional(element: HTMLElement, condition: boolean, showWhenTrue: boolean = true): void {
  if (!element) return;

  const shouldShow = showWhenTrue ? condition : !condition;
  toggleElement(element, shouldShow);
}

/**
 * Show one element and hide another (common pattern)
 */
export function showOneHideOther(elementToShow: HTMLElement, elementToHide: HTMLElement): void {
  showElement(elementToShow);
  hideElement(elementToHide);
}

/**
 * Toggle between two elements (common pattern)
 */
export function toggleBetweenElements(element1: HTMLElement, element2: HTMLElement, showFirst: boolean): void {
  if (showFirst) {
    showOneHideOther(element1, element2);
  } else {
    showOneHideOther(element2, element1);
  }
}
