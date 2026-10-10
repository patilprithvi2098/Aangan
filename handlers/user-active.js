import { route } from '../lib/http.js';
import { getDb } from '../lib/db.js';

// Front desk switches a login on or off (someone leaves, or comes back). You cannot switch yourself off.
export default route({ auth: 'user', roles: ['frontdesk'] }, async (req, res) => {
  const db = getDb();
  const id = Number(req.body?.id);
  const active = req.body?.active === true;
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id must be a number' });
  if (id === req.user.id && !active) return res.status(400).json({ error: 'You cannot switch off your own login.' });
  await db.query('update users set active = $1 where id = $2', [active, id]);
  if (!active) await db.query('delete from sessions where user_id = $1', [id]);
  return { ok: true };
});
