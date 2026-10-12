import { route } from '../lib/http.js';

const API = 'https://api.vaanivoice.ai';
const AGENT_ID = '6c4a0a66-1a3a-4ce4-b678-d44b92849579';

async function vaani(path, body) {
  const r = await fetch(`${API}${path}`, { method: 'POST', headers: { 'x-api-key': process.env.VAANI_API_KEY, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Vaani answered ${r.status}`);
  return data;
}

// The test console's call button. Starts a browser call with Chayya through Vaani's session API and returns what the
// page needs to join the room (the page joins with LiveKit and the microphone). Vaani's own hosted page cannot be
// embedded in another site, so the dashboard runs the call itself. Only the "chayya" login can start or end one.
//   { action: 'start' }                          -> { lk_url, lk_token, room_name, session_token }
//   { action: 'end', session_token }             -> { ended: true }
export default route({ auth: 'user', roles: ['chayya'] }, async (req, res) => {
  if (!process.env.VAANI_API_KEY) return res.status(503).json({ error: 'The Vaani key is not set on the server.' });
  const { action, session_token } = req.body || {};
  try {
    if (action === 'end') {
      if (typeof session_token !== 'string' || session_token.length > 4000) return res.status(400).json({ error: 'session_token is required' });
      await vaani('/api/webrtc/session/disconnect', { session_token, explicit_end: true });
      return { ended: true };
    }
    const session = await vaani('/api/webrtc/session/create', {
      agent_id: AGENT_ID, ui_type: 'widget', session_ttl: 1800, grace_period: 30, metadata: { source: 'aangan-dashboard', tester: req.user.username },
    });
    const creds = await vaani('/api/webrtc/session/connect', { session_token: session.session_token });
    return { lk_url: String(creds.lk_url).replace(/^http/, 'ws'), lk_token: creds.lk_token, room_name: creds.room_name, session_token: session.session_token };
  } catch (err) {
    return res.status(502).json({ error: `Could not start the call: ${err.message}` });
  }
});
