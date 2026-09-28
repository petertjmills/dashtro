import * as React from 'react';

import type { Row } from '../runtime/types.js';
import {
  applyFilters,
  createFilterState,
  datePresets,
  defaultFilterValue,
  FILTER_ALL,
  isDefaultFilterState,
  niceStep,
  numericDomain,
  selectOptions,
  type ChartFilterValue,
} from './filters.js';
import { prettify } from './series.js';
import { Slider } from './slider.js';
import type { ChartFilter } from './types.js';
import { cn } from './utils.js';

const SELECT_CLASS = 'h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm';
const BUTTON_CLASS =
  'h-9 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent';

export interface FilterControlsProps {
  filters: ChartFilter[];
  values: ChartFilterValue[];
  rows: Row[];
  onChange: (index: number, value: ChartFilterValue) => void;
  onReset: () => void;
  dirty?: boolean;
  className?: string;
}

/** Render the controls for a chart's `filters` prop. */
export function FilterControls({
  filters,
  values,
  rows,
  onChange,
  onReset,
  dirty = false,
  className,
}: FilterControlsProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-end gap-3', className)}>
      {filters.map((filter, index) => (
        <FilterControl
          key={`${filter.type}:${filter.field}:${index}`}
          filter={filter}
          value={values[index] ?? defaultFilterValue(filter)}
          rows={rows}
          onChange={(next) => onChange(index, next)}
        />
      ))}
      {dirty ? (
        <button type="button" className={BUTTON_CLASS} onClick={onReset}>
          Reset
        </button>
      ) : null}
    </div>
  );
}

interface FilterControlProps {
  filter: ChartFilter;
  value: ChartFilterValue;
  rows: Row[];
  onChange: (value: ChartFilterValue) => void;
}

function FilterControl({ filter, value, rows, onChange }: FilterControlProps) {
  const label = filter.label ?? prettify(filter.field);

  if (filter.type === 'select') {
    const options = selectOptions(filter, rows);
    const selected = value.type === 'select' ? value.value : null;

    return (
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <select
          className={SELECT_CLASS}
          value={selected ?? FILTER_ALL}
          onChange={(event) =>
            onChange({
              type: 'select',
              value: event.target.value === FILTER_ALL ? null : event.target.value,
            })
          }
        >
          <option value={FILTER_ALL}>All</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (filter.type === 'dateRange') {
    const presets = datePresets(filter);
    const days = value.type === 'dateRange' ? value.days : 'all';

    return (
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <select
          className={SELECT_CLASS}
          value={days === 'all' ? 'all' : String(days)}
          onChange={(event) =>
            onChange({
              type: 'dateRange',
              days: event.target.value === 'all' ? 'all' : Number(event.target.value),
            })
          }
        >
          <option value="all">All</option>
          {presets.map((preset) => (
            <option key={preset.days} value={String(preset.days)}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  const domain = numericDomain(rows, filter.field);
  if (domain === null || domain.min === domain.max) {
    return (
      <div className="flex min-w-48 flex-col gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <Slider
          disabled
          value={[0, 1]}
          min={0}
          max={1}
          thumbLabels={[`${label} minimum`, `${label} maximum`]}
        />
      </div>
    );
  }

  const step = niceStep(domain.min, domain.max);
  // Extend the maximum to the next step boundary so the top thumb can reach the
  // right edge. A native range cannot land on a value that is not a multiple of
  // `step` from `min`.
  const sliderMax = domain.min + Math.ceil((domain.max - domain.min) / step) * step;
  const hasMin = value.type === 'numberRange' && value.min !== null;
  const hasMax = value.type === 'numberRange' && value.max !== null;
  const thumbMin = hasMin ? clampNumber(value.min as number, domain.min, sliderMax) : domain.min;
  const thumbMax = hasMax ? clampNumber(value.max as number, domain.min, sliderMax) : sliderMax;

  return (
    <div className="flex min-w-48 flex-col gap-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {formatNumber(hasMin ? thumbMin : domain.min)}–
          {formatNumber(hasMax ? Math.min(thumbMax, domain.max) : domain.max)}
        </span>
      </div>
      <Slider
        value={[thumbMin, thumbMax]}
        min={domain.min}
        max={sliderMax}
        step={step}
        onValueChange={(next) => {
          const values = Array.isArray(next) ? next : [next];
          const low = values[0] ?? domain.min;
          const high = values[1] ?? values[0] ?? sliderMax;
          onChange({
            type: 'numberRange',
            min: low <= domain.min ? null : low,
            max: high >= sliderMax ? null : high,
          });
        }}
        thumbLabels={[`${label} minimum`, `${label} maximum`]}
      />
    </div>
  );
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatNumber(value: number): string {
  // Deterministic, unlike `toLocaleString`, so the server and client render the
  // same text. Six decimals covers the finest step `niceStep` produces.
  return String(Number(value.toFixed(6)));
}

export interface UseChartFiltersResult {
  /** Rows that match the current controls. */
  rows: Row[];
  /** The controls to render above the plot. `null` when no filters are configured. */
  controls: React.ReactNode;
  /** Current value of each control, in the same order as `filters`. */
  state: ChartFilterValue[];
  /** True when at least one control differs from its default. */
  dirty: boolean;
  /** Restore every control to its default value. */
  reset: () => void;
}

const NO_FILTERS: ChartFilter[] = [];

/**
 * Own the local state for a chart's `filters` prop. It returns the filtered
 * rows and the controls to render. It never asks the query to run again.
 */
export function useChartFilters(
  filters: ChartFilter[] | undefined,
  rows: Row[],
): UseChartFiltersResult {
  const definitions = filters ?? NO_FILTERS;
  const key = JSON.stringify(definitions);

  const [state, setState] = React.useState<ChartFilterValue[]>(() =>
    createFilterState(definitions),
  );
  const keyRef = React.useRef(key);

  if (keyRef.current !== key) {
    keyRef.current = key;
    setState(createFilterState(definitions));
  }

  const onReset = React.useCallback(() => {
    setState(createFilterState(definitions));
    // `key` covers the contents of `definitions`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const onChange = React.useCallback((index: number, value: ChartFilterValue) => {
    setState((current) => {
      const next = current.slice();
      next[index] = value;
      return next;
    });
  }, []);

  const filtered = React.useMemo(
    () => applyFilters(rows, definitions, state),
    // `key` covers the contents of `definitions`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, key, state],
  );

  const dirty = React.useMemo(
    () => !isDefaultFilterState(definitions, state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, state],
  );

  const controls = React.useMemo(
    () => (
      <FilterControls
        filters={definitions}
        values={state}
        rows={rows}
        onChange={onChange}
        onReset={onReset}
        dirty={dirty}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, state, rows, onChange, onReset, dirty],
  );

  return { rows: filtered, controls, state, dirty, reset: onReset };
}
