import { route } from '../lib/http.js';
import { getDb } from '../lib/db.js';

// Front desk: the team list, to reset a forgotten password or switch someone off.
export default route({ method: 'GET', auth: 'user', roles: ['frontdesk'] }, async () => ({
  users: await getDb().query(
    `select u.id, u.username, u.name, u.role, u.active, u.must_change, u.last_login,
            (u.locked_until is not null and u.locked_until > now()) as locked
       from users u left join designers d on d.id = u.designer_id
      order by (u.role = 'designer'), d.rr_order, u.name`,
  ),
}));
