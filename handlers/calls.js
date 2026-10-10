import { route } from '../lib/http.js';
import { getDb } from '../lib/db.js';

// Front desk: every call. A designer: only the calls booked to them.
export default route({ method: 'GET', auth: 'user' }, async (req) => {
  const db = getDb();
  const limit = Math.min(Math.max(Number(req.query?.limit) || 200, 1), 500);
  const mine = req.user.role === 'designer';
  const where = mine ? 'where c.designer_id = $1' : '';
  const args = mine ? [req.user.designer_id] : [];
  const calls = await db.query(
    `select c.id, c.created_at, c.caller_name, c.caller_phone, c.project_type, c.area, c.size_sqft,
            c.outcome, c.decline_reason, c.tier, c.call_by, c.slot_start, c.window_missed, c.status, c.summary,
            c.reviewed, c.duration_sec, (c.transcript is not null) as has_transcript, (c.recording_url is not null) as has_recording,
            d.name as designer
       from calls c left join designers d on d.id = c.designer_id
       ${where}
      order by c.created_at desc limit ${limit}`,
    args,
  );
  const totals = await db.query(
    `select count(*)::int as total,
            count(*) filter (where outcome = 'qualified')::int as qualified,
            count(*) filter (where outcome = 'declined')::int as declined,
            count(*) filter (where outcome = 'escalated')::int as escalated,
            count(*) filter (where outcome = 'missed')::int as missed,
            count(*) filter (where outcome = 'info_only')::int as info_only
       from calls c ${where}`,
    args,
  );
  return { totals: totals[0], calls };
});
