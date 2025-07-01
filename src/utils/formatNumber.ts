/**
 * Formats a number as a string: plain number, currency, or percent.
 * @param value - The number as a string or number (e.g. "270000" or 270000)
 * @param options - Optional formatting options
 *   - type: 'number' | 'currency' | 'percent' (default: 'number')
 *   - decimals: number of decimal places (default: 0 for number/currency, 2 for percent)
 *   - fallback: string (default: "") - Value to return if input is not a valid number
 * @returns The formatted string (e.g. "£270,000", "270,000", or "75.00%")
 */
export function formatNumber(
  value: string | number,
  options?: { type?: 'number' | 'currency' | 'percent'; decimals?: number; fallback?: string }
): string {
  const { type = 'number', decimals, fallback = '' } = options || {};
  let num = typeof value === 'number' ? value : parseFloat(value.replace(/,/g, ''));
  if (isNaN(num)) return fallback;

  if (type === 'currency') {
    const formatted = num.toLocaleString('en-GB', {
      maximumFractionDigits: decimals ?? 0,
      minimumFractionDigits: decimals ?? 0,
    });
    return `£${formatted}`;
  }

  if (type === 'percent') {
    const d = decimals ?? 2;
    const percentValue = num;
    const formatted = percentValue.toLocaleString('en-GB', { maximumFractionDigits: d, minimumFractionDigits: d });
    return `${formatted}%`;
  }

  // Default: plain number
  const formatted = num.toLocaleString('en-GB', {
    maximumFractionDigits: decimals ?? 0,
    minimumFractionDigits: decimals ?? 0,
  });
  return formatted;
}
