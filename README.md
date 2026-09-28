<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/logo-white-gradient-dashtro.webp">
    <img alt="Dashtro" src="./assets/logo-black-gradient-dashtro.webp" width="260">
  </picture>
</p>

# Dashtro

Declarative, code-first dashboards for [Astro](https://astro.build). Write SQL
and markup. Get a pretty, mobile-friendly dashboard with live data.

- **SQL files** are imported like modules: `import sales from '@/queries/sales.sql'`.
- **Charts** are built on [EvilCharts](https://evilcharts.com) (Recharts + Motion) and rendered as React components.
- **Data** is fetched at build time, at request time (SSR), or from the browser
  through a query API endpoint - without a page reload.
- **Databases**: DuckDB and Postgres.

> Status: early (`0.1.0`). The API is usable and covered by tests, but it will change.

## Documentation

The full documentation lives in [`docs/`](./docs), built with Starlight and
organised with the [Diátaxis](https://diataxis.fr/) framework. The source and
the issue tracker live on [Forgejo](https://forgejo.pm4.uk/peter/dashtro). Run
the docs from the repository root:

```bash
pnpm --filter dashtro-docs dev
```

## Quick start

```bash
# In an existing Astro project:
pnpm add dashtro @astrojs/react @astrojs/mdx react react-dom
pnpm add @astrojs/node            # SSR adapter (recommended)
pnpm add @duckdb/node-api         # DuckDB connector (or: pnpm add pg)
pnpm add -D tailwindcss @tailwindcss/vite
```

dashtro adds the `@astrojs/react` and `@astrojs/mdx` integrations for you, but
they must be installed in your project (they are peer dependencies). The same is
true of the database connector: install `@duckdb/node-api` for DuckDB or `pg`
for Postgres. If you already use the React/MDX integrations, dashtro leaves your
setup alone.

If pnpm 11 reports `ERR_PNPM_IGNORED_BUILDS`, allow the build scripts that Astro
and Dashtro need. Add this to `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  esbuild: true
  sharp: true
  '@duckdb/node-api': true
```

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import dashtro from 'dashtro';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    dashtro({ database_url: 'duckdb:./data/analytics.duckdb' }),
  ],
});
```

Write a query:

```sql
-- src/queries/revenue.sql
---
region?: string
---
select
  day,
  round(sum(amount), 2) as revenue
from orders
where region is not distinct from :region
group by day
order by day
```

Use it in a page. You run the query; the chart only renders rows:

```astro
---
// src/pages/index.astro
import { AreaChart } from 'dashtro/react';
import revenue from '../queries/revenue.sql';

const data = await revenue.run({ region: 'UK' });
---

<AreaChart
  client:load
  data={data}
  x="day"
  series={[{ key: 'revenue', label: 'Revenue' }]}
  title="Revenue"
  valueFormat={{ style: 'currency', currency: 'GBP' }}
/>
```

Charts are React components, so add a `client:*` directive to hydrate them.
`client:load` renders immediately; `client:visible` waits until the chart
scrolls into view.

Run `pnpm astro dev`. The chart renders on the server and can refresh from the
browser.

## How it works

```
Static build:      SQL -> database -> data -> generated page
SSR page request:  browser -> Astro page -> SQL -> database -> rendered page
Client interaction: browser -> /api/dashtro/query -> SQL -> database -> JSON
```

The integration does four things:

1. Adds the Astro React and MDX integrations (unless you already added them).
2. Transforms every `.sql` import into a runnable query object.
3. Exposes a query API endpoint for client-side refreshes and filters.
4. Injects TypeScript types for `*.sql` imports.

## SQL files

Front matter declares parameter types. Parameters are written as `:name` in the
SQL body.

```sql
---
region: string
from?: date
tags?: string[]
---
select *
from sales
where region = :region
  and day >= :from
  and tag = any(:tags)
```

- `name: type` - required parameter.
- `name?: type` - nullable parameter. A missing value is passed as `null`.
- `type[]` - array parameter.
- Types: `string`, `integer`, `number`, `boolean`, `date`, `datetime`, `json`, `any`.
- Parameters that are used but not declared default to `any` and are required.

Parameters are ignored inside strings, quoted identifiers, comments, Postgres
casts (`::type`) and dollar-quoted strings. Dashtro rewrites `:name` to `?`
(DuckDB) or `$1`, `$2`, ... (Postgres) and binds values positionally.

### The query object

Every `.sql` import returns a query object:

```ts
import sales from '@/queries/sales.sql';

const rows = await sales.run({ region: 'UK' });

sales.id;      // 'src/queries/sales.sql', relative to the project root
sales.sql;     // the SQL body, without front matter
sales.params;  // parameter definitions
sales.definition();
```

`run()` validates and coerces parameters before it touches the database, so a
missing required parameter throws a clear error.

## Charts

Charts are React components in `dashtro/react`:

```astro
import { AreaChart, BarChart, LineChart, PieChart, RadarChart, RadialChart } from 'dashtro/react';
```

Data loading is separate. Run the query with `sql.run()` in the page, then pass
the rows as `data`. Add a `client:*` directive to hydrate the chart.

Common props:

| Prop | Description |
| --- | --- |
| `data` | The rows to plot. Run the query yourself with `sql.run()`. |
| `x` | Category column. Also the slice name for pie and radial charts. |
| `series` | Columns to plot. `['spend']` or `[{ key, label, color, stackId }]`. Inferred from the data when omitted. |
| `title` / `description` | Renders a shadcn Card header. |
| `stacked` | Stack bars and areas. |
| `horizontal` | Horizontal bars. |
| `height` | Chart height in pixels. Defaults to `320`. |
| `valueFormat` | `{ style: 'currency' \| 'decimal' \| 'percent', currency, maximumFractionDigits }`. |
| `colors` | Override the default series palette. |
| `showLegend` / `showGrid` / `showTooltip` | Toggle chart elements. |
| `bare` | Skip the Card wrapper. |
| `children` | EvilCharts parts. Overrides the marks generated from `series`. |
| `filters` | Client-side filter controls rendered above the plot. See [Chart filters](#chart-filters). |

Props must be JSON-serialisable because charts are Astro islands. Use the
`valueFormat` object for number formatting instead of a formatter function.

Charts never load data themselves. To add a server-side filter or a scheduled
refresh, see [Client-side data](#client-side-data).

### Chart filters

Pass a `filters` array to add common filter controls to a chart. Dashtro
renders the controls inside the card and filters the rows in the browser. The
chart does not run SQL again, so the query must return every row the filter may
show.

```astro
---
import { BarChart } from 'dashtro/react';
import spend from '../queries/spend.sql';

const data = await spend.run();
---

<BarChart
  client:load
  data={data}
  x="model"
  series={['spend']}
  filters={[
    { type: 'select', field: 'model', label: 'Model' },
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
    { type: 'numberRange', field: 'spend', label: 'Spend', defaultMin: 0 },
  ]
/>
```

The filters combine with AND semantics:

- `select` keeps rows whose field matches one value. The choices come from the
distinct values in the rows unless you pass `options`. `All` is always the
first choice and applies no condition. Set `defaultValue` to start on another
value.
- `dateRange` keeps rows from `days` days ago through today, using the local
date. A `defaultValue` of `'all'` (or no `defaultValue`) applies no condition.
- `numberRange` renders a range slider. Its domain and step come from the
numeric values in the chart's rows. The bounds are inclusive. When both thumbs
sit at the ends of the domain, the filter applies no condition.

All filter definitions must be JSON-serialisable. The controls stay visible when
the filtered plot has no rows, and a `Reset` button appears once a control
differs from its default. Filtering runs before series inference, so the marks,
tooltip, legend and empty state all use the filtered rows.

```tsx
// A chart dashtro does not ship: compose an EvilCharts root with its parts.
import { EvilBarChart, type EvilChartConfig } from 'dashtro/react';
import { ReferenceLine } from 'recharts';

const config = {
  value: { label: 'Value', colors: { light: ['#f97316'], dark: ['#fb923c'] } },
} satisfies EvilChartConfig;

export function MyChart({ data, goal }) {
  return (
    <div className="h-80 w-full">
      <EvilBarChart data={data} config={config} xDataKey="label" className="h-full w-full">
        <EvilBarChart.Grid />
        <EvilBarChart.XAxis dataKey="label" />
        <EvilBarChart.YAxis />
        <EvilBarChart.Tooltip />
        <ReferenceLine y={goal} stroke="var(--chart-2)" strokeDasharray="4 4" />
        <EvilBarChart.Bar dataKey="value" />
      </EvilBarChart>
    </div>
  );
}
```

## Client-side data

Fetch a registered query from the browser:

```ts
import { runQuery } from 'dashtro';

const rows = await runQuery('src/queries/revenue.sql', { region: 'UK' });
```

React example. The charts are presentational, so keep the fetch, the loading
state and the error handling in your own component:

```tsx
import { useEffect, useState } from 'react';
import { AreaChart, runQuery } from 'dashtro/react';

export default function Revenue({ initial }) {
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

For caching, retries and polling, use a data library such as TanStack Query and
pass `runQuery` as the query function.

The query id is the path of the `.sql` file relative to the project root
(for example `src/queries/revenue.sql`).

### The query API

The integration adds `POST /api/dashtro/query` when `output` is not `static`.

```http
POST /api/dashtro/query
content-type: application/json

{ "query": "src/queries/revenue.sql", "params": { "region": "UK" } }
```

```json
{ "data": [{ "day": "2026-09-01", "revenue": 1234.56 }] }
```

`GET /api/dashtro/query` lists every registered query and its parameters. Only
registered queries can run; the endpoint never accepts raw SQL. Change the path
with the `apiPath` option and pass the same value to `runQuery` if you do.

## Configuration

```ts
dashtro({
  database_url: 'duckdb:./data/analytics.duckdb',
  queriesDir: 'src/queries',
  apiPath: '/api/dashtro/query',
  readOnly: true,
  poolSize: 4,
});
```

| Option | Default | Description |
| --- | --- | --- |
| `database_url` | - | Required. `duckdb:<path>`, `duckdb::memory:`, `postgres://...`, or a bare path (treated as DuckDB). |
| `queriesDir` | `<srcDir>/queries` | Directory scanned to register queries for the API. Must be inside the project root. |
| `apiPath` | `/api/dashtro/query` | Path of the query endpoint. |
| `readOnly` | `true` | Open DuckDB files read-only. |
| `poolSize` | `4` | Maximum Postgres pool connections. |
| `react` / `mdx` | `true` | Set to `false` to stop dashtro from adding those integrations. |

`DASHTRO_DATABASE_URL` or `DATABASE_URL` are used when `database_url` is omitted.

### Styling

Dashtro's charts are built on EvilCharts and use Tailwind classes and the shadcn
naming convention (`--card`, `--muted-foreground`, `--chart-1` ... `--chart-5`).

**Tailwind v4 is required.** Install `tailwindcss` and `@tailwindcss/vite`, add
the plugin to `astro.config.mjs`, then import the two stylesheets once in your
layout:

```css
/* src/styles/global.css */
@import "tailwindcss";
@import "dashtro/styles.css";
```

`dashtro/styles.css` does two things:

1. Adds the `@source` rules that let Tailwind scan dashtro's components.
2. Provides default values for the shadcn and chart colours.

Every default is a fallback, so you do not need a theme to get started. To
match an existing theme, define the variables in `:root` and they win:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --border: oklch(0.922 0 0);
  --chart-1: #3245ff;
  --chart-2: #b845ed;
  --chart-3: #ed254e;
  --chart-4: #f9dc5c;
  --chart-5: #c2eabd;
  --radius: 0.625rem;
}
```

If you use a Tailwind v3 setup (`tailwind.config.js` and `@tailwind`
directives), the `@source` rules do nothing and the chart classes are not
generated. Upgrade to Tailwind v4.

## Example app

`example/` is a working Astro app with two dashboards over real, public data:
the Stack Exchange Developer Survey 2025 and The Simpsons episode dataset.

```bash
pnpm install
pnpm --filter dashtro-example seed   # downloads the data, creates example/data/analytics.duckdb
pnpm --filter dashtro-example dev
```

It demonstrates SSR charts, an MDX dashboard page, a parameterised query reused
with different values, a select filter, two number-range sliders, and the query
API. The seed script needs network access on the first run.

## Development

```bash
pnpm install
pnpm build       # compile the package into dist/
pnpm test        # vitest unit tests
pnpm typecheck   # tsc --noEmit
```

The package is plain TypeScript compiled with `tsc`. The React chart layer
(including Recharts) is bundled into a single file with esbuild, so that
`react` and `react-dom` are the only external peers. The `.astro` chart
components and `styles.css` are copied into `dist/` by
`scripts/copy-static.mjs`.

## Architecture

```
src/
  index.ts            # package entry: integration + JS exports
  integration.ts      # Astro integration
  vite-plugin.ts      # .sql transform + virtual modules
  runtime/            # query parsing, binding, database adapters, registry
  routes/query.ts     # the query API endpoint
  react/
    charts/           # one thin component per chart type
    evilcharts/       # vendored EvilCharts registry (Recharts + motion)
    frame.tsx         # shared Card header / empty state
    series.ts         # series normalisation + axis helpers
    format.ts         # number formatting
    filters.ts        # chart filter comparison + numeric domain (no React)
    filter-controls.tsx # filter hook + built-in controls
    evil-config.ts    # map Dashtro props to the EvilCharts config
    slider.tsx        # vendored shadcn/ui slider (@base-ui/react)
  client/             # framework-agnostic fetch helper (runQuery)
```

Data loading and chart rendering are separate:

```
page:    const data = await revenue.run({ region: 'UK' })
chart:   <AreaChart client:load data={data} x="day" series={['revenue']} />
         └─ EvilCharts -> Recharts
```

The chart component is vendor markup, parameterised by `data`, `x` and
`series`. It is a plain React component; you run the query and add the
`client:*` directive. There is no central chart registry, so adding a type means
adding one React component and one export.

Two virtual modules connect the integration to the runtime:

- `virtual:dashtro/config` - resolved configuration, inlined into the server bundle.
- `virtual:dashtro/queries` - a glob that loads every query for the API endpoint.

## Limitations

- No visual editor, authentication, semantic model, query builder, migrations,
  or cross-database SQL portability.
- The chart library is intentionally small. For anything else, write a React
  component with Recharts and render it as an island.
- Parameter types come from front matter. Dashtro does not generate types from
  the database schema yet.
- The Postgres adapter is implemented. It converts `int8` and `numeric`
  values to numbers. The Postgres integration tests run only when
  `DASHTRO_TEST_POSTGRES_URL` is set.
