---
title: Package exports
description: The entry points Dashtro publishes and what each one holds.
sidebar:
  order: 8
---

## `dashtro`

The package entry. Loaded by Node when Astro reads `astro.config.mjs`, so it
holds no React or `.astro` code.

- `default` / `dashtro` — the integration function.
- `DashtroOptions` — the integration options type.
- `runQuery`, `DashtroRequestError`, `RunQueryOptions` — the browser fetch helper.
- `createQuery`, `findParams`, `parseDatabaseUrl`, `parseSqlSource` — runtime
  helpers.
- Runtime types: `Database`, `DashtroQuery`, `DashtroResolvedConfig`, `Dialect`,
  `ParamDefinition`, `ParamType`, `QueryDefinition`, `Row`.
- Type-only chart types: `ChartConfig`, `ChartDisplayProps`, `ChartKind`,
  `ChartLayoutProps`, `ChartSeriesProps`, `ChartSourceProps`, `DashtroSeries`,
  `SeriesInput`, `ValueFormat`.

```ts
import dashtro, { runQuery } from 'dashtro';
```

## `dashtro/react`

The React chart layer. This is the bundle that includes Recharts, EvilCharts and
`motion`, with only `react` and `react-dom` external.

- Charts: `BarChart`, `LineChart`, `AreaChart`, `PieChart`, `RadarChart`,
  `RadialChart`, and their props types.
- Layout: `ChartFrame`.
- EvilCharts roots: `EvilAreaChart`, `EvilLineChart`, `EvilBarChart`,
  `EvilPieChart`, `EvilRadarChart`, `EvilRadialChart`.
- EvilCharts parts: `ChartContainer`, `ChartStyle`, `useChart`,
  `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`.
- Config mapping: `toEvilConfig`, `toEvilCategoryConfig`.
- Card parts: `Card`, `CardHeader`, `CardTitle`, `CardDescription`,
  `CardContent`, `CardFooter`, `CardAction`.
- Filters: `FilterControls`, `useChartFilters`, `applyFilters`,
  `createFilterState`, `defaultFilterValue`, `deriveSelectOptions`,
  `isDefaultFilterState`, `niceStep`, `numericDomain`, `selectOptions`,
  `FILTER_ALL`, `ChartFilterValue`, `NumericDomain`, `SelectOption`.
- Series helpers: `buildChartConfig`, `normalizeSeries`, `inferSeries`,
  `findCategoryKey`, `prettify`, `axisWidth`, `truncateLabel`, `DEFAULT_COLORS`,
  `MAX_AXIS_WIDTH`, `NormalizedSeries`.
- `Slider` and `SliderProps`.
- `createValueFormatter`, `cn`.
- `runQuery`, `DashtroRequestError`, `RunQueryOptions`.
- Types: `ChartConfig`, `EvilChartConfig`, `ChartFilter`, `ChartDisplayProps`,
  `ChartLayoutProps`, `ChartSeriesProps`, `ChartSourceProps`, `ChartKind`,
  `DashtroSeries`, `SeriesInput`, `ValueFormat`.

```ts
import { BarChart, runQuery } from 'dashtro/react';
```

## `dashtro/runtime`

Server-safe runtime helpers with no Astro or React imports. Useful in tests.
Exports the query parser, the database adapters, and the query registry
(`createQuery`, `getQuery`, `listQueries`, `registerQuery`, `clearRegistry`,
`getDatabase`, `parseDatabaseUrl`, `parseSqlSource`, `compileSql`, and more).

## `dashtro/client`

The framework-agnostic `runQuery` helper and `DashtroRequestError`.

## `dashtro/routes/query`

The endpoint handler the integration injects. You do not import this directly.

## `dashtro/styles.css`

The Tailwind entry. It adds the `@source` rules and the default theme tokens.
See [Style charts](/how-to/style-charts/).

## Related

- [Charts reference](/reference/charts/)
- [Configuration](/reference/configuration/)
