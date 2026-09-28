import type { Row } from '../runtime/types.js';
import type { ChartConfig, DashtroSeries, SeriesInput } from './types.js';

/** Shared empty row list, so an absent `data` prop keeps a stable identity. */
export const EMPTY_ROWS: Row[] = [];

/** Fallback palette. Apps usually override `--chart-1` ... `--chart-5`. */
export const DEFAULT_COLORS = [
  'var(--chart-1, #3245ff)',
  'var(--chart-2, #b845ed)',
  'var(--chart-3, #ed254e)',
  'var(--chart-4, #f9dc5c)',
  'var(--chart-5, #c2eabd)',
];

export interface NormalizedSeries {
  key: string;
  label: string;
  color: string;
  stackId?: string;
}

/** Resolve the `series` prop into concrete keys, labels and colours. */
export function normalizeSeries(
  series: SeriesInput | undefined,
  rows: Row[],
  x: string | undefined,
  colors?: string[],
): NormalizedSeries[] {
  const palette = colors && colors.length > 0 ? colors : DEFAULT_COLORS;
  const input: SeriesInput = series && series.length > 0 ? series : inferSeries(rows, x);

  return input.map((item, index) => {
    const value: DashtroSeries = typeof item === 'string' ? { key: item } : item;
    return {
      key: value.key,
      label: value.label ?? prettify(value.key),
      color: value.color ?? palette[index % palette.length]!,
      stackId: value.stackId,
    };
  });
}

/** Build a shadcn chart config from the resolved series. An explicit config wins. */
export function buildChartConfig(
  config: ChartConfig | undefined,
  series: NormalizedSeries[],
): ChartConfig {
  const merged: ChartConfig = {};

  for (const item of series) {
    merged[item.key] = { label: item.label, color: item.color };
  }

  return { ...merged, ...config };
}

/** Pick the numeric columns when the caller did not pass `series`. */
export function inferSeries(rows: Row[], x: string | undefined): string[] {
  if (rows.length === 0) {
    return [];
  }

  const keys = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      keys.add(key);
    }
  }

  const numeric = [...keys].filter(
    (key) => key !== x && rows.some((row) => typeof row[key] === 'number'),
  );

  return numeric.length > 0 ? numeric : [...keys].filter((key) => key !== x);
}

/** Pick the first column that is not already used as a value. */
export function findCategoryKey(rows: Row[], exclude: Array<string | undefined>): string | undefined {
  if (rows.length === 0) {
    return undefined;
  }

  const excluded = new Set(exclude.filter(Boolean) as string[]);
  for (const key of Object.keys(rows[0]!)) {
    if (!excluded.has(key)) {
      return key;
    }
  }

  return undefined;
}

/** Turn `cost_per_1k_requests` into `Cost Per 1k Requests`. */
export function prettify(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// A rough width for one character at the axis tick font size.
const AXIS_CHAR_WIDTH = 7;
const AXIS_PADDING = 16;
/** Cap the category axis so the plot keeps room on narrow screens. */
export const MAX_AXIS_WIDTH = 240;

/**
 * Estimate the space a horizontal category axis needs for its longest label.
 * Recharts reserves this width for the axis and wraps or clips anything wider.
 */
export function axisWidth(labels: string[]): number {
  const longest = labels.reduce((max, label) => Math.max(max, label.length), 0);
  return Math.min(AXIS_PADDING + longest * AXIS_CHAR_WIDTH, MAX_AXIS_WIDTH);
}

/** Shorten a category label so it fits inside the axis width. */
export function truncateLabel(value: unknown, width: number): string {
  const text = String(value ?? '');
  const maxChars = Math.max(1, Math.floor((width - AXIS_PADDING) / AXIS_CHAR_WIDTH));
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, Math.max(1, maxChars - 1))}…`;
}
