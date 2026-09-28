import type { DashtroQuery } from './types.js';

const registry = new Map<string, DashtroQuery>();
let loaded = false;
let loading: Promise<void> | null = null;
let queryLoader: (() => Promise<void>) | null = null;

/** Add a query to the process-wide registry. Called automatically when a `.sql` module is imported. */
export function registerQuery(query: DashtroQuery): void {
  registry.set(query.id, query);
}

/** Look up a registered query by id. */
export function getQuery(id: string): DashtroQuery | undefined {
  return registry.get(id);
}

/** All registered queries. */
export function listQueries(): DashtroQuery[] {
  return [...registry.values()];
}

/** Remove all registered queries. Used by tests. */
export function clearRegistry(): void {
  registry.clear();
  loaded = false;
  loading = null;
}

/**
 * Replace the loader used by {@link ensureQueriesLoaded} with a custom function.
 * Used by tests. Pass `null` to restore the default behaviour.
 */
export function setQueryLoader(loader: (() => Promise<void>) | null): void {
  queryLoader = loader;
  loaded = false;
  loading = null;
}

/**
 * Make sure every `.sql` file under the configured queries directory has been
 * imported, so the API endpoint can resolve queries that the current page did not
 * import. Outside an Astro/Vite build the virtual module is missing and this is a
 * no-op.
 */
export async function ensureQueriesLoaded(): Promise<void> {
  if (loaded) {
    return;
  }

  if (!loading) {
    loading = (async () => {
      try {
        if (queryLoader) {
          await queryLoader();
        } else {
          const mod = await import('virtual:dashtro/queries');
          await mod.loadAllQueries();
        }
      } catch {
        // Not running inside a dashtro build (for example, unit tests).
      } finally {
        loaded = true;
      }
    })();
  }

  return loading;
}
