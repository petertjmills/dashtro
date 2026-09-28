import type { Row } from '../runtime/types.js';

/** Thrown when the query API returns a non-2xx response. */
export class DashtroRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'DashtroRequestError';
    this.status = status;
  }
}

export interface RunQueryOptions {
  /** Override the query API path. Defaults to `/api/dashtro/query`. */
  apiPath?: string;
  /** Abort signal for cancelling the request. */
  signal?: AbortSignal;
  /** Custom fetch implementation. Mostly useful in tests. */
  fetch?: typeof globalThis.fetch;
}

/**
 * Run a registered query through the dashtro API endpoint. Use this from client
 * code to refresh data or apply filters without reloading the page.
 *
 * ```ts
 * const rows = await runQuery('src/queries/sales.sql', { region: 'UK' });
 * ```
 */
export async function runQuery<T extends Row = Row>(
  id: string,
  params: Record<string, unknown> = {},
  options: RunQueryOptions = {},
): Promise<T[]> {
  const fetchImpl = options.fetch ?? globalThis.fetch;

  if (!fetchImpl) {
    throw new Error('Dashtro: global fetch is not available. Pass a fetch implementation in options.');
  }

  const response = await fetchImpl(options.apiPath ?? '/api/dashtro/query', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: id, params }),
    signal: options.signal,
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // The body may be empty or not JSON. The status check below handles it.
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : `Query request failed with status ${response.status}.`;
    throw new DashtroRequestError(message, response.status);
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T[] }).data;
  }

  return [];
}
