import { logError } from '../common/logError';

/**
 * Validate that a required item exists, log error if not
 */

export function validateRequiredItemExists<T>(item: T | null | undefined, context: string, itemName: string): T {
  if (!item) logError(`${context}: No ${itemName} found`);
  return item as T;
}
