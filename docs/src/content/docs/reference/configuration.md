---
title: Configuration
description: Every option the dashtro integration accepts, and the database URL forms.
sidebar:
  order: 1
---

Pass options to the integration in `astro.config.mjs`:

```js
import dashtro from 'dashtro';

export default defineConfig({
  integrations: [
    dashtro({
      database_url: 'duckdb:./data/analytics.duckdb',
      queriesDir: 'src/queries',
      apiPath: '/api/dashtro/query',
      readOnly: true,
      poolSize: 4,
    }),
  ],
});
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `database_url` | `string` | — | Required. The database to connect to. |
| `databaseUrl` / `database` | `string` | — | Aliases of `database_url`. |
| `queriesDir` | `string` | `<srcDir>/queries` | Directory scanned to register queries for the API. Must be inside the project root. |
| `apiPath` | `string` | `/api/dashtro/query` | Path of the query API endpoint. |
| `readOnly` | `boolean` | `true` | Open DuckDB files read-only. Ignored for Postgres. |
| `poolSize` | `number` | `4` | Maximum pooled Postgres connections. Ignored for DuckDB. |
| `react` | `boolean` | `true` | Set to `false` to stop Dashtro from adding `@astrojs/react`. |
| `mdx` | `boolean` | `true` | Set to `false` to stop Dashtro from adding `@astrojs/mdx`. |

When `database_url` is omitted, Dashtro reads `DASHTRO_DATABASE_URL`, then
`DATABASE_URL`.

## Database URL forms

| Form | Engine |
| --- | --- |
| `duckdb:./data/analytics.duckdb` | DuckDB file, relative to the project root |
| `duckdb:/absolute/path.duckdb` | DuckDB file |
| `duckdb::memory:` | In-memory DuckDB |
| `postgres://user:pass@host:5432/db` | Postgres |
| `postgresql://...` | Postgres |
| `./data/analytics.duckdb` | A bare path is treated as DuckDB |

## What the integration does

1. Adds the `@astrojs/react` and `@astrojs/mdx` integrations unless you set
   `react: false` or `mdx: false`, or you added them yourself.
2. Transforms every `.sql` import into a runnable query object.
3. Registers the query API endpoint when `output` is not `static`.
4. Injects TypeScript types for `*.sql` imports and the `virtual:dashtro/*`
   modules.

## Environment

`readOnly` and `poolSize` only apply to their engine. For a server deployment,
keep the connection string in the environment and let Dashtro read
`DASHTRO_DATABASE_URL`.

## Related

- [Connect to Postgres](/how-to/connect-to-postgres/)
- [Build and deploy](/how-to/build-and-deploy/)
