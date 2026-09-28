import { beforeEach, describe, expect, it } from 'vitest';

import { createQuery } from '../src/runtime/query.js';
import { clearRegistry, getQuery, listQueries } from '../src/runtime/registry.js';
import { DashtroParamError } from '../src/runtime/params.js';
import type { Database, Row } from '../src/runtime/types.js';

interface Call {
  text: string;
  values: unknown[];
}

function fakeDatabase(dialect: Database['dialect'], rows: Row[] = []): Database & { calls: Call[] } {
  const calls: Call[] = [];
  return {
    dialect,
    calls,
    async query(text, values) {
      calls.push({ text, values });
      return rows;
    },
    async close() {},
  };
}

describe('createQuery', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('registers itself and exposes a definition', () => {
    const query = createQuery({
      id: 'src/queries/sales.sql',
      sql: `---\nregion: string\n---\nselect * from sales where region = :region`,
    });

    expect(query.id).toBe('src/queries/sales.sql');
    expect(query.params).toEqual([
      { name: 'region', type: 'string', array: false, nullable: false },
    ]);
    expect(getQuery('src/queries/sales.sql')).toBe(query);
    expect(listQueries()).toHaveLength(1);
    expect(query.definition().sql).toBe('select * from sales where region = :region');
  });

  it('runs the query against the supplied database', async () => {
    const database = fakeDatabase('postgres', [{ total: 42 }]);
    const query = createQuery({ id: 'q.sql', sql: 'select count(*) as total from t where a = :a' });

    const rows = await query.run({ a: 1 }, { database });

    expect(rows).toEqual([{ total: 42 }]);
    expect(database.calls).toEqual([{ text: 'select count(*) as total from t where a = $1', values: [1] }]);
  });

  it('uses DuckDB placeholders when the database dialect is duckdb', async () => {
    const database = fakeDatabase('duckdb');
    const query = createQuery({ id: 'q.sql', sql: 'select * from t where a = :a' });

    await query.run({ a: 'x' }, { database });

    expect(database.calls[0]).toEqual({ text: 'select * from t where a = ?', values: ['x'] });
  });

  it('keeps parameters passed by the Vite transform, including nullable ones', async () => {
    const database = fakeDatabase('duckdb');
    const query = createQuery({
      id: 'q.sql',
      sql: 'select * from t where d >= :days',
      params: [{ name: 'days', type: 'integer', array: false, nullable: true }],
    });

    await query.run({}, { database });

    expect(database.calls[0]).toEqual({ text: 'select * from t where d >= ?', values: [null] });
  });

  it('throws for missing required parameters before hitting the database', async () => {
    const database = fakeDatabase('duckdb');
    const query = createQuery({ id: 'q.sql', sql: 'select * from t where a = :a' });

    await expect(query.run({}, { database })).rejects.toThrow(DashtroParamError);
    expect(database.calls).toHaveLength(0);
  });
});
