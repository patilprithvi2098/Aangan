import { route } from '../lib/http.js';
import { getDb } from '../lib/db.js';

// Next 7 days of bookings for all 14 designer calendars.
export default route({ method: 'GET' }, async () => {
  const db = getDb();
  const designers = await db.query('select id, name, rr_order from designers where active order by rr_order');
  const bookings = await db.query(
    `select b.designer_id, b.start_at, b.end_at, c.id as call_row_id, c.caller_name, c.area, c.tier, c.status, c.window_missed
       from bookings b join calls c on c.id = b.call_id
      where b.start_at >= now() - interval '1 day' and b.start_at < now() + interval '8 days'
      order by b.start_at`,
  );
  const next = await db.query('select next_index from rr_state where id = 1');
  return { designers, bookings, next_designer_index: next[0]?.next_index ?? 0 };
});
