/**
 * Formats a number string as currency or plain number with commas.
 * @param value - The number as a string or number (e.g. "270000" or 270000)
 * @param options - Optional formatting options
 *   - currency: boolean (default: false) - If true, prepends "£"
 *   - fallback: string (default: "") - Value to return if input is not a valid number
 * @returns The formatted string (e.g. "£270,000" or "270,000")
 */
export function formatNumber(value: string | number, options?: { currency?: boolean; fallback?: string }): string {
  const { currency = false, fallback = '' } = options || {};
  let num = typeof value === 'number' ? value : parseFloat(value.replace(/,/g, ''));
  if (isNaN(num)) return fallback;

  // Format with commas
  const formatted = num.toLocaleString('en-GB', { maximumFractionDigits: 0 });

  return currency ? `£${formatted}` : formatted;
}
