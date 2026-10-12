// Reads what Vaani sends after a call ends (the call_postprocessing webhook event).

// Vaani's transcript is timestamped speaker lines. The dashboard reads "Agent: ..." and "Caller: ...".
export function normaliseTranscript(text) {
  if (!text) return null;
  const lines = String(text).split(/\r?\n/).map((line) => {
    const m = /^\s*(?:\[[^\]]*\]\s*|\d{1,2}:\d{2}(?::\d{2})?\s*[-–]?\s*)*(agent|assistant|ai|bot|chayya|caller|user|customer|human)\s*[:\-]\s*(.*)$/i.exec(line);
    if (!m) return line.trim();
    return `${/^(caller|user|customer|human)$/i.test(m[1]) ? 'Caller' : 'Agent'}: ${m[2]}`;
  }).filter(Boolean);
  return lines.length ? lines.join('\n') : null;
}

// Pulls the fields out of the event, wherever Vaani nests them.
export function readEvent(body = {}) {
  const data = body.data && typeof body.data === 'object' ? body.data : {};
  const pick = (...keys) => { for (const k of keys) for (const src of [data, body]) if (src[k] !== undefined && src[k] !== null && src[k] !== '') return src[k]; return null; };
  const ms = Number(pick('call_duration', 'duration_ms'));
  const recording = pick('recording_url');
  return {
    event: body.event || null,
    ids: [pick('call_id'), pick('room_name')].filter(Boolean).map(String),
    transcript: normaliseTranscript(pick('transcript')),
    summary: pick('summary', 'call_summary'),
    recording_url: typeof recording === 'string' && /^https:\/\//i.test(recording) ? recording : null,
    duration_sec: Number.isFinite(ms) && ms > 0 ? Math.round(ms / 1000) : null,
  };
}
