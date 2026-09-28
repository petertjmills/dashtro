---
title: The query object
description: What a .sql import returns.
sidebar:
  order: 5
---

Every `.sql` import returns a query object.

```ts
import sales from '@/queries/sales.sql';

const rows = await sales.run({ region: 'UK' });
```

## Members

| Member | Type | Description |
| --- | --- | --- |
| `id` | `string` | Stable id, relative to the project root. For example `src/queries/sales.sql`. |
| `path` | `string` | Same as `id`. |
| `sql` | `string` | The SQL body, without front matter. |
| `params` | `ParamDefinition[]` | The parameter definitions. |
| `run(input?, options?)` | `Promise<Row[]>` | Run the query. |
| `definition()` | `QueryDefinition` | A JSON-serialisable description. Used by the API endpoint. |

## `run`

```ts
const rows = await sales.run({ region: 'UK' });
```

`run` validates and coerces the input, then binds it into the SQL. A missing
required parameter throws `DashtroParamError` before the database is touched.

The optional second argument accepts a database override. It is mostly useful
in tests:

```ts
await sales.run({ region: 'UK' }, { database: myTestDatabase });
```

## `ParamDefinition`

```ts
type ParamDefinition = {
  name: string;                 // without the leading colon
  type: 'string' | 'integer' | 'number' | 'boolean' | 'date' | 'datetime' | 'json' | 'any';
  array: boolean;               // true when the type ended in []
  nullable: boolean;            // true when the name ended in ?
};
```

## `definition`

```ts
type QueryDefinition = {
  id: string;
  path: string;
  sql: string;
  params: ParamDefinition[];
};
```

`GET /api/dashtro/query` returns the definitions of every registered query.

## Related

- [SQL front matter](/reference/sql-frontmatter/)
- [The query API](/reference/query-api/)
