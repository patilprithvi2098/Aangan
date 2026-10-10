import { getDb } from './db.js';
import { formatHandoff, sendTelegram } from './notify.js';
import { createDeal } from './hubspot.js';

// After a booking: message the designer on Telegram and push the lead to the CRM. Each step reports
// "skipped" instead of failing, so a missing key never loses the booking.
export async function notifyBooking(lead, booking) {
  const db = getDb();
  const results = { telegram: null, hubspot: null };
  try {
    results.telegram = await sendTelegram(booking.telegram_chat_id, formatHandoff(lead, booking), booking.call_row_id);
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
  return results;
}
