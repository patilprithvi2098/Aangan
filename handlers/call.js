import { route } from '../lib/http.js';
import { getDb } from '../lib/db.js';

// One call in full: details, summary, transcript, recording link and the status history.
// A designer can open only their own; anything else looks like it does not exist.
export default route({ method: 'GET', auth: 'user' }, async (req, res) => {
  const db = getDb();
  const id = Number(req.query?.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id must be a number' });
  const call = (await db.query(
    `select c.id, c.call_id, c.created_at, c.caller_name, c.caller_phone, c.project_type, c.area, c.size_sqft, c.timeline_text,
            c.decision_maker, c.source, c.budget_note, c.outcome, c.decline_reason, c.tier, c.tier_reasons, c.call_by,
            c.slot_start, c.window_missed, c.status, c.summary, c.transcript, c.recording_url, c.duration_sec, c.reviewed,
            c.designer_id, d.name as designer
       from calls c left join designers d on d.id = c.designer_id where c.id = $1`,
    [id],
  ))[0];
  if (!call || (req.user.role === 'designer' && call.designer_id !== req.user.designer_id)) return res.status(404).json({ error: 'not found' });
  const events = await db.query('select status, note, created_at from status_events where call_id = $1 order by created_at, id', [id]);
  return { call, events };
});
