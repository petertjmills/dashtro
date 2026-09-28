---
title: Add chart filters
description: Add select, date-range and number-range controls to a chart.
sidebar:
  order: 4
---

Pass a `filters` array to a chart. Dashtro renders the controls inside the card
and filters the rows in the browser. It does not run SQL again.

## Add a select filter

```astro
<BarChart
  client:load
  data={data}
  x="model"
  series={['spend']}
  filters={[{ type: 'select', field: 'model', label: 'Model' }]}
/>
```

The choices come from the distinct values of `model` in the rows. Pass `options`
to set your own labels or order, and `defaultValue` to start on a value other
than **All**.

```astro
filters={[
  {
    type: 'select',
    field: 'region',
    label: 'Region',
    options: [
      { label: 'United Kingdom', value: 'UK' },
      { label: 'United States', value: 'US' },
    ],
    defaultValue: 'UK',
  },
]}
```

## Add a date range

```astro
filters={[
  {
    type: 'dateRange',
    field: 'day',
    label: 'Window',
    presets: [
      { label: 'Last 7 days', days: 7 },
      { label: 'Last 30 days', days: 30 },
    ],
    defaultValue: 30,
  },
]}
```

A preset keeps rows from `days` days ago through today, using the browser's
local date. `defaultValue` can be `'all'` for no condition. Without `presets`,
Dashtro offers 7, 30 and 90 days.

## Add a number range

```astro
filters={[{ type: 'numberRange', field: 'spend', label: 'Spend' }]}
```

This renders a two-thumb slider. The domain and step come from the numeric
values in the rows. `defaultMin` and `defaultMax` set the starting bounds. When
both thumbs sit at the ends of the domain, the filter applies no condition.

## Combine filters

Multiple filters combine with AND. A row must match every active filter.

```astro
filters={[
  { type: 'select', field: 'region', label: 'Region' },
  { type: 'numberRange', field: 'spend', label: 'Spend', defaultMin: 10 },
]}
```

## Keep the query wide enough

A client filter can only remove rows. The query must return every row that any
filter setting may show. If the dataset is too large, filter in SQL instead.

## Related

- [Chart filters reference](/reference/chart-filters/)
- [Client-side filters and server-side filters](/explanation/client-vs-server-filtering/)
