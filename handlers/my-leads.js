import { route } from '../lib/http.js';
import { getDb } from '../lib/db.js';

// A designer's own leads, soonest call-by first, plus the list of designers for the picker.
export default route({ method: 'GET' }, async (req) => {
  const db = getDb();
  const designers = await db.query('select id, name from designers where active order by rr_order');
  const name = String(req.query?.designer || '').trim();
  if (!name) return { designers, leads: [] };
  const leads = await db.query(
    `select c.id, c.created_at, c.caller_name, c.caller_phone, c.project_type, c.area, c.size_sqft, c.timeline_text,
            c.decision_maker, c.budget_note, c.source, c.tier, c.tier_reasons, c.call_by, c.slot_start, c.status, c.summary
       from calls c join designers d on d.id = c.designer_id
      where lower(d.name) = lower($1) and c.outcome = 'qualified'
      order by (c.status in ('won','lost','not_a_fit')), c.call_by`,
    [name],
  );
  return { designers, leads };
});
