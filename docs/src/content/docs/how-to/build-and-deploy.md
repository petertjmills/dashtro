---
title: Build and deploy
description: Choose a rendering mode and run a production build.
sidebar:
  order: 8
---

Dashtro works with both static and server output. The choice decides when the
SQL runs.

## Server rendering (recommended)

Add an adapter and set `output: 'server'`. The SQL runs at request time, and the
query API endpoint is available.

```js
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [dashtro({ database_url: 'duckdb:./data/analytics.duckdb' })],
});
```

```bash
pnpm build
HOST=0.0.0.0 PORT=4321 node dist/server/entry.mjs
```

Use the adapter for your host: `@astrojs/node`, `@astrojs/vercel`,
`@astrojs/netlify`, and so on.

## Static rendering

With `output: 'static'` the SQL runs at build time. The pages are plain files and
need no database at run time.

```js
export default defineConfig({
  output: 'static',
  integrations: [dashtro({ database_url: 'duckdb:./data/analytics.duckdb' })],
});
```

In this mode Dashtro skips the query API endpoint and logs a warning.
`runQuery` and client-side refetching do not work. Client-side filters still
work, because they only need the rows that were rendered into the page.

## Keep the database reachable

- **Server:** the process needs a database connection at request time.
- **Static:** the build machine needs the database once.

For DuckDB, the build or server process must be able to read the file. For
Postgres, keep the connection string in an environment variable:

```bash
export DASHTRO_DATABASE_URL='postgres://...'
```

Dashtro reads `DASHTRO_DATABASE_URL` or `DATABASE_URL` when `database_url` is
omitted.

## Related

- [Configuration reference](/reference/configuration/)
- [The query API](/reference/query-api/)
