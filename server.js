// Local server: runs the same handlers as the deployed functions, plus the two screens.
// Uses Neon when DATABASE_URL is set, otherwise a local test database in ./.data
import http from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
if (existsSync(path.join(root, '.env'))) {
  for (const line of readFileSync(path.join(root, '.env'), 'utf8').split('\n')) {
    const m = /^([A-Z_]+)=(.*)$/.exec(line.trim());
    const v = m && m[2].replace(/^(["'])(.*)\1$/, '$2');
    if (m && v && !process.env[m[1]]) process.env[m[1]] = v;
  }
}

if (!process.env.DATABASE_URL) {
  const { PGlite } = await import('@electric-sql/pglite');
  mkdirSync(path.join(root, '.data'), { recursive: true });
  const pg = new PGlite(path.join(root, '.data', 'pglite'));
  for (const f of ['db/schema.sql', 'db/seed.sql']) await pg.exec(readFileSync(path.join(root, f), 'utf8'));
  globalThis.__testDb = { query: async (t, p = []) => (await pg.query(t, p)).rows };
  console.log('Using the local test database (set DATABASE_URL to use Neon).');
} else {
  console.log('Using Neon.');
}

const handlers = {};
for (const name of ['health', 'check-area', 'book', 'log-call', 'queue', 'telegram', 'calendar', 'review', 'calls', 'my-leads', 'set-status']) {
  handlers[name] = (await import(`./api/${name}.js`)).default;
}
const pages = { '/queue': 'queue.html', '/calendar': 'calendar.html', '/calls': 'calls.html', '/designer': 'designer.html' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (pages[url.pathname]) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(readFileSync(path.join(root, 'public', pages[url.pathname])));
  }
  const m = /^\/api\/([a-z-]+)$/.exec(url.pathname);
  if (!m || !handlers[m[1]]) { res.writeHead(404); return res.end('not found'); }
  let body = '';
  for await (const chunk of req) body += chunk;
  try { req.body = body ? JSON.parse(body) : {}; } catch { req.body = {}; }
  req.query = Object.fromEntries(url.searchParams);
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(b)); return res; };
  await handlers[m[1]](req, res);
}).listen(process.env.PORT || 3000, () => console.log(`Listening on http://localhost:${process.env.PORT || 3000}`));
