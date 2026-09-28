import { describe, expect, it } from 'vitest';

import { parseDatabaseUrl } from '../src/runtime/database.js';

describe('parseDatabaseUrl', () => {
  it('parses duckdb prefixes', () => {
    expect(parseDatabaseUrl('duckdb:./data/analytics.duckdb')).toEqual({
      dialect: 'duckdb',
      target: './data/analytics.duckdb',
    });
    expect(parseDatabaseUrl('duckdb:///var/lib/analytics.duckdb')).toEqual({
      dialect: 'duckdb',
      target: '/var/lib/analytics.duckdb',
    });
    expect(parseDatabaseUrl('duckdb::memory:')).toEqual({
      dialect: 'duckdb',
      target: ':memory:',
    });
  });

  it('parses postgres URLs', () => {
    expect(parseDatabaseUrl('postgres://user:pass@host:5432/db')).toEqual({
      dialect: 'postgres',
      target: 'postgres://user:pass@host:5432/db',
    });
    expect(parseDatabaseUrl('postgresql://host/db')).toEqual({
      dialect: 'postgres',
      target: 'postgresql://host/db',
    });
  });

  it('treats bare paths as duckdb', () => {
    expect(parseDatabaseUrl('./analytics.duckdb')).toEqual({
      dialect: 'duckdb',
      target: './analytics.duckdb',
    });
  });
});
