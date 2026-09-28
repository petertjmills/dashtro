import type { APIRoute } from 'astro';

import { ensureQueriesLoaded, getQuery, listQueries } from '../runtime/registry.js';

export const prerender = false;

interface QueryRequestBody {
  /** Query id, normally the `.sql` path relative to the project root. */
  query?: unknown;
  /** Alias of {@link query}. */
  id?: unknown;
  /** Values for the query's `:name` parameters. */
  params?: unknown;
}

/** List every registered query and its parameters. Handy for debugging. */
export const GET: APIRoute = async () => {
  await ensureQueriesLoaded();

  return Response.json({
    queries: listQueries().map((query) => query.definition()),
  });
};

/** Run a registered query and return its rows as JSON. */
export const POST: APIRoute = async ({ request }) => {
  await ensureQueriesLoaded();

  let body: QueryRequestBody;
  try {
    body = (await request.json()) as QueryRequestBody;
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const id = typeof body.query === 'string' ? body.query : body.id;
  if (typeof id !== 'string' || id.length === 0) {
    return Response.json({ error: 'Missing query id. Send { "query": "<id>", "params": { ... } }.' }, { status: 400 });
  }

  const query = getQuery(id);
  if (!query) {
    return Response.json({ error: `Unknown query "${id}".` }, { status: 404 });
  }

  const params =
    body.params && typeof body.params === 'object' && !Array.isArray(body.params)
      ? (body.params as Record<string, unknown>)
      : {};

  try {
    const data = await query.run(params);
    return Response.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 400 });
  }
};
