---
title: SQL front matter
description: Parameter types, defaults and the placeholder rules.
sidebar:
  order: 4
---

A `.sql` file may start with a front matter block between `---` lines. The block
declares the types of the parameters used in the body.

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

## Parameter syntax

| Syntax | Meaning |
| --- | --- |
| `name: type` | Required parameter. |
| `name?: type` | Nullable parameter. A missing value becomes `null`. |
| `type[]` | Array parameter. |

## Types

| Type | Notes |
| --- | --- |
| `string` | |
| `integer` | Whole number. |
| `number` | Decimal number. |
| `boolean` | |
| `date` | |
| `datetime` | |
| `json` | |
| `any` | No coercion. |

A parameter that appears in the SQL body but not in the front matter defaults to
`any` and is required.

## Placeholder rules

- Parameters are written as `:name` in the body.
- Dashtro rewrites each real `:name` to `?` for DuckDB and `$1`, `$2`, ... for
  Postgres, and binds values positionally.
- Placeholders are ignored inside strings, quoted identifiers, line and block
  comments, Postgres casts (`::type`) and dollar-quoted strings.
- The order of parameters is the order of first appearance in the body.

## Validation

`run()` validates and coerces each value before it touches the database. A
missing required parameter throws a `DashtroParamError` and no query runs.

## Related

- [Write parameterised queries](/how-to/write-parameterised-queries/)
- [The query object](/reference/query-object/)
