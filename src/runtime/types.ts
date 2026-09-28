/**
 * Core types shared across the dashtro runtime, integration and chart layer.
 */

/** Value types that a SQL parameter can be declared as. */
export type ParamType =
  | 'string'
  | 'integer'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'json'
  | 'any';

/** A single row returned by a query. Databases return a record of column -> value. */
export type Row = Record<string, unknown>;

/** The SQL dialects dashtro knows how to bind parameters for. */
export type Dialect = 'duckdb' | 'postgres';

/** A parameter declared in the front matter of a `.sql` file and used as `:name` in the body. */
export interface ParamDefinition {
  /** Parameter name, without the leading colon. */
  name: string;
  /** Declared type. Defaults to `any`. */
  type: ParamType;
  /** True when the declared type ends in `[]`. */
  array: boolean;
  /** True when the front matter key ends in `?`. A nullable parameter accepts `null`/`undefined`. */
  nullable: boolean;
}

/** The result of parsing a `.sql` file: the SQL body plus its parameter definitions. */
export interface ParsedSql {
  /** SQL body with front matter removed and `:name` placeholders intact. */
  sql: string;
  /** Parameter definitions, in the order they first appear in the SQL body. */
  params: ParamDefinition[];
}

/** Resolved dashtro configuration embedded into the server bundle at build time. */
export interface DashtroResolvedConfig {
  /** Absolute path to the Astro project root. */
  rootDir: string;
  /** Original database URL. */
  databaseUrl: string;
  /** Dialect derived from the database URL. */
  dialect: Dialect;
  /** URL path of the query API endpoint. */
  apiPath: string;
  /** Absolute path of the directory that is scanned for `.sql` queries. */
  queriesDir: string;
  /** Ask DuckDB to open the database file read-only. */
  readOnly: boolean;
  /** Maximum number of pooled Postgres connections. */
  poolSize: number;
}

/** A runnable SQL query. `createQuery` produces these; `.sql` imports export one as their default. */
export interface DashtroQuery<Input extends Record<string, unknown> = Record<string, unknown>, Output extends Row = Row> {
  /** Stable id, relative to the project root (for example `src/queries/sales.sql`). */
  readonly id: string;
  /** Same value as {@link id}. Kept for readability. */
  readonly path: string;
  /** SQL body with front matter removed. */
  readonly sql: string;
  /** Parameter definitions parsed from front matter and the SQL body. */
  readonly params: ParamDefinition[];
  /** Run the query and return its rows. */
  run(input?: Input, options?: QueryRunOptions): Promise<Output[]>;
  /** A JSON-serialisable description of the query. Used by the API endpoint. */
  definition(): QueryDefinition;
}

/** A JSON-serialisable description of a query. */
export interface QueryDefinition {
  id: string;
  path: string;
  sql: string;
  params: ParamDefinition[];
}

/** Options accepted by {@link DashtroQuery.run}. */
export interface QueryRunOptions {
  /** Override the database used for this query. Mostly useful in tests. */
  database?: Database;
}

/** Minimal database abstraction implemented by the DuckDB and Postgres adapters. */
export interface Database {
  /** The dialect this database speaks. */
  readonly dialect: Dialect;
  /** Run a query with positional parameters and return rows as plain objects. */
  query(text: string, values: unknown[]): Promise<Row[]>;
  /** Release any pooled resources. */
  close(): Promise<void>;
}
