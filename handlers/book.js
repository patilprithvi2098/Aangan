import { route, withCallId } from '../lib/http.js';
import { getDb } from '../lib/db.js';
import { bookLead } from '../lib/store.js';
import { formatHandoff, sendTelegram } from '../lib/notify.js';
import { createDeal } from '../lib/hubspot.js';

// Voice agent tool: called once a lead is qualified. Picks the next designer, books the slot,
// messages the designer on Telegram and creates the HubSpot deal.
export default route({}, async (req) => {
  const db = getDb();
  const lead = withCallId(req.body || {});
  const booking = await bookLead(db, lead);
  if (booking.error) return { booked: false, spoken: 'Our team will call you shortly to fix a time.', ...booking };
  if (booking.repeated) return { booked: true, repeated: true, spoken: booking.spoken };

  const text = formatHandoff(lead, booking);
  const results = { telegram: null, hubspot: null };
  try {
    results.telegram = await sendTelegram(booking.telegram_chat_id, text, booking.call_row_id);
    if (results.telegram.sent) await db.query('update calls set telegram_message_id = $1 where id = $2', [results.telegram.message_id, booking.call_row_id]);
  } catch (e) {
    results.telegram = { skipped: true, reason: String(e.message) };
  }
  try {
    results.hubspot = await createDeal(lead, booking);
    if (results.hubspot.deal_id) await db.query('update calls set hubspot_deal_id = $1 where id = $2', [results.hubspot.deal_id, booking.call_row_id]);
  } catch (e) {
    results.hubspot = { skipped: true, reason: String(e.message) };
  }

  return {
    booked: true,
    designer: booking.designer_name,
    tier: booking.tier,
    slot: booking.slot,
    window_missed: booking.window_missed,
    spoken: booking.spoken,
    notifications: results,
  };
});
