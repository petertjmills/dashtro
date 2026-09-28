import type { Row } from '../runtime/types.js';
import type { ChartFilter } from './types.js';

/**
 * The select value that means "no condition". It is the empty string because a
 * native `<select>` cannot use `null` as an option value.
 */
export const FILTER_ALL = '';

/** Presets used by a date-range filter that does not configure its own. */
export const DEFAULT_DATE_PRESETS: Array<{ label: string; days: number }> = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

/** The current value of one filter control. The `type` matches the filter config. */
export type ChartFilterValue =
  | { type: 'select'; value: string | null }
  | { type: 'dateRange'; days: number | 'all' }
  | { type: 'numberRange'; min: number | null; max: number | null };

/** One choice in a select filter. */
export interface SelectOption {
  label: string;
  value: string;
}

/** The default value for a filter. */
export function defaultFilterValue(filter: ChartFilter): ChartFilterValue {
  switch (filter.type) {
    case 'select':
      return { type: 'select', value: filter.defaultValue ?? null };
    case 'dateRange':
      return { type: 'dateRange', days: filter.defaultValue ?? 'all' };
    case 'numberRange':
      return {
        type: 'numberRange',
        min: filter.defaultMin ?? null,
        max: filter.defaultMax ?? null,
      };
  }
}

/** Build the initial value for each filter. */
export function createFilterState(filters: ChartFilter[]): ChartFilterValue[] {
  return filters.map(defaultFilterValue);
}

/** True when every control still holds its default value. */
export function isDefaultFilterState(filters: ChartFilter[], state: ChartFilterValue[]): boolean {
  return filters.every((filter, index) => {
    const current = state[index] ?? defaultFilterValue(filter);
    const initial = defaultFilterValue(filter);

    if (current.type !== initial.type) {
      return false;
    }

    switch (current.type) {
      case 'select':
        return current.value === (initial as { value: string | null }).value;
      case 'dateRange':
        return current.days === (initial as { days: number | 'all' }).days;
      case 'numberRange':
        return (
          current.min === (initial as { min: number | null }).min &&
          current.max === (initial as { max: number | null }).max
        );
    }
  });
}

/**
 * Apply every filter to the rows with AND semantics. Rows that match all active
 * conditions are kept. An inactive condition keeps every row.
 */
export function applyFilters(
  rows: Row[],
  filters: ChartFilter[],
  state: ChartFilterValue[],
): Row[] {
  if (filters.length === 0) {
    return rows;
  }

  return rows.filter((row) =>
    filters.every((filter, index) =>
      matchesFilter(filter, state[index] ?? defaultFilterValue(filter), row),
    ),
  );
}

/** Derive select choices from the source rows, in first-seen order. */
export function deriveSelectOptions(rows: Row[], field: string): SelectOption[] {
  const seen = new Set<string>();
  const options: SelectOption[] = [];

  for (const row of rows) {
    const raw = row[field];
    if (raw === null || raw === undefined) {
      continue;
    }

    const value = String(raw);
    if (value === FILTER_ALL || seen.has(value)) {
      continue;
    }

    seen.add(value);
    options.push({ label: value, value });
  }

  return options;
}

/** Resolve the choices for a select filter: explicit options win, else derive them. */
export function selectOptions(filter: ChartFilter, rows: Row[]): SelectOption[] {
  if (filter.type !== 'select') {
    return [];
  }

  return filter.options && filter.options.length > 0
    ? filter.options
    : deriveSelectOptions(rows, filter.field);
}

/** Resolve the presets for a date-range filter. */
export function datePresets(
  filter: ChartFilter,
): Array<{ label: string; days: number }> {
  if (filter.type !== 'dateRange') {
    return [];
  }

  return filter.presets && filter.presets.length > 0 ? filter.presets : DEFAULT_DATE_PRESETS;
}

/** Coerce a value to a date. Date-only strings are treated as local dates. */
export function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }

    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (dateOnly) {
      const date = new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3]),
      );
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function matchesFilter(filter: ChartFilter, value: ChartFilterValue, row: Row): boolean {
  switch (filter.type) {
    case 'select': {
      const selected = value.type === 'select' ? value.value : null;
      if (selected === null || selected === FILTER_ALL) {
        return true;
      }

      const raw = row[filter.field];
      if (raw === null || raw === undefined) {
        return false;
      }

      return String(raw) === selected;
    }
    case 'dateRange': {
      const days = value.type === 'dateRange' ? value.days : 'all';
      if (days === 'all') {
        return true;
      }

      const date = toDate(row[filter.field]);
      if (!date) {
        return false;
      }

      const now = new Date();
      const start = startOfDay(now);
      start.setDate(start.getDate() - days);
      const end = endOfDay(now);

      return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
    }
    case 'numberRange': {
      const min = value.type === 'numberRange' ? value.min : null;
      const max = value.type === 'numberRange' ? value.max : null;
      if (min === null && max === null) {
        return true;
      }

      const raw = row[filter.field];
      if (typeof raw !== 'number' || !Number.isFinite(raw)) {
        return false;
      }

      if (min !== null && raw < min) {
        return false;
      }
      if (max !== null && raw > max) {
        return false;
      }

      return true;
    }
  }
}

/** The smallest and largest finite numbers in a column. */
export interface NumericDomain {
  min: number;
  max: number;
}

/**
 * Derive the slider domain for a numeric field from the source rows. Returns
 * `null` when the column has no finite numbers. The domain comes from the rows
 * the chart received, not from the filtered rows, so dragging a thumb cannot
 * move the domain under the thumb.
 */
export function numericDomain(rows: Row[], field: string): NumericDomain | null {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let found = false;

  for (const row of rows) {
    const value = row[field];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      continue;
    }

    found = true;
    if (value < min) {
      min = value;
    }
    if (value > max) {
      max = value;
    }
  }

  return found ? { min, max } : null;
}

/**
 * Choose a readable slider step for a domain. It rounds the range down to 100
 * steps and then to a 1, 2, 5 or 10 multiple, so the values stay short.
 */
export function niceStep(min: number, max: number): number {
  const range = max - min;
  if (!(range > 0)) {
    return 1;
  }

  const rough = range / 100;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

  return factor * magnitude;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}
