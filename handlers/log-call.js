import { route, withCallId } from '../lib/http.js';
import { getDb } from '../lib/db.js';
import { logCall } from '../lib/store.js';

const OUTCOMES = ['declined', 'escalated', 'missed', 'info_only', 'qualified'];

// Voice agent tool and post-call webhook: records every non-booked call, and adds transcript,
// duration and cost to any call.
export default route({}, async (req) => {
  const data = withCallId(req.body || {});
  if (!OUTCOMES.includes(data.outcome)) return { error: `outcome must be one of ${OUTCOMES.join(', ')}` };
  const row = await logCall(getDb(), data);
  return { logged: true, id: row.id, outcome: row.outcome };
});
