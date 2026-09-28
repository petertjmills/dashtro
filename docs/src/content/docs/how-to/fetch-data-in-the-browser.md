---
title: Fetch data in the browser
description: Re-run a query from a client component with runQuery, without a full page reload.
sidebar:
  order: 3
---

Charts do not fetch. When you need fresh rows after the page has loaded, call
`runQuery` from a client component and pass the result to a chart.

## 1. Keep the initial rows on the server

Run the query in the page so the first render has data.

```astro
---
import { Revenue } from '../components/Revenue';
import revenue from '../queries/revenue.sql';

const initial = await revenue.run({ region: 'UK' });
---

<Revenue client:load initial={initial} />
```

## 2. Fetch again in the component

```tsx
// src/components/Revenue.tsx
import { useEffect, useState } from 'react';
import { AreaChart, runQuery } from 'dashtro/react';

export default function Revenue({ initial }: { initial: Record<string, unknown>[] }) {
  const [region, setRegion] = useState('UK');
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    runQuery('src/queries/revenue.sql', { region }, { signal: controller.signal })
      .then((next) => {
        setRows(next);
        setError(null);
      })
      .catch((caught) => {
        if ((caught as Error).name !== 'AbortError') setError(caught as Error);
      });

    return () => controller.abort();
  }, [region]);

  return (
    <>
      <select value={region} onChange={(event) => setRegion(event.target.value)}>
        <option>UK</option>
        <option>US</option>
      </select>
      {error ? <p>{error.message}</p> : null}
      <AreaChart data={rows} x="day" series={['revenue']} />
    </>
  );
}
```

The query id is the path of the `.sql` file relative to the project root.

## 3. Keep loading and errors in your component

`runQuery` returns a promise and throws on failure. Loading and error state
belong to your component, because only you know what to show.

## Alternatives

- **Polling or caching.** Use a data library such as TanStack Query and pass
  `runQuery` as the query function. Add `refetchInterval` for polling.
- **Plain HTTP.** Call `POST /api/dashtro/query` directly. See
  [the query API](/reference/query-api/).

## Note

The query API needs server output. With `output: 'static'` there is no endpoint.
See [Build and deploy](/how-to/build-and-deploy/).

## Related

- [runQuery reference](/reference/client/)
- [Data loading and rendering](/explanation/data-loading-and-rendering/)
