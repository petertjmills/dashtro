import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getDatabase, resetDatabase, setDatabaseConfig } from '../src/runtime/database.js';

let available = true;
try {
  await import('@duckdb/node-api');
} catch {
  available = false;
}

describe.skipIf(!available)('DuckDB adapter', () => {
  beforeAll(() => {
    setDatabaseConfig({
      rootDir: process.cwd(),
      databaseUrl: 'duckdb::memory:',
      dialect: 'duckdb',
      apiPath: '/api/dashtro/query',
      queriesDir: process.cwd(),
      readOnly: false,
      poolSize: 4,
    });
    resetDatabase();
  });

  afterAll(() => {
    setDatabaseConfig(null);
  });

  it('runs queries and normalises bigints', async () => {
    const database = await getDatabase();
    await database.query('create table numbers (n integer)', []);
    await database.query('insert into numbers values (?), (?), (?)', [1, 2, 3]);

    const rows = await database.query(
      'select count(*) as count, sum(n) as total, avg(n) as average from numbers',
      [],
    );

    // count() and sum(integer) are BIGINT, which must not remain a bigint.
    expect(rows).toEqual([{ count: 3, total: 6, average: 2 }]);
  });

  it('binds array parameters', async () => {
    const database = await getDatabase();
    await database.query('create table items (name varchar, tags varchar[])', []);
    await database.query('insert into items values (?, ?)', ['a', ['x', 'y']]);

    const rows = await database.query('select name from items where tags = ?', [['x', 'y']]);
    expect(rows).toEqual([{ name: 'a' }]);
  });
});
