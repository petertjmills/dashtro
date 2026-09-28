---
title: Chart filters
description: The ChartFilter union and how each filter behaves.
sidebar:
  order: 3
---

A chart accepts a `filters` array. Dashtro renders the controls inside the card
and filters the rows in the browser. A filter change never runs SQL again.

```ts
type ChartFilter =
  | { type: 'select'; field: string; label?: string; options?: Array<{ label: string; value: string }>; defaultValue?: string }
  | { type: 'dateRange'; field: string; label?: string; presets?: Array<{ label: string; days: number }>; defaultValue?: number | 'all' }
  | { type: 'numberRange'; field: string; label?: string; defaultMin?: number; defaultMax?: number };
```

All definitions must be JSON-serialisable.

## `select`

Keeps rows whose field matches one value.

- The choices come from the distinct values in the rows, in first-seen order.
  `null` and `undefined` are ignored; `0` and `false` are kept.
- Pass `options` to set your own labels or order.
- `All` is always the first choice and applies no condition.
- `defaultValue` preselects a value. The default is `null` (All).

## `dateRange`

Keeps rows from `days` days ago through today, using the browser's local date.

- `presets` defaults to 7, 30 and 90 days.
- `defaultValue` is a number of days, or `'all'`. The default is `'all'`, which
  applies no condition.
- Date strings and `Date` values are compared. A date-only string such as
  `2026-09-22` is read as a local date. A row with a missing or invalid date is
  dropped while a preset is active.

## `numberRange`

Renders a two-thumb slider.

- The domain and step come from the numeric values in the chart's rows.
- `defaultMin` and `defaultMax` set the starting bounds. Both default to the
  ends of the domain.
- Bounds are inclusive.
- When both thumbs sit at the ends of the domain, the filter applies no
  condition and rows with a missing or non-numeric value are kept.
- While a bound is active, rows with a missing or non-numeric value are dropped.

## Combining filters

Multiple filters combine with AND: a row must match every active filter.

## Reset

A **Reset** button appears when at least one control differs from its default.
It restores every control in that chart.

## Scope

Each chart owns its own controls and state. There is no dashboard-wide filter
state. Filtering happens before series inference, so the marks, tooltip, legend
and empty state all use the filtered rows.

## Related

- [Add chart filters](/how-to/add-chart-filters/)
- [Client-side filters and server-side filters](/explanation/client-vs-server-filtering/)
