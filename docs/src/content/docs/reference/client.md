---
title: runQuery
description: The browser-side fetch helper.
sidebar:
  order: 7
---

`runQuery` runs a registered query through the query API and returns its rows.

```ts
import { runQuery } from 'dashtro';

const rows = await runQuery('src/queries/revenue.sql', { region: 'UK' });
```

## Signature

```ts
function runQuery<T extends Row = Row>(
  id: string,
  params?: Record<string, unknown>,
  options?: RunQueryOptions,
): Promise<T[]>;
```

| Option | Type | Description |
| --- | --- | --- |
| `apiPath` | `string` | Override the endpoint path. Defaults to `/api/dashtro/query`. |
| `signal` | `AbortSignal` | Cancel the request. |
| `fetch` | `typeof fetch` | Custom fetch implementation. Useful in tests. |

## Errors

`runQuery` throws:

- `DashtroRequestError` when the response is not ok. It has a `status` property
  and the server's `error` message.
- The original `AbortError` when the request is cancelled.

```ts
try {
  const rows = await runQuery('src/queries/revenue.sql', { region: 'UK' });
} catch (error) {
  if (error instanceof DashtroRequestError) {
    console.error(error.status, error.message);
  }
}
```

## Cancelling a request

Pass an `AbortSignal` so a new request can cancel the previous one:

```ts
const controller = new AbortController();
runQuery('src/queries/revenue.sql', { region }, { signal: controller.signal });
controller.abort();
```

## Note

The query API needs server output. With `output: 'static'` there is no endpoint
and `runQuery` fails. See [Build and deploy](/how-to/build-and-deploy/).

## Related

- [The query API](/reference/query-api/)
- [Fetch data in the browser](/how-to/fetch-data-in-the-browser/)
