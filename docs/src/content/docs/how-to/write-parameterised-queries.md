---
title: Write parameterised queries
description: Declare parameters in front matter and bind values in the SQL body.
sidebar:
  order: 2
---

A `.sql` file can declare parameters in a front matter block. Use `:name` in the
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

## Declare the types

| Syntax | Meaning |
| --- | --- |
| `name: type` | Required parameter. |
| `name?: type` | Nullable parameter. A missing value becomes `null`. |
| `type[]` | Array parameter. |

The available types are `string`, `integer`, `number`, `boolean`, `date`,
`datetime`, `json` and `any`.

A parameter that appears in the body but not in the front matter defaults to
`any` and is required.

## Bind the values

```ts
import sales from '@/queries/sales.sql';

const rows = await sales.run({
  region: 'UK',
  from: '2026-01-01',
  tags: ['web', 'api'],
});
```

`run()` validates and coerces the values before it touches the database, so a
missing required parameter throws before any query runs.

## Call the same query with different values

The query object is reusable. Run it once per value:

```ts
const uk = await sales.run({ region: 'UK' });
const us = await sales.run({ region: 'US' });
```

## Note

Placeholders inside strings, quoted identifiers, comments, Postgres casts
(`::type`) and dollar-quoted strings are ignored. Dashtro rewrites each real
`:name` to `?` (DuckDB) or `$1`, `$2`, ... (Postgres) and binds values
positionally.

## Related

- [SQL front matter reference](/reference/sql-frontmatter/)
- [The query object](/reference/query-object/)
