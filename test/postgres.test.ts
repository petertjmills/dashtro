import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getDatabase, resetDatabase, setDatabaseConfig } from '../src/runtime/database.js';

// The test runs only when a Postgres server is available. Point
// DASHTRO_TEST_POSTGRES_URL at a scratch database, for example:
//
//   DASHTRO_TEST_POSTGRES_URL=postgres://postgres@127.0.0.1:5432/dashtro_test pnpm test
//
// The test creates tables in that database and drops them again.
const url = process.env.DASHTRO_TEST_POSTGRES_URL ?? '';

let available = url !== '';
if (available) {
  try {
    await import('pg');
  } catch {
    available = false;
  }
}

describe.skipIf(!available)('Postgres adapter', () => {
  beforeAll(async () => {
    // One connection, so the temporary tables stay visible across queries.
    setDatabaseConfig({
      rootDir: process.cwd(),
      databaseUrl: url,
      dialect: 'postgres',
      apiPath: '/api/dashtro/query',
      queriesDir: process.cwd(),
      readOnly: false,
      poolSize: 1,
    });
    resetDatabase();
  });

  afterAll(() => {
    setDatabaseConfig(null);
  });

  it('runs queries and normalises int8 and numeric', async () => {
    const database = await getDatabase();
    await database.query('create temporary table numbers (n integer, amount numeric(10, 2))', []);
    await database.query('insert into numbers values ($1, $2), ($3, $4), ($5, $6)', [
      1, '1.25', 2, '2.50', 3, '3.25',
    ]);

    const rows = await database.query(
      'select count(*) as count, sum(n) as total, sum(amount) as amount from numbers',
      [],
    );

    // count() is int8 and sum(numeric) is numeric; both must be numbers.
    expect(rows).toEqual([{ count: 3, total: 6, amount: 7 }]);
  });

  it('binds array parameters', async () => {
    const database = await getDatabase();
    await database.query('create temporary table items (name text, tags text[])', []);
    await database.query('insert into items values ($1, $2)', ['a', ['x', 'y']]);

    const rows = await database.query('select name from items where tags = $1', [['x', 'y']]);
    expect(rows).toEqual([{ name: 'a' }]);
  });
});
