import { route } from '../lib/http.js';
import { getDb } from '../lib/db.js';
import { setStatus } from '../lib/store.js';
import { moveDeal, STAGE_FOR_STATUS } from '../lib/hubspot.js';

// A designer marks a lead from the web page (same actions as the Telegram buttons).
export default route({}, async (req) => {
  const { id, status } = req.body || {};
  if (!Number.isInteger(id)) return { error: 'id must be a number' };
  if (!STAGE_FOR_STATUS[status] || status === 'new') return { error: 'unknown status' };
  const db = getDb();
  await setStatus(db, id, status, 'via web by designer');
  const rows = await db.query('select hubspot_deal_id from calls where id = $1', [id]);
  const moved = await moveDeal(rows[0]?.hubspot_deal_id, status).catch((e) => ({ error: 'hubspot update failed' }));
  return { ok: true, status, moved };
});
