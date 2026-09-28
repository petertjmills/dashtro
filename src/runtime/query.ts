import { compileSql, parseSqlSource } from './params.js';
import { getDatabase, resolveConfig } from './database.js';
import { registerQuery } from './registry.js';
import type { DashtroQuery, ParamDefinition, QueryDefinition, QueryRunOptions, Row } from './types.js';

export interface CreateQueryInput {
  /** Stable id, normally the path of the `.sql` file relative to the project root. */
  id: string;
  /** Optional human-readable path. Defaults to {@link id}. */
  path?: string;
  /** The SQL source, including optional front matter. */
  sql: string;
  /** Pre-parsed parameter definitions. Parsed from the SQL when omitted. */
  params?: ParamDefinition[];
}

/**
 * Build a runnable query object. The dashtro Vite plugin calls this for every
 * imported `.sql` file.
 */
export function createQuery<
  Input extends Record<string, unknown> = Record<string, unknown>,
  Output extends Row = Row,
>(input: CreateQueryInput): DashtroQuery<Input, Output> {
  const parsed = parseSqlSource(input.sql);
  const params = input.params ?? parsed.params;
  const path = input.path ?? input.id;
  const sql = parsed.sql;

  const query: DashtroQuery<Input, Output> = {
    id: input.id,
    path,
    sql,
    params,
    async run(runInput = {} as Input, options: QueryRunOptions = {}): Promise<Output[]> {
      const database = options.database;
      const dialect = database?.dialect ?? (await resolveConfig()).dialect;
      const { text, values } = compileSql(sql, dialect, runInput, params);
      const target = database ?? (await getDatabase());
      return (await target.query(text, values)) as Output[];
    },
    definition(): QueryDefinition {
      return { id: input.id, path, sql, params };
    },
  };

  registerQuery(query);
  return query;
}
