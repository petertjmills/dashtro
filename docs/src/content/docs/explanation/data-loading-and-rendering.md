---
title: Data loading and rendering
description: Why the charts never fetch, and where loading and error state belong.
sidebar:
  order: 2
---

Dashtro keeps data loading and rendering apart. The chart receives `data`; the
caller runs the query.

```astro
---
const data = await revenue.run({ region: 'UK' });
---

<AreaChart data={data} x="day" series={['revenue']} />
```

## Why

- **One data path.** Server rendering, static builds and client islands all pass
  rows to the same component.
- **The caller knows the context.** Only the page knows whether a failure should
  show an error page, retry, or fall back to old data.
- **No hidden state.** A chart has no internal request, cache or timer. It is a
  pure function of its props.

## Where loading and errors belong

If you fetch in the browser, keep the state in your own component:

```tsx
const [rows, setRows] = useState(initial);
const [error, setError] = useState<Error | null>(null);
```

`runQuery` returns a promise and throws on failure. There is no `loading` or
`error` prop on a chart, because the chart never starts a request.

## When to fetch in the browser

- The user changes a parameter and you need new rows from SQL.
- The dataset is too large to send to the browser.
- You want a scheduled refresh.

For everything else, run the query in the page. The first paint then already has
data, with no empty state and no request after hydration.

## Caching and polling

Dashtro ships one fetch helper, not a cache. For caching, retries or polling,
wrap `runQuery` in a data library:

```tsx
useQuery({ queryKey: ['revenue', region], queryFn: () => runQuery('src/queries/revenue.sql', { region }) });
```

## Related

- [Fetch data in the browser](/how-to/fetch-data-in-the-browser/)
- [Client-side filters and server-side filters](/explanation/client-vs-server-filtering/)
