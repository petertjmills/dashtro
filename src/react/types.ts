import type * as React from 'react';

import type { Row } from '../runtime/types.js';

/** The built-in chart kinds. */
export type ChartKind = 'bar' | 'line' | 'area' | 'pie' | 'radar' | 'radial';

/** One plotted column. A bare string is shorthand for `{ key }`. */
export interface DashtroSeries {
  /** Column name in the data. */
  key: string;
  /** Human-readable label. Defaults to the key, prettified. */
  label?: string;
  /** CSS colour. Defaults to the built-in palette. */
  color?: string;
  /** Group series into the same stack by giving them the same id. */
  stackId?: string;
}

export type SeriesInput = Array<string | DashtroSeries>;

export interface ValueFormat {
  /** How to render numeric values. */
  style?: 'decimal' | 'currency' | 'percent';
  /** ISO 4217 currency code, used when `style` is `currency`. */
  currency?: string;
  maximumFractionDigits?: number;
}

/**
 * Advanced per-series config. Each key is a series key or, for pie and radial
 * charts, a category value. Overrides the derived labels and colours. Values
 * must be JSON-serialisable.
 */
export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<'light' | 'dark', string> }
  )
>;

/**
 * The rows a chart plots. Charts do not load data. Run the query yourself with
 * `sql.run()` and pass the result.
 */
export interface ChartSourceProps {
  data?: Row[];
  /** Client-side filter controls rendered inside the chart card. */
  filters?: ChartFilter[];
}

/**
 * One filter control, rendered and applied by the chart that declares it.
 * Filters run in the browser on the rows the chart already has; they never run
 * SQL again.
 */
export type ChartFilter =
  | {
      /** Filter a categorical field. Choices come from the rows unless `options` is set. */
      type: 'select';
      field: string;
      label?: string;
      options?: Array<{ label: string; value: string }>;
      /** Initial selection. Defaults to `null`, which is the "All" choice. */
      defaultValue?: string;
    }
  | {
      /** Keep rows from a relative date window through today. */
      type: 'dateRange';
      field: string;
      label?: string;
      presets?: Array<{ label: string; days: number }>;
      defaultValue?: number | 'all';
    }
  | {
      /** Keep rows whose numeric field is within inclusive bounds. */
      type: 'numberRange';
      field: string;
      label?: string;
      defaultMin?: number;
      defaultMax?: number;
    };

/** How columns are selected and coloured. */
export interface ChartSeriesProps {
  /** Category column. Also the slice name for pie and radial charts. */
  x?: string;
  series?: SeriesInput;
  /** Advanced shadcn chart config. Values must be JSON-serialisable. */
  config?: ChartConfig;
  /** Override the default series palette. */
  colors?: string[];
}

/** Card layout around the chart. */
export interface ChartLayoutProps {
  title?: string;
  description?: string;
  className?: string;
  chartClassName?: string;
  /** Chart height in pixels. Defaults to `320`. */
  height?: number;
  /** Skip the Card wrapper and render only the chart. */
  bare?: boolean;
}

/** Chart decoration and number formatting. */
export interface ChartDisplayProps {
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  valueFormat?: ValueFormat;
  /** Recharts children. Overrides the marks generated from `series`. */
  children?: React.ReactNode;
}
