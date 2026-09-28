import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  applyFilters,
  createFilterState,
  deriveSelectOptions,
  isDefaultFilterState,
  niceStep,
  numericDomain,
  toDate,
  type ChartFilterValue,
} from '../src/react/filters.js';
import type { ChartFilter } from '../src/react/types.js';
import type { Row } from '../src/runtime/types.js';

const NOW = new Date(2026, 8, 22, 12, 0, 0);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

/** An ISO date string `daysAgo` local days before the fixed "now". */
function day(daysAgo: number): string {
  const date = new Date(NOW);
  date.setDate(date.getDate() - daysAgo);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${dayOfMonth}`;
}

describe('createFilterState', () => {
  it('starts select filters on "All"', () => {
    const filters: ChartFilter[] = [{ type: 'select', field: 'model' }];
    expect(createFilterState(filters)).toEqual([{ type: 'select', value: null }]);
  });

  it('uses the configured select default', () => {
    const filters: ChartFilter[] = [
      { type: 'select', field: 'dataset_name', defaultValue: 'All Respondents' },
    ];
    expect(createFilterState(filters)).toEqual([
      { type: 'select', value: 'All Respondents' },
    ]);
    expect(
      isDefaultFilterState(filters, [{ type: 'select', value: 'All Respondents' }]),
    ).toBe(true);
    expect(isDefaultFilterState(filters, [{ type: 'select', value: null }])).toBe(false);
  });

  it('uses the configured date default, or "All" when absent', () => {
    const filters: ChartFilter[] = [
      { type: 'dateRange', field: 'day', defaultValue: 30 },
      { type: 'dateRange', field: 'day' },
    ];
    expect(createFilterState(filters)).toEqual([
      { type: 'dateRange', days: 30 },
      { type: 'dateRange', days: 'all' },
    ]);
  });

  it('uses the number defaults, and no bound when they are absent', () => {
    const filters: ChartFilter[] = [
      { type: 'numberRange', field: 'spend', defaultMin: 0, defaultMax: 100 },
      { type: 'numberRange', field: 'spend' },
    ];
    expect(createFilterState(filters)).toEqual([
      { type: 'numberRange', min: 0, max: 100 },
      { type: 'numberRange', min: null, max: null },
    ]);
  });
});

describe('isDefaultFilterState', () => {
  it('is true for a fresh state and false after a change', () => {
    const filters: ChartFilter[] = [
      { type: 'select', field: 'model' },
      { type: 'numberRange', field: 'spend', defaultMin: 10 },
    ];
    const initial = createFilterState(filters);

    expect(isDefaultFilterState(filters, initial)).toBe(true);
    expect(
      isDefaultFilterState(filters, [
        { type: 'select', value: 'a' },
        { type: 'numberRange', min: 10, max: null },
      ]),
    ).toBe(false);
    expect(
      isDefaultFilterState(filters, [
        { type: 'select', value: null },
        { type: 'numberRange', min: 20, max: null },
      ]),
    ).toBe(false);
  });
});

describe('applyFilters with select', () => {
  const filters: ChartFilter[] = [{ type: 'select', field: 'model' }];
  const rows: Row[] = [
    { model: 'a', spend: 1 },
    { model: 'b', spend: 2 },
    { model: null, spend: 3 },
  ];

  it('keeps every row for "All"', () => {
    expect(applyFilters(rows, filters, createFilterState(filters))).toEqual(rows);
  });

  it('keeps only the matching value', () => {
    const state: ChartFilterValue[] = [{ type: 'select', value: 'a' }];
    expect(applyFilters(rows, filters, state)).toEqual([{ model: 'a', spend: 1 }]);
  });

  it('drops missing values when a value is selected', () => {
    const state: ChartFilterValue[] = [{ type: 'select', value: 'a' }];
    expect(applyFilters(rows, filters, state)).toHaveLength(1);
  });

  it('returns the same array when no filters are configured', () => {
    expect(applyFilters(rows, [], [])).toBe(rows);
  });
});

describe('deriveSelectOptions', () => {
  it('keeps zero and false, drops null and undefined, and dedupes in order', () => {
    const rows: Row[] = [
      { model: 'b' },
      { model: 0 },
      { model: false },
      { model: 'b' },
      { model: null },
      { model: undefined },
      { model: '' },
    ];

    expect(deriveSelectOptions(rows, 'model')).toEqual([
      { label: 'b', value: 'b' },
      { label: '0', value: '0' },
      { label: 'false', value: 'false' },
    ]);
  });
});

describe('applyFilters with dateRange', () => {
  const filters: ChartFilter[] = [{ type: 'dateRange', field: 'day' }];
  const rows: Row[] = [
    { day: day(0) },
    { day: day(6) },
    { day: day(10) },
    { day: 'not-a-date' },
    { day: null },
  ];

  it('keeps every row, including invalid dates, for "All"', () => {
    expect(applyFilters(rows, filters, createFilterState(filters))).toHaveLength(5);
  });

  it('keeps rows from the selected start date through today', () => {
    const state: ChartFilterValue[] = [{ type: 'dateRange', days: 7 }];
    expect(applyFilters(rows, filters, state)).toEqual([{ day: day(0) }, { day: day(6) }]);
  });

  it('drops rows with a missing or invalid date when a preset is active', () => {
    const state: ChartFilterValue[] = [{ type: 'dateRange', days: 7 }];
    const kept = applyFilters(rows, filters, state);
    expect(kept.some((row) => row.day === null)).toBe(false);
    expect(kept.some((row) => row.day === 'not-a-date')).toBe(false);
  });

  it('accepts timestamp values', () => {
    const state: ChartFilterValue[] = [{ type: 'dateRange', days: 7 }];
    const withTimestamp: Row[] = [{ day: new Date(NOW).toISOString() }];
    expect(applyFilters(withTimestamp, filters, state)).toHaveLength(1);
  });
});

describe('applyFilters with numberRange', () => {
  const rows: Row[] = [
    { spend: 5 },
    { spend: 10 },
    { spend: 20 },
    { spend: '12' },
    { spend: null },
  ];

  it('does not limit rows when both bounds are empty', () => {
    const filters: ChartFilter[] = [{ type: 'numberRange', field: 'spend' }];
    expect(applyFilters(rows, filters, createFilterState(filters))).toEqual(rows);
  });

  it('uses inclusive bounds', () => {
    const filters: ChartFilter[] = [{ type: 'numberRange', field: 'spend' }];
    const state: ChartFilterValue[] = [{ type: 'numberRange', min: 10, max: 20 }];
    expect(applyFilters(rows, filters, state)).toEqual([{ spend: 10 }, { spend: 20 }]);
  });

  it('supports a lower bound only', () => {
    const filters: ChartFilter[] = [
      { type: 'numberRange', field: 'spend', defaultMin: 10 },
    ];
    expect(applyFilters(rows, filters, createFilterState(filters))).toEqual([
      { spend: 10 },
      { spend: 20 },
    ]);
  });

  it('supports an upper bound only', () => {
    const filters: ChartFilter[] = [
      { type: 'numberRange', field: 'spend', defaultMax: 10 },
    ];
    expect(applyFilters(rows, filters, createFilterState(filters))).toEqual([
      { spend: 5 },
      { spend: 10 },
    ]);
  });

  it('drops missing and non-numeric values when a bound is active', () => {
    const filters: ChartFilter[] = [
      { type: 'numberRange', field: 'spend', defaultMin: 0 },
    ];
    expect(applyFilters(rows, filters, createFilterState(filters))).toEqual([
      { spend: 5 },
      { spend: 10 },
      { spend: 20 },
    ]);
  });
});

describe('combined filters', () => {
  it('applies every filter with AND semantics', () => {
    const filters: ChartFilter[] = [
      { type: 'select', field: 'region' },
      { type: 'numberRange', field: 'spend', defaultMin: 10 },
    ];
    const state: ChartFilterValue[] = [
      { type: 'select', value: 'UK' },
      { type: 'numberRange', min: 10, max: null },
    ];
    const rows: Row[] = [
      { region: 'UK', spend: 5 },
      { region: 'UK', spend: 15 },
      { region: 'US', spend: 20 },
    ];

    expect(applyFilters(rows, filters, state)).toEqual([{ region: 'UK', spend: 15 }]);
  });
});

describe('numericDomain', () => {
  it('returns the smallest and largest finite numbers', () => {
    const rows: Row[] = [{ spend: 5 }, { spend: 20 }, { spend: -3 }];
    expect(numericDomain(rows, 'spend')).toEqual({ min: -3, max: 20 });
  });

  it('ignores missing, invalid and non-numeric values', () => {
    const rows: Row[] = [{ spend: 5 }, { spend: null }, { spend: '12' }, { spend: Number.NaN }];
    expect(numericDomain(rows, 'spend')).toEqual({ min: 5, max: 5 });
  });

  it('returns null when the column has no finite number', () => {
    expect(numericDomain([{ spend: 'a' }], 'spend')).toBeNull();
    expect(numericDomain([], 'spend')).toBeNull();
  });
});

describe('niceStep', () => {
  it('picks a 1, 2, 5 or 10 multiple of a power of ten', () => {
    expect(niceStep(0, 100)).toBe(1);
    expect(niceStep(0, 1000)).toBe(10);
    expect(niceStep(0, 1)).toBe(0.01);
    expect(niceStep(0, 5)).toBe(0.05);
  });

  it('falls back to 1 without a range', () => {
    expect(niceStep(4, 4)).toBe(1);
  });
});

describe('toDate', () => {
  it('treats a date-only string as a local date', () => {
    const date = toDate('2026-09-22');
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(8);
    expect(date?.getDate()).toBe(22);
  });

  it('returns null for missing or invalid values', () => {
    expect(toDate(undefined)).toBeNull();
    expect(toDate(null)).toBeNull();
    expect(toDate('')).toBeNull();
    expect(toDate('nonsense')).toBeNull();
    expect(toDate(new Date('nonsense'))).toBeNull();
  });

  it('passes through Date and number values', () => {
    const date = new Date(NOW);
    expect(toDate(date)).toBe(date);
    expect(toDate(date.getTime())?.getTime()).toBe(date.getTime());
  });
});
