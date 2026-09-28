---
title: Add a filter to a chart
description: Add a select filter that lets the reader pick a region without a page reload.
sidebar:
  order: 2
---

This tutorial continues from [Build your first dashboard](/tutorials/first-dashboard/).
You will add a region filter. The filter runs in the browser and the query runs
on the server.

## 1. Widen the query

A client-side filter can only remove rows. It cannot add them. The query must
return every region before the chart can filter by region.

Change `src/queries/revenue.sql`:

```sql
select
  day,
  region,
  round(sum(amount), 2) as revenue
from daily_orders
group by day, region
order by day
```

The query now returns one row per day per region.

## 2. Add the filter

Add a `filters` prop to the chart in `src/pages/index.astro`:

```astro
<AreaChart
  client:load
  data={data}
  x="day"
  series={[{ key: 'revenue', label: 'Revenue' }]}
  title="Revenue per day"
  valueFormat={{ style: 'currency', currency: 'GBP' }}
  filters={[{ type: 'select', field: 'region', label: 'Region' }]}
/>
```

## 3. Try it

Reload the page. A **Region** dropdown appears above the plot. Choose a region
and the chart redraws with only that region. Choose **All** to show everything.

Open the network tab and change the region again. There is no new request. The
browser filters the rows it already has.

## 4. Set a default and add a second filter

A select filter starts on **All**. Set `defaultValue` to start on one region.
You can also add the other filter types to the same array:

```astro
filters={[
  { type: 'select', field: 'region', label: 'Region', defaultValue: 'UK' },
  {
    type: 'dateRange',
    field: 'day',
    label: 'Window',
    presets: [
      { label: '7 days', days: 7 },
      { label: '30 days', days: 30 },
    ],
    defaultValue: 30,
  },
]}
```

Multiple filters combine with AND: a row must match every active filter. A
**Reset** button appears when any control differs from its default.

## What just happened

- The select options came from the distinct `region` values in the rows, so you
  did not have to list them.
- The date range compared `day` values in the browser.
- The query did not change when you moved a control.

## Next steps

- [Chart filters reference](/reference/chart-filters/) lists every option.
- [Client-side filters and server-side filters](/explanation/client-vs-server-filtering/)
  explains when a filter must go in the SQL instead.
