import { logError } from '../common/logError';

/**
 * Validation & Error Utilities
 *
 * Consolidates repeated patterns for validation and error handling.
 * This provides consistent error messages and reduces code duplication.
 */

/**
 * Validate that a required item exists, log error if not
 */
export function validateRequired<T>(item: T | null | undefined, context: string, itemName: string): T {
  if (!item) {
    logError(`${context}: No ${itemName} found`);
  }
  return item as T;
}

/**
 * Log a missing item error with consistent formatting
 */
export function logMissingItem(context: string, itemName: string): void {
  logError(`${context}: No ${itemName} found`);
}

/**
 * Validate and get an element, log error if not found
 */
export function validateElement(element: HTMLElement | null, context: string, elementName: string): HTMLElement | null {
  if (!element) {
    logMissingItem(context, elementName);
  }
  return element;
}

/**
 * Validate and get a group, log error if not found
 */
export function validateGroup<T>(group: T | null | undefined, context: string, groupName: string): T | null {
  if (!group) {
    logMissingItem(context, groupName);
  }
  return group || null;
}

/**
 * Validate and get a profile, log error if not found
 */
export function validateProfile(profile: any, context: string): any {
  if (!profile) {
    logMissingItem(context, 'profile');
  }
  return profile;
}

/**
 * Validate and get an index, log error if invalid
 */
export function validateIndex(index: number, context: string, itemName: string): number | null {
  if (index === -1) {
    logError(`${context}: No ${itemName} index found`);
    return null;
  }
  return index;
}
