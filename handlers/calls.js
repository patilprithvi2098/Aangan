import { route } from '../lib/http.js';
import { getDb } from '../lib/db.js';

// Every call, newest first, for the front desk and designers.
export default route({ method: 'GET' }, async (req) => {
  const db = getDb();
  const limit = Math.min(Number(req.query?.limit) || 100, 500);
  const calls = await db.query(
    `select c.id, c.call_id, c.created_at, c.caller_name, c.caller_phone, c.project_type, c.area, c.size_sqft,
            c.outcome, c.decline_reason, c.tier, c.call_by, c.slot_start, c.window_missed, c.status, c.summary,
            c.reviewed, c.duration_sec, c.cost_inr, d.name as designer,
            (c.telegram_message_id is not null) as telegram_sent, (c.hubspot_deal_id is not null) as in_hubspot
       from calls c left join designers d on d.id = c.designer_id
      order by c.created_at desc limit $1`,
    [limit],
  );
  const totals = await db.query(
    `select count(*)::int as total,
            count(*) filter (where outcome = 'qualified')::int as qualified,
            count(*) filter (where outcome = 'declined')::int as declined,
            count(*) filter (where outcome = 'escalated')::int as escalated,
            count(*) filter (where outcome = 'missed')::int as missed
       from calls`,
  );
  return { totals: totals[0], calls };
});
