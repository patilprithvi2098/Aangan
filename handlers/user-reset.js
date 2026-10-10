import { route } from '../lib/http.js';
import { getDb } from '../lib/db.js';
import { resetPassword } from '../lib/users.js';

// Front desk resets a password. The one-time password is shown once, then the person must choose their own.
export default route({ auth: 'user', roles: ['frontdesk'] }, async (req, res) => {
  const db = getDb();
  const row = (await db.query('select username from users where id = $1', [Number(req.body?.id)]))[0];
  if (!row) return res.status(404).json({ error: 'no such user' });
  const result = await resetPassword(db, row.username);
  return { username: result.username, one_time_password: result.password };
});
