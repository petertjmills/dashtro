import { parse as parseYaml } from 'yaml';

import type { Dialect, ParamDefinition, ParamType, ParsedSql } from './types.js';

const PARAM_NAME = /^[A-Za-z_][A-Za-z0-9_]*/;
const DOLLAR_QUOTE = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/;
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

const PARAM_TYPES = new Set<ParamType>([
  'string',
  'integer',
  'number',
  'boolean',
  'date',
  'datetime',
  'json',
  'any',
]);

/** Thrown when a parameter is missing or cannot be coerced to its declared type. */
export class DashtroParamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DashtroParamError';
  }
}

interface ParamHit {
  name: string;
  /** Index of the leading colon. */
  start: number;
  /** Index just after the parameter name. */
  end: number;
}

/**
 * Find every `:name` placeholder in a SQL string while ignoring placeholders that
 * appear inside strings, quoted identifiers, comments, Postgres casts (`::type`)
 * or dollar-quoted strings.
 */
export function findParamHits(sql: string): ParamHit[] {
  const hits: ParamHit[] = [];
  const n = sql.length;
  let i = 0;

  while (i < n) {
    const ch = sql[i];

    if (ch === '-' && sql[i + 1] === '-') {
      i = skipLineComment(sql, i);
      continue;
    }
    if (ch === '/' && sql[i + 1] === '*') {
      i = skipBlockComment(sql, i);
      continue;
    }
    if (ch === "'" || ch === '"') {
      i = skipQuoted(sql, i, ch);
      continue;
    }
    if (ch === '$') {
      const after = skipDollarQuoted(sql, i);
      if (after !== -1) {
        i = after;
        continue;
      }
    }
    if (ch === ':') {
      // `::type` is a cast, not a parameter.
      if (sql[i + 1] === ':') {
        i += 2;
        continue;
      }
      const match = PARAM_NAME.exec(sql.slice(i + 1));
      if (match) {
        hits.push({ name: match[0], start: i, end: i + 1 + match[0].length });
        i += 1 + match[0].length;
        continue;
      }
    }

    i += 1;
  }

  return hits;
}

/** Names of the `:name` placeholders used by a SQL string, in order of first appearance. */
export function findParams(sql: string): string[] {
  return [...new Set(findParamHits(sql).map((hit) => hit.name))];
}

/**
 * Parse a `.sql` file into its SQL body and parameter definitions.
 *
 * Front matter is optional and uses the same shape as requel:
 *
 * ```sql
 * ---
 * region: string
 * from?: date
 * tags?: string[]
 * ---
 * select * from sales where region = :region
 * ```
 *
 * A key ending in `?` marks the parameter nullable. A type ending in `[]` marks it
 * as an array. Parameters found in the body but not declared in front matter fall
 * back to the `any` type.
 */
export function parseSqlSource(source: string): ParsedSql {
  let body = stripBom(source);
  let declared: ParamDefinition[] = [];

  const frontMatter = FRONT_MATTER.exec(body);
  if (frontMatter) {
    declared = parseParamBlock(parseFrontMatterData(frontMatter[1] ?? ''));
    body = body.slice(frontMatter[0].length);
  }

  const byName = new Map(declared.map((param) => [param.name, param]));
  const params: ParamDefinition[] = [];

  for (const name of findParams(body)) {
    params.push(
      byName.get(name) ?? {
        name,
        type: 'any',
        array: false,
        nullable: false,
      },
    );
  }

  return { sql: body.trim(), params };
}

/**
 * Replace `:name` placeholders with dialect placeholders and build the positional
 * value list. DuckDB uses `?`; Postgres uses `$1`, `$2`, ... Every occurrence gets
 * its own value, so a parameter used twice is passed twice.
 */
export function compileSql(
  sql: string,
  dialect: Dialect,
  input: Record<string, unknown>,
  params: ParamDefinition[],
): { text: string; values: unknown[] } {
  const hits = findParamHits(sql);
  if (hits.length === 0) {
    return { text: sql, values: [] };
  }

  const byName = new Map(params.map((param) => [param.name, param]));
  const values: unknown[] = [];
  let text = '';
  let cursor = 0;

  for (const hit of hits) {
    text += sql.slice(cursor, hit.start);
    const definition =
      byName.get(hit.name) ?? ({ name: hit.name, type: 'any', array: false, nullable: false } satisfies ParamDefinition);
    values.push(coerceParam(hit.name, input[hit.name], definition));
    text += dialect === 'postgres' ? `$${values.length}` : '?';
    cursor = hit.end;
  }

  text += sql.slice(cursor);
  return { text, values };
}

function parseFrontMatterData(raw: string): Record<string, unknown> {
  const data = parseYaml(raw);
  if (data === null || data === undefined) {
    return {};
  }
  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new DashtroParamError('Dashtro: SQL front matter must be a YAML mapping of parameter names to types.');
  }
  return data as Record<string, unknown>;
}

function parseParamBlock(data: Record<string, unknown>): ParamDefinition[] {
  const params: ParamDefinition[] = [];

  for (const [rawKey, rawValue] of Object.entries(data)) {
    let name = rawKey.trim();
    let nullable = false;

    if (name.endsWith('?')) {
      nullable = true;
      name = name.slice(0, -1);
    }

    let rawType = String(rawValue ?? 'any').trim();
    let array = false;

    if (rawType.endsWith('[]')) {
      array = true;
      rawType = rawType.slice(0, -2).trim();
    }
    if (rawType.endsWith('?')) {
      nullable = true;
      rawType = rawType.slice(0, -1).trim();
    }

    const type = (PARAM_TYPES.has(rawType as ParamType) ? rawType : 'any') as ParamType;

    if (!name) {
      throw new DashtroParamError('Dashtro: SQL front matter contains an empty parameter name.');
    }

    params.push({ name, type, array, nullable });
  }

  return params;
}

function coerceParam(name: string, value: unknown, definition: ParamDefinition): unknown {
  if (value === undefined || value === null) {
    if (definition.nullable) {
      return null;
    }
    throw new DashtroParamError(
      `Dashtro: missing required query parameter ":${name}". Pass it to run(), or mark it nullable in the SQL front matter ("${name}?: <type>").`,
    );
  }

  if (definition.array) {
    const list = Array.isArray(value) ? value : [value];
    return list.map((item) => coerceScalar(name, item, definition.type));
  }

  return coerceScalar(name, value, definition.type);
}

function coerceScalar(name: string, value: unknown, type: ParamType): unknown {
  switch (type) {
    case 'integer': {
      const num = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(num) || !Number.isInteger(num)) {
        throw new DashtroParamError(`Dashtro: parameter ":${name}" must be an integer, received ${JSON.stringify(value)}.`);
      }
      return num;
    }
    case 'number': {
      const num = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(num)) {
        throw new DashtroParamError(`Dashtro: parameter ":${name}" must be a number, received ${JSON.stringify(value)}.`);
      }
      return num;
    }
    case 'boolean': {
      if (typeof value === 'boolean') {
        return value;
      }
      if (value === 'true' || value === '1' || value === 1) {
        return true;
      }
      if (value === 'false' || value === '0' || value === 0) {
        return false;
      }
      throw new DashtroParamError(`Dashtro: parameter ":${name}" must be a boolean, received ${JSON.stringify(value)}.`);
    }
    case 'json':
      return typeof value === 'string' ? value : JSON.stringify(value);
    case 'string':
      return String(value);
    case 'date':
    case 'datetime':
    case 'any':
    default:
      return value;
  }
}

function stripBom(value: string): string {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

function skipLineComment(sql: string, start: number): number {
  const end = sql.indexOf('\n', start);
  return end === -1 ? sql.length : end + 1;
}

function skipBlockComment(sql: string, start: number): number {
  const end = sql.indexOf('*/', start + 2);
  return end === -1 ? sql.length : end + 2;
}

function skipQuoted(sql: string, start: number, quote: string): number {
  let i = start + 1;
  while (i < sql.length) {
    if (sql[i] === quote) {
      if (sql[i + 1] === quote) {
        i += 2;
        continue;
      }
      return i + 1;
    }
    i += 1;
  }
  return sql.length;
}

function skipDollarQuoted(sql: string, start: number): number {
  const match = DOLLAR_QUOTE.exec(sql.slice(start));
  if (!match) {
    return -1;
  }
  const tag = match[0];
  const end = sql.indexOf(tag, start + tag.length);
  return end === -1 ? sql.length : end + tag.length;
}
