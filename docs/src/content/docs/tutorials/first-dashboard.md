---
title: Build your first dashboard
description: Create an Astro project, connect DuckDB, write a query and render a chart.
sidebar:
  order: 1
---

This tutorial builds a one-chart dashboard from an empty directory. You need
Node.js 22 and pnpm. It takes about fifteen minutes.

## 1. Create the Astro project

```bash
pnpm create astro@latest my-dashboard
cd my-dashboard
```

Choose the empty template and accept the defaults.

## 2. Add a server adapter

Dashtro can run SQL at request time, so the app needs server rendering.

```bash
pnpm astro add node
```

Accept the standalone mode.

## 3. Install Dashtro and its peers

```bash
pnpm add dashtro @astrojs/react @astrojs/mdx react react-dom
pnpm add @duckdb/node-api
pnpm add -D tailwindcss @tailwindcss/vite
```

`@astrojs/react`, `@astrojs/mdx` and the database connector are peer
dependencies. Dashtro adds the React and MDX integrations for you, but the
packages must be installed. Use `pg` instead of `@duckdb/node-api` for Postgres.

## 4. Configure Astro

Replace `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import dashtro from 'dashtro';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    dashtro({ database_url: 'duckdb:./data/analytics.duckdb' }),
  ],
});
```

## 5. Add the stylesheet and a layout

Create `src/styles/global.css`:

```css
@import "tailwindcss";
@import "dashtro/styles.css";
```

Create `src/layouts/Layout.astro`:

```astro
---
import '../styles/global.css';
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My dashboard</title>
  </head>
  <body class="bg-background text-foreground">
    <main class="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <slot />
    </main>
  </body>
</html>
```

## 6. Seed a DuckDB database

Create `scripts/seed.mjs`:

```js
import { mkdir } from 'node:fs/promises';

import { DuckDBInstance } from '@duckdb/node-api';

await mkdir('./data', { recursive: true });

const instance = await DuckDBInstance.create('./data/analytics.duckdb');
const connection = await instance.connect();

await connection.run(`
  create or replace table daily_orders as
  select * from (values
    (date '2026-09-01', 'UK', 1240.50),
    (date '2026-09-02', 'UK', 980.00),
    (date '2026-09-03', 'UK', 1520.75),
    (date '2026-09-01', 'US', 2010.00),
    (date '2026-09-02', 'US', 1875.25),
    (date '2026-09-03', 'US', 2230.00)
  ) as t(day, region, amount)
`);

connection.closeSync();
instance.closeSync();

console.log('seeded data/analytics.duckdb');
```

Run it:

```bash
node scripts/seed.mjs
```

## 7. Write a query

Create `src/queries/revenue.sql`:

```sql
select
  day,
  round(sum(amount), 2) as revenue
from daily_orders
group by day
order by day
```

The file has no front matter, so it takes no parameters.

## 8. Render a chart

Replace `src/pages/index.astro`:

```astro
---
import { AreaChart } from 'dashtro/react';
import Layout from '../layouts/Layout.astro';
import revenue from '../queries/revenue.sql';

const data = await revenue.run();
---

<Layout>
  <AreaChart
    client:load
    data={data}
    x="day"
    series={[{ key: 'revenue', label: 'Revenue' }]}
    title="Revenue per day"
    valueFormat={{ style: 'currency', currency: 'GBP' }}
  />
</Layout>
```

## 9. Run it

```bash
pnpm dev
```

Open http://localhost:4321. You should see a card with a line chart.

## What just happened

- The `.sql` import became a query object. `revenue.run()` ran it against
  DuckDB and returned rows.
- The page passed those rows to `AreaChart` as `data`.
- `client:load` told Astro to hydrate the chart in the browser. The chart is
  presentational: it draws the rows and does nothing else.

## Next steps

- [Add a filter to the chart](/tutorials/add-a-filter/) to let the reader pick
  a region.
- Read the [configuration reference](/reference/configuration/) for every
  option.
