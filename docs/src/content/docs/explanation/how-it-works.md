---
title: How Dashtro works
description: The pieces of the integration and how a request flows through them.
sidebar:
  order: 1
---

Dashtro does four jobs. Each one is small and separate.

```
Static build:       SQL -> database -> data -> generated page
SSR page request:   browser -> Astro page -> SQL -> database -> rendered page
Client request:     browser -> /api/dashtro/query -> SQL -> database -> JSON
```

## 1. The SQL transform

A Vite plugin turns every `.sql` import into a module. The module exports a
query object with a `run()` method. The plugin parses the front matter, splits
the parameter list from the body, and injects TypeScript types for `*.sql`
imports.

## 2. The data loader

`run()` sends the SQL and the bound values to a database adapter. There are two
adapters: DuckDB (`@duckdb/node-api`) and Postgres (`pg`). The adapter is chosen
from the `database_url`. It rewrites `:name` placeholders to the dialect's form
and binds the values positionally.

The runtime layer has no Astro or React imports, so it runs anywhere and is
unit-testable.

## 3. The component library

The charts are React components built on the
[EvilCharts](https://evilcharts.com) registry, which is vendored into the
package (MIT). They are presentational: you pass rows, they draw marks. They do
not know where the rows came from. This is why the same component works in a
static build, an SSR page and a client island.

## 4. The query API

The integration registers `POST/GET /api/dashtro/query`. `POST` runs a
registered query and returns JSON. `GET` lists the registered queries. Only
queries found in `queriesDir` run. The endpoint never accepts raw SQL.

## Virtual modules

Two virtual modules connect the integration to the runtime:

- `virtual:dashtro/config` — the resolved configuration, inlined into the server
  bundle.
- `virtual:dashtro/queries` — a glob that loads every query for the API
  endpoint.

## Rendering modes

| Mode | `output` | When SQL runs | Query API |
| --- | --- | --- | --- |
| Static | `static` | Build time | Not registered |
| Server | `server` | Request time | Registered |

Dashtro supports both. The charts and filters work in either mode, because
filters only need the rows already in the page. Fetching again with `runQuery`
needs the API, so it needs server output.

## Related

- [Data loading and rendering](/explanation/data-loading-and-rendering/)
- [Build and deploy](/how-to/build-and-deploy/)
