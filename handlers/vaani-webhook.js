import { route, sameKey } from '../lib/http.js';
import { getDb } from '../lib/db.js';
import { readEvent } from '../lib/vaani.js';

// Vaani posts here when a call has been processed. Vaani does not sign its webhooks, so the URL carries a long
// secret (?s=...). The transcript, recording link and length are attached to the call the agent already logged:
// first by call id, otherwise the newest live call from the last 45 minutes that has no transcript yet (web test
// calls have no phone number to match on). The outcome and the summary the agent wrote are never changed.
export default route({ auth: 'none' }, async (req, res) => {
  const secret = process.env.VAANI_WEBHOOK_SECRET;
  if (!secret || !sameKey(req.query?.s, secret)) return res.status(401).json({ error: 'unauthorised' });
  const ev = readEvent(req.body);
  if (ev.event !== 'call_postprocessing') return { ignored: ev.event || 'no event' };
  if (!ev.transcript && !ev.recording_url) return { ignored: 'nothing to attach' };

  const db = getDb();
  let row;
  if (ev.ids.length) row = (await db.query('select id from calls where call_id = any($1::text[]) limit 1', [ev.ids]))[0];
  let how = 'call id';
  if (!row) {
    how = 'time window';
    row = (await db.query(
      `select id from calls where not is_demo and (transcript is null or transcript = '') and created_at > now() - interval '45 minutes'
        order by created_at desc limit 1`,
    ))[0];
  }
  if (!row) return { matched: false };
  await db.query(
    `update calls set transcript = coalesce($2, transcript), recording_url = coalesce($3, recording_url),
                      duration_sec = coalesce($4, duration_sec), summary = coalesce(summary, $5) where id = $1`,
    [row.id, ev.transcript, ev.recording_url, ev.duration_sec, ev.summary ? String(ev.summary) : null],
  );
  return { matched: true, how, call: row.id };
});
