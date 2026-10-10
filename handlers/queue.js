import { route } from '../lib/http.js';
import { getDb } from '../lib/db.js';
import { frontDeskQueue, todayStats } from '../lib/store.js';

// Front desk home: what needs a person right now, plus today's numbers.
export default route({ method: 'GET', auth: 'user', roles: ['frontdesk'] }, async () => {
  const db = getDb();
  return { ...(await frontDeskQueue(db)), stats: await todayStats(db) };
});
