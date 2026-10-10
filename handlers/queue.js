import { route } from '../lib/http.js';
import { getDb } from '../lib/db.js';
import { frontDeskQueue } from '../lib/store.js';

export default route({ method: 'GET' }, async () => frontDeskQueue(getDb()));
