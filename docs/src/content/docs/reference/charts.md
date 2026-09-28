---
title: Charts
description: The chart components and their shared props.
sidebar:
  order: 2
---

Charts are React components in `dashtro/react`, built on the
[EvilCharts](https://evilcharts.com) registry (Recharts + Motion). Add a
`client:*` directive to hydrate them. They render the rows you pass and never
fetch.

```astro
---
import { AreaChart, BarChart, LineChart, PieChart, RadarChart, RadialChart } from 'dashtro/react';
---
```

## Shared props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `Row[]` | `[]` | The rows to plot. |
| `x` | `string` | inferred | Category column. Also the slice name for pie and radial charts. |
| `series` | `Array<string \| DashtroSeries>` | inferred | The columns to plot. |
| `config` | `ChartConfig` | — | Advanced per-series config: labels and colours. Overrides the derived labels and colours. |
| `colors` | `string[]` | built-in palette | Override the series palette. |
| `filters` | `ChartFilter[]` | — | Client-side filter controls. See [Chart filters](/reference/chart-filters/). |
| `title` / `description` | `string` | — | Renders a shadcn Card header. |
| `className` / `chartClassName` | `string` | — | Classes for the Card and the plot. |
| `height` | `number` | `320` | Plot height in pixels. |
| `bare` | `boolean` | `false` | Skip the Card wrapper. |
| `showLegend` | `boolean` | `false` | Show the legend. |
| `showGrid` | `boolean` | `true` | Show the grid. Line, area and bar charts. |
| `showTooltip` | `boolean` | `true` | Show the tooltip. |
| `valueFormat` | `ValueFormat` | — | Number formatting. |
| `children` | `ReactNode` | — | EvilCharts parts. Overrides the marks generated from `series`. |

Props must be JSON-serialisable, because charts are Astro islands.

### DashtroSeries

```ts
type DashtroSeries = {
  key: string;        // column name
  label?: string;     // defaults to the prettified key
  color?: string;     // defaults to the palette
  stackId?: string;   // group series into one stack
};

type SeriesInput = Array<string | DashtroSeries>;
```

A bare string is shorthand for `{ key }`.

### ValueFormat

```ts
type ValueFormat = {
  style?: 'decimal' | 'currency' | 'percent';
  currency?: string;             // ISO 4217, used when style is 'currency'
  maximumFractionDigits?: number;
};
```

## Components

| Component | Extra props | Notes |
| --- | --- | --- |
| `BarChart` | `stacked?: boolean`, `horizontal?: boolean` | `horizontal` renders sideways. Long category labels are shortened and the full label is in the tooltip. |
| `LineChart` | — | Points are not drawn. |
| `AreaChart` | `stacked?: boolean` | Gradient fill per series. |
| `PieChart` | `innerRadius?: number \| string`, `outerRadius?: number \| string` | `x` names the slices, the first series is the value. Defaults `35%` / `80%`. |
| `RadarChart` | — | `x` is the angle axis. |
| `RadialChart` | `innerRadius?: number \| string`, `outerRadius?: number \| string` | Defaults `30%` / `100%`. |

## Series inference

When `series` is omitted, Dashtro plots every numeric column except `x`. When
`x` is omitted, Dashtro picks the first column that is not a value. Set both
explicitly for stable output.

## Related

- [Style charts](/how-to/style-charts/)
- [Write a custom chart](/how-to/write-a-custom-chart/)
