import { isAbsolute, resolve } from 'node:path';

import type { Database, DashtroResolvedConfig, Dialect, Row } from './types.js';

let overrideConfig: DashtroResolvedConfig | null = null;
let cacheKey: string | null = null;
let cache: Promise<Database> | null = null;

/**
 * Override the resolved configuration. The Astro integration normally supplies the
 * configuration through a virtual module; tests can inject one directly.
 */
export function setDatabaseConfig(config: DashtroResolvedConfig | null): void {
  overrideConfig = config;
  resetDatabase();
}

/** Drop the cached database connection. */
export function resetDatabase(): void {
  cacheKey = null;
  cache = null;
}

/** Resolve the configuration injected by the dashtro integration. */
export async function resolveConfig(): Promise<DashtroResolvedConfig> {
  if (overrideConfig) {
    return overrideConfig;
  }

  try {
    const mod = (await import('virtual:dashtro/config')) as {
      default?: DashtroResolvedConfig;
    } & Partial<DashtroResolvedConfig>;
    const config = mod.default ?? (mod as DashtroResolvedConfig);
    if (config && typeof config.databaseUrl === 'string') {
      return config;
    }
  } catch (error) {
    throw new Error(
      'Dashtro: no database configuration found. Add dashtro({ database_url: "duckdb:./data/analytics.duckdb" }) to astro.config.mjs.',
      { cause: error },
    );
  }

  throw new Error(
    'Dashtro: no database configuration found. Add dashtro({ database_url: "duckdb:./data/analytics.duckdb" }) to astro.config.mjs.',
  );
}

/**
 * Split a database URL into a dialect and a connection target.
 *
 * Supported forms:
 * - `duckdb:./data/analytics.duckdb`
 * - `duckdb:///absolute/path.duckdb`
 * - `duckdb::memory:`
 * - `postgres://user:pass@host:5432/db`
 * - a bare path, which is treated as DuckDB
 */
export function parseDatabaseUrl(url: string): { dialect: Dialect; target: string } {
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();

  if (lower.startsWith('duckdb://')) {
    return { dialect: 'duckdb', target: trimmed.slice('duckdb://'.length) };
  }
  if (lower.startsWith('duckdb:')) {
    return { dialect: 'duckdb', target: trimmed.slice('duckdb:'.length) };
  }
  if (lower.startsWith('postgres://') || lower.startsWith('postgresql://')) {
    return { dialect: 'postgres', target: trimmed };
  }
  if (lower.startsWith('file:')) {
    return { dialect: 'duckdb', target: trimmed.slice('file:'.length) };
  }

  return { dialect: 'duckdb', target: trimmed };
}

/** Get (and lazily create) the shared database connection. */
export async function getDatabase(config?: DashtroResolvedConfig): Promise<Database> {
  const resolved = config ?? (await resolveConfig());
  const key = `${resolved.dialect}:${resolved.databaseUrl}`;

  if (cache && cacheKey === key) {
    return cache;
  }

  cacheKey = key;
  cache = createDatabase(resolved);
  return cache;
}

async function createDatabase(config: DashtroResolvedConfig): Promise<Database> {
  const { dialect, target } = parseDatabaseUrl(config.databaseUrl);

  if (dialect === 'postgres') {
    return createPostgres(target, config.poolSize);
  }

  return createDuckDB(target, config);
}

async function createDuckDB(target: string, config: DashtroResolvedConfig): Promise<Database> {
  const path = target === ':memory:' || isAbsolute(target) ? target : resolve(config.rootDir, target);

  let api: typeof import('@duckdb/node-api');
  try {
    api = await import('@duckdb/node-api');
  } catch (error) {
    throw new Error(
      'Dashtro: the DuckDB connector is not installed. Run `pnpm add @duckdb/node-api`.',
      { cause: error },
    );
  }

  let instance: import('@duckdb/node-api').DuckDBInstance;
  try {
    instance = await api.DuckDBInstance.create(path, {
      access_mode: config.readOnly ? 'READ_ONLY' : 'READ_WRITE',
    });
  } catch (error) {
    throw new Error(`Dashtro: cannot open DuckDB database at ${path}.`, { cause: error });
  }

  return {
    dialect: 'duckdb',
    async query(text: string, values: unknown[]): Promise<Row[]> {
      const connection = await instance.connect();
      try {
        const duckValues = values.map((value) => toDuckDBValue(api, value));
        const reader = await connection.runAndReadAll(text, duckValues);
        return reader.getRowObjectsJS().map((row) => normalizeRow(row)) as Row[];
      } finally {
        connection.closeSync();
      }
    },
    async close(): Promise<void> {
      instance.closeSync();
    },
  };
}

/**
 * JSON cannot represent `bigint`. DuckDB returns `BIGINT` columns (such as
 * `count(*)` and `sum(int)`) as bigints, so turn safe values into numbers and
 * large ones into strings.
 */
function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    result[key] = normalizeValue(value);
  }
  return result;
}

function normalizeValue(value: unknown): unknown {
  if (typeof value === 'bigint') {
    const asNumber = Number(value);
    return Number.isSafeInteger(asNumber) ? asNumber : value.toString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }
  if (value && typeof value === 'object' && !(value instanceof Date) && !(value instanceof Uint8Array)) {
    return normalizeRow(value as Record<string, unknown>);
  }
  return value;
}

/**
 * Convert a plain JS value into the representation the DuckDB node API expects.
 * Scalars pass through; `Date` and arrays need explicit wrappers.
 */
function toDuckDBValue(
  api: typeof import('@duckdb/node-api'),
  value: unknown,
): import('@duckdb/node-api').DuckDBValue {
  if (value === null || value === undefined) {
    return null;
  }
  if (
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'string'
  ) {
    return value;
  }
  if (value instanceof Date) {
    // DuckDB cannot infer a type for a `DuckDBTimestampValue` bound to an `ANY`
    // parameter. An ISO string is understood by DuckDB's implicit casts.
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return new api.DuckDBListValue(value.map((item) => toDuckDBValue(api, item)));
  }
  if (value instanceof Uint8Array) {
    return new api.DuckDBBlobValue(value);
  }

  return String(value);
}

async function createPostgres(connectionString: string, poolSize: number): Promise<Database> {
  let pg: typeof import('pg');
  try {
    pg = await import('pg');
  } catch (error) {
    throw new Error('Dashtro: the Postgres connector is not installed. Run `pnpm add pg`.', {
      cause: error,
    });
  }

  const Pool = pg.default?.Pool ?? pg.Pool;
  const pool = new Pool({ connectionString, max: poolSize });

  return {
    dialect: 'postgres',
    async query(text: string, values: unknown[]): Promise<Row[]> {
      const result = await pool.query(text, values);
      return result.rows as Row[];
    },
    async close(): Promise<void> {
      await pool.end();
    },
  };
}
