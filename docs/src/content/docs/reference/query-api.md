---
title: The query API
description: The POST and GET endpoints the integration registers.
sidebar:
  order: 6
---

When `output` is not `static`, the integration adds an endpoint at
`/api/dashtro/query`. Only registered queries run. The endpoint never accepts
raw SQL.

## POST

```http
POST /api/dashtro/query
content-type: application/json

{ "query": "src/queries/revenue.sql", "params": { "region": "UK" } }
```

```json
{ "data": [{ "day": "2026-09-01", "revenue": 1234.56 }] }
```

The body is the query id and a params object. The response is `{ data: Row[] }`.

## GET

```http
GET /api/dashtro/query
```

Returns every registered query and its parameters:

```json
{
  "queries": [
    {
      "id": "src/queries/revenue.sql",
      "path": "src/queries/revenue.sql",
      "sql": "select day, sum(amount) as revenue from orders group by day",
      "params": []
    }
  ]
}
```

## Errors

A failed request returns a non-2xx status and a JSON body with an `error` field:

```json
{ "error": "Missing required parameter: region" }
```

`runQuery` turns this into a `DashtroRequestError` with the `status` on the
error.

## Change the path

Set `apiPath` in the integration options. Pass the same value to `runQuery` so
the client uses the new path.

## Related

- [runQuery reference](/reference/client/)
- [Fetch data in the browser](/how-to/fetch-data-in-the-browser/)
