import type { ValueFormat } from './types.js';

/** Build a tick/tooltip formatter from the serialisable `valueFormat` prop. */
export function createValueFormatter(format: ValueFormat | undefined): (value: unknown) => string {
  if (format) {
    try {
      const formatter = new Intl.NumberFormat(undefined, {
        style: format.style ?? 'decimal',
        currency: format.currency,
        maximumFractionDigits: format.maximumFractionDigits ?? 2,
      });
      return (value: unknown) =>
        typeof value === 'number' ? formatter.format(value) : String(value ?? '');
    } catch {
      // Fall through to the default formatter below.
    }
  }

  return (value: unknown) => {
    if (typeof value === 'number') {
      return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
    }
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    return String(value ?? '');
  };
}
