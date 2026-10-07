import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

export async function testDb() {
  const pg = new PGlite();
  for (const f of ['db/schema.sql', 'db/seed.sql']) {
    await pg.exec(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'));
  }
  const db = { query: async (text, params = []) => (await pg.query(text, params)).rows };
  globalThis.__testDb = db;
  return db;
}

// A Wednesday 11:00 AM IST
export const NOW = new Date(Date.UTC(2026, 9, 7, 5, 30));

export function fakeRes() {
  const res = { statusCode: 200, body: null, writableEnded: false };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; res.writableEnded = true; return res; };
  return res;
}
