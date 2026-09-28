import { describe, expect, it } from 'vitest';

import {
  DashtroParamError,
  compileSql,
  findParams,
  parseSqlSource,
} from '../src/runtime/params.js';

describe('findParams', () => {
  it('finds named parameters in order and removes duplicates', () => {
    expect(findParams('select * from t where a = :a and b = :b and c = :a')).toEqual(['a', 'b']);
  });

  it('ignores parameters inside strings, identifiers and comments', () => {
    const sql = `
      -- :line_comment
      select ':not_a_param' as value, ":also_not" as other /* :block_comment */
      from t where real = :real and casted = value::text
    `;
    expect(findParams(sql)).toEqual(['real']);
  });

  it('ignores dollar-quoted strings', () => {
    expect(findParams(`select $tag$ :nope $tag$ where a = :yes`)).toEqual(['yes']);
  });
});

describe('parseSqlSource', () => {
  it('reads front matter types, nullability and arrays', () => {
    const source = `---
region: string
from?: date
tags?: string[]
---
select * from sales where region = :region and day >= :from and tag = any(:tags)`;

    const parsed = parseSqlSource(source);

    expect(parsed.sql.startsWith('select * from sales')).toBe(true);
    expect(parsed.params).toEqual([
      { name: 'region', type: 'string', array: false, nullable: false },
      { name: 'from', type: 'date', array: false, nullable: true },
      { name: 'tags', type: 'string', array: true, nullable: true },
    ]);
  });

  it('defaults undeclared parameters to any and non-nullable', () => {
    const parsed = parseSqlSource('select * from t where a = :a');

    expect(parsed.params).toEqual([
      { name: 'a', type: 'any', array: false, nullable: false },
    ]);
  });
});

describe('compileSql', () => {
  it('binds DuckDB positional parameters', () => {
    const { text, values } = compileSql(
      'select * from t where a = :a and b = :b',
      'duckdb',
      { a: 1, b: 'x' },
      [],
    );

    expect(text).toBe('select * from t where a = ? and b = ?');
    expect(values).toEqual([1, 'x']);
  });

  it('binds Postgres numbered parameters', () => {
    const { text, values } = compileSql(
      'select * from t where a = :a and b = :b',
      'postgres',
      { a: 1, b: 'x' },
      [],
    );

    expect(text).toBe('select * from t where a = $1 and b = $2');
    expect(values).toEqual([1, 'x']);
  });

  it('binds a repeated parameter once per occurrence', () => {
    const { text, values } = compileSql(
      'select * from t where a = :a or b = :a',
      'postgres',
      { a: 'x' },
      [],
    );

    expect(text).toBe('select * from t where a = $1 or b = $2');
    expect(values).toEqual(['x', 'x']);
  });

  it('throws when a required parameter is missing', () => {
    expect(() =>
      compileSql('select * from t where a = :a', 'duckdb', {}, [
        { name: 'a', type: 'string', array: false, nullable: false },
      ]),
    ).toThrow(DashtroParamError);
  });

  it('passes null for missing nullable parameters', () => {
    const { values } = compileSql('select * from t where a = :a', 'duckdb', {}, [
      { name: 'a', type: 'string', array: false, nullable: true },
    ]);

    expect(values).toEqual([null]);
  });

  it('coerces integers and rejects bad values', () => {
    expect(
      compileSql('select :n', 'duckdb', { n: '7' }, [
        { name: 'n', type: 'integer', array: false, nullable: false },
      ]).values,
    ).toEqual([7]);

    expect(() =>
      compileSql('select :n', 'duckdb', { n: 'abc' }, [
        { name: 'n', type: 'integer', array: false, nullable: false },
      ]),
    ).toThrow(DashtroParamError);
  });

  it('coerces arrays element by element', () => {
    const { values } = compileSql('select :ids', 'duckdb', { ids: ['1', 2] }, [
      { name: 'ids', type: 'integer', array: true, nullable: false },
    ]);

    expect(values).toEqual([[1, 2]]);
  });
});
