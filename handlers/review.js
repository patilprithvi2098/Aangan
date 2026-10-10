import { route } from '../lib/http.js';
import { getDb } from '../lib/db.js';
import { setStatus } from '../lib/store.js';

// Front desk actions: mark a declined call reviewed, close an escalation or callback, or reverse a decline.
export default route({}, async (req) => {
  const { id, action } = req.body || {};
  const db = getDb();
  if (!Number.isInteger(id)) return { error: 'id must be a number' };
  if (action === 'reviewed') {
    await db.query('update calls set reviewed = true where id = $1', [id]);
  } else if (action === 'done') {
    await setStatus(db, id, 'done', 'closed by front desk');
  } else {
    return { error: 'action must be reviewed or done' };
  }
  return { ok: true };
});
