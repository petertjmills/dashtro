---
title: Connect to Postgres
description: Point Dashtro at a Postgres database instead of DuckDB.
sidebar:
  order: 1
---

Dashtro selects the adapter from the `database_url`.

## 1. Install the driver

```bash
pnpm add pg
```

## 2. Change the URL

```js
dashtro({
  database_url: 'postgres://user:password@localhost:5432/analytics',
});
```

Dashtro accepts `postgres://` and `postgresql://`.

## 3. Write portable SQL

Dashtro rewrites each `:name` placeholder to `$1`, `$2`, ... for Postgres, and
to `?` for DuckDB. The rest of the SQL is not translated. Avoid dialect-specific
syntax if you may switch engines later.

```sql
---
region: string
---
select day, sum(amount) as revenue
from orders
where region = :region
group by day
order by day
```

## 4. Tune the pool

```js
dashtro({
  database_url: 'postgres://...',
  poolSize: 8,
});
```

`poolSize` defaults to `4`. It is ignored for DuckDB.

## Related

- [Configuration reference](/reference/configuration/)
- [Write parameterised queries](/how-to/write-parameterised-queries/)
