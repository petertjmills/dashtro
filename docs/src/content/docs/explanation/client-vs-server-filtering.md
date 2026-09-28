---
title: Client-side filters and server-side filters
description: Two ways to narrow a chart, and when each one is right.
sidebar:
  order: 3
---

There are two ways to filter a chart. They look similar to the user and are very
different underneath.

## Client-side filters

The `filters` prop. Dashtro filters the rows already in the browser.

- No request. The interaction is instant.
- The query must return every row any setting may show.
- All rows travel to the browser, so the dataset must be small enough.
- Each chart owns its own controls. There is no shared filter state.

Use this when the dataset fits in the page and the filter only removes rows.

## Server-side filters

A query parameter. You re-run SQL with `runQuery` and pass the new rows.

- The database does the work. Aggregates and joins see the full table.
- The response only contains the rows you show.
- You keep the loading and error state in your component.
- It needs the query API, so it needs server output.

Use this when the dataset is large, when you need an aggregate over the filtered
set, or when the filter changes the shape of the query.

## The rule

> A client filter can only remove rows. If the filter changes which rows the
> database should read, filter in SQL.

For example, a chart of the last 90 days cannot be narrowed to the last 7 days
in the browser unless the query already returned those 7 days.

## Mixing

You can mix both. A common pattern is a server-side parameter for the dataset
(for example, a tenant or a date range) and client-side filters for the
categorical columns inside it.

## Related

- [Chart filters reference](/reference/chart-filters/)
- [Fetch data in the browser](/how-to/fetch-data-in-the-browser/)
