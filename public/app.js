// Aangan Enquiry Desk: login, my leads, needs attention, call records, calendars. Everyone who logs in is a designer.
// Plain JavaScript, no build step. Everything shown from the server goes through esc().
(() => {
'use strict';

/* ---------- small helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tel = (p) => String(p || '').replace(/[^\d+]/g, '');
const initials = (n) => String(n || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const MIN = 60000, HOUR = 3600000, DAY = 86400000;

const ICONS = {
  phone: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
  calendar: 'M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z',
  home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  people: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  search: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  clock: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
  warning: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
  refresh: 'M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
  left: 'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z',
  right: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
  logout: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
  lock: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
  doc: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  queue: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z',
  back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
};
const ic = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[n]}"/></svg>`;

/* ---------- time (always India time) ---------- */
const IST = 'Asia/Kolkata';
const nb = (s) => s.replace(/[  ]/g, ' ');
const F_DAY = new Intl.DateTimeFormat('en-IN', { timeZone: IST, weekday: 'short', day: 'numeric', month: 'short' });
const F_TIME = new Intl.DateTimeFormat('en-IN', { timeZone: IST, hour: 'numeric', minute: '2-digit', hour12: true });
const day = (d) => F_DAY.format(new Date(d));
const clock = (d) => nb(F_TIME.format(new Date(d))).toLowerCase();
const when = (d) => (d ? `${day(d)}, ${clock(d)}` : '');
const ist = (ms) => { const d = new Date(ms + 330 * MIN); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), wd: d.getUTCDay(), min: d.getUTCHours() * 60 + d.getUTCMinutes() }; };
const istMidnight = (ms) => { const p = ist(ms); return Date.UTC(p.y, p.m, p.d) - 330 * MIN; };
const hhmm = (min) => { const h = Math.floor(min / 60), m = min % 60; return `${h % 12 || 12}${m ? ':' + String(m).padStart(2, '0') : ''} ${h < 12 ? 'am' : 'pm'}`; };
const greeting = () => { const h = Math.floor(ist(Date.now()).min / 60); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
function span(ms) {
  const m = Math.max(1, Math.round(Math.abs(ms) / MIN));
  if (m < 60) return `${m} min`;
  if (m < 1440) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h`;
}
// A deadline as a coloured chip: red once passed, amber inside two hours.
function due(deadline, now = Date.now()) {
  if (!deadline) return '';
  const left = Date.parse(deadline) - now;
  const cls = left < 0 ? 'b-err' : left < 2 * HOUR ? 'b-warn' : 'b-info';
  return `<span class="b ${cls}">${left < 0 ? span(left) + ' overdue' : span(left) + ' left'}</span>`;
}
const ago = (d) => `${span(Date.now() - Date.parse(d))} ago`;

/* ---------- labels ---------- */
const STATUS = { new: 'New', accepted: 'Accepted', called: 'Called', held: 'Consultation held', proposal: 'Proposal sent', won: 'Won', lost: 'Lost', not_a_fit: 'Not a fit', done: 'Done' };
const PATH = ['new', 'accepted', 'called', 'held', 'proposal', 'won'];
const CLOSED = ['won', 'lost', 'not_a_fit', 'done'];
const NEXT = { new: ['accepted', 'Accept lead'], accepted: ['called', 'Mark called'], called: ['held', 'Consultation held'], held: ['proposal', 'Proposal sent'], proposal: ['won', 'Mark won'] };
const OUTCOME = { qualified: ['Qualified', 'b-ok'], declined: ['Declined', 'b-err'], escalated: ['Escalated', 'b-warn'], missed: ['Missed call', ''], info_only: ['Info only', ''] };
const TIER = { hot: ['Hot', 'b-err'], priority: ['Priority', 'b-warn'], standard: ['Standard', ''] };
const badge = (text, cls = '') => `<span class="b ${cls}">${esc(text)}</span>`;
const outcomeBadge = (o) => (OUTCOME[o] ? badge(OUTCOME[o][0], OUTCOME[o][1]) : '');
const tierBadge = (t) => (TIER[t] ? badge(TIER[t][0], TIER[t][1]) : '');
const statusBadge = (s) => badge(STATUS[s] || s, CLOSED.includes(s) ? (s === 'won' ? 'b-ok' : '') : 'b-info');

/* ---------- state, api, toast ---------- */
const S = { me: null, current: null, route: null, cal: null, rtab: 'details', timer: null, callTab: 'leads' };

async function api(path, body, { quiet = false, method } = {}) {
  const res = await fetch(`/api/${path}`, {
    method: method || (body ? 'POST' : 'GET'),
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  let data = {};
  try { data = await res.json(); } catch (e) { /* not json */ }
  if (res.status === 401 && !quiet) { S.me = null; showLogin('Your session ended. Please log in again.'); }
  if (res.status === 403 && data.error === 'password_change_required') showChange(true);
  if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong. Please try again.'), { status: res.status });
  return data;
}
function toast(msg, kind = 'ok') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = `${ic(kind === 'ok' ? 'check' : 'warning')}<span>${esc(msg)}</span>`;
  $('#toast').append(el);
  setTimeout(() => el.remove(), 4500);
}
const lsGet = (k) => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } };

/* ---------- login and password ---------- */
function resetState() {
  S.cal = null; S.callData = null; S.rtab = 'details'; S.route = null;
}
function showLogin(message) {
  stopTimer();
  resetState();
  $('#app').innerHTML = `<div class="auth"><form class="auth-card" id="login-form">
    <div class="logo">A</div><h1>Aangan Enquiry Desk</h1><div class="sub">Log in with your own account</div>
    ${message ? `<div class="err-msg" role="alert">${esc(message)}</div>` : ''}
    <label class="lbl" for="u">Username</label>
    <input class="field" id="u" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" value="${esc(lsGet('aangan_user'))}" required>
    <label class="lbl" for="p">Password</label>
    <input class="field" id="p" name="password" type="password" autocomplete="current-password" required>
    <div id="login-err"></div>
    <button class="btn brand" type="submit">Log in</button>
    <div class="foot">Forgot your password? Ask the studio admin to reset it.</div>
  </form></div>`;
  ($('#u').value ? $('#p') : $('#u')).focus();
}

function passwordFields(forced) {
  return `
    <label class="lbl" for="cp">${forced ? 'One-time password you were given' : 'Current password'}</label>
    <input class="field" id="cp" type="password" autocomplete="current-password" required>
    <label class="lbl" for="np">New password</label>
    <input class="field" id="np" type="password" autocomplete="new-password" required>
    <label class="lbl" for="np2">Type the new password again</label>
    <input class="field" id="np2" type="password" autocomplete="new-password" required>
    <ul class="rules"><li>At least 10 characters</li><li>At least one letter and one number</li><li>Not your username</li></ul>
    <div id="pw-err"></div>`;
}
function showChange(forced) {
  stopTimer();
  $('#app').innerHTML = `<div class="auth"><form class="auth-card" id="change-form" data-forced="1">
    <div class="logo">${ic('lock')}</div><h1>Choose your own password</h1>
    <div class="sub">${esc(S.me?.name || '')}, replace the one-time password before you start.</div>
    ${passwordFields(true)}
    <button class="btn brand" type="submit">Save and continue</button>
    <div class="foot"><a href="#" data-act="logout">Log out</a></div>
  </form></div>`;
  $('#cp').focus();
}
async function submitPassword(form) {
  const cur = $('#cp', form).value, n1 = $('#np', form).value, n2 = $('#np2', form).value;
  const err = $('#pw-err', form);
  if (n1 !== n2) { err.innerHTML = '<div class="err-msg">The two new passwords are not the same.</div>'; return false; }
  try {
    const r = await api('change-password', { current: cur, next: n1 });
    S.me = r.user;
    return true;
  } catch (e) { err.innerHTML = `<div class="err-msg">${esc(e.message)}</div>`; return false; }
}

/* ---------- shell ---------- */
function tabsFor() {
  return [['leads', 'My leads', 'phone'], ['attention', 'Needs attention', 'warning'], ['calendar', 'Calendar', 'calendar']];
}
function showShell() {
  const me = S.me;
  $('#app').innerHTML = `<header class="gh">
      <div class="logo">A</div>
      <div class="app">Aangan Enquiry Desk<small>Phone enquiries</small></div>
      <div class="search"></div>
      <button class="avatar" id="avatar" aria-haspopup="true" aria-label="Account menu">${esc(initials(me.name))}</button>
    </header>
    <div class="menu hide" id="menu" role="menu">
      <div class="who"><div class="strong">${esc(me.name)}</div><div class="muted small">Designer · ${esc(me.username)}</div></div>
      <button data-act="chpw">${ic('lock')} Change password</button>
      <button data-act="logout">${ic('logout')} Log out</button>
    </div>
    <nav class="tabs" id="tabs" aria-label="Sections">${tabsFor().map(([k, l, i]) => `<a class="tab" data-tab="${k}" href="#/${k}">${ic(i)}${l}<span class="n hide" data-badge="${k}"></span></a>`).join('')}</nav>
    <main id="view"></main>`;
}
function markTab() {
  const name = S.route.name;
  const on = name === 'call' ? S.callTab : name;
  $$('.tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === on));
}
function setBadge(key, n) {
  const el = $(`[data-badge="${key}"]`);
  if (el) { el.textContent = n; el.classList.toggle('hide', !n); }
}

/* ---------- routing and refresh ---------- */
function parseHash() {
  const [name, arg] = location.hash.replace(/^#\/?/, '').split('?')[0].split('/');
  return { name: name || '', arg };
}
async function route() {
  if (!S.me || S.me.must_change) return;
  if (!$('#view')) showShell();
  const { name, arg } = parseHash();
  if (!['leads', 'attention', 'call', 'calendar'].includes(name)) { location.hash = '#/leads'; return; }
  S.route = { name, arg };
  if (name === 'call') S.rtab = 'details';
  markTab();
  const views = { leads: vLeads, attention: vAttention, call: () => vCall(arg), calendar: vCalendar };
  S.current = views[name];
  $('#view').innerHTML = '<div class="card"><div class="skel"></div><div class="skel" style="width:60%"></div><div class="skel" style="width:80%"></div></div>';
  window.scrollTo(0, 0);
  await run(false);
  badges();
  startTimer();
}
async function run(quiet) {
  const token = S.route;
  try { await S.current(quiet); } catch (e) {
    if (token === S.route && e.status !== 401 && !quiet) $('#view').innerHTML = `<div class="banner err">${ic('warning')}<div class="grow">${esc(e.message)}</div><button class="btn sm" data-act="refresh">Try again</button></div>`;
  }
}
// The red counts on the tabs: calls to return, and my leads due within two hours.
async function badges() {
  try {
    const [q, l] = await Promise.all([api('queue', null, { quiet: true }), api('my-leads', null, { quiet: true })]);
    setBadge('attention', q.escalations.length + q.callbacks.length + q.declines.length);
    setBadge('leads', l.leads.filter((x) => ['new', 'accepted'].includes(x.status) && Date.parse(x.call_by) - Date.now() < 2 * HOUR).length);
  } catch (e) { /* the page itself reports errors */ }
}
function startTimer() {
  stopTimer();
  S.timer = setInterval(() => {
    if (document.hidden || $('.overlay') || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return;
    run(true); badges();
  }, 20000);
}
function stopTimer() { clearInterval(S.timer); S.timer = null; }
const render = (html) => { const v = $('#view'); if (v) v.innerHTML = html; };

/* ---------- building blocks ---------- */
const pageHead = ({ icon, color, kicker, title, actions = '', extra = '' }) => `<div class="ph">
  <div class="oicon" style="background:${color}">${ic(icon)}</div>
  <div><div class="kicker">${kicker}</div><h1>${title}</h1></div><div class="actions">${actions}</div>${extra}</div>`;
const kpis = (list) => `<div class="kpis">${list.map(([l, v, c = '']) => `<div class="kpi ${c}"><div class="l">${l}</div><div class="v">${v}</div></div>`).join('')}</div>`;
const emptyState = (text) => `<div class="empty">${ic('check')}${esc(text)}</div>`;
const refreshBtn = `<span class="muted small" id="updated">Updated just now</span><button class="btn icon" data-act="refresh" aria-label="Refresh" title="Refresh">${ic('refresh')}</button>`;
function listCard(title, hint, rows, items, empty) {
  return `<section class="card"><div class="card-h"><h2>${title}</h2><span class="count ${rows.length ? '' : 'zero'}">${rows.length}</span><span class="hint right">${hint}</span></div>${rows.length ? items : emptyState(empty)}</section>`;
}
const callName = (c) => esc(c.caller_name || 'Unknown caller');
const phoneLink = (p) => (p ? `<a href="tel:${tel(p)}">${esc(p)}</a>` : '<span class="muted">no number</span>');

/* ---------- needs attention: what the bot could not finish alone ---------- */
async function vAttention() {
  const q = await api('queue');
  const now = Date.now();
  const esc15 = q.escalations.map((r) => ({ ...r, deadline: new Date(Date.parse(r.created_at) + 15 * MIN).toISOString() }));
  const total = q.escalations.length + q.callbacks.length + q.declines.length;
  setBadge('attention', total);
  render(`${pageHead({ icon: 'warning', color: '#ba0517', kicker: 'Shared by every designer · anyone can pick one up', title: 'Needs attention', actions: refreshBtn })}
    ${kpis([['Escalations to call back', q.escalations.length, q.escalations.length ? 'bad' : 'good'], ['Missed calls to return', q.callbacks.length, q.callbacks.length ? 'warn' : 'good'], ['Declined calls to check', q.declines.length, q.declines.length ? 'warn' : 'good']])}
    <div class="grid2">
      ${listCard('Escalations', 'Call back within 15 minutes', esc15, esc15.map((r) => `<div class="item click" data-act="open" data-id="${r.id}"><div class="grow"><div class="t">${callName(r)}</div><div class="m">${phoneLink(r.caller_phone)} · ${ago(r.created_at)}</div><div class="snip">${esc(r.summary || '')}</div></div><div class="side">${due(r.deadline, now)}<button class="btn sm brand" data-act="done" data-id="${r.id}">Called back</button></div></div>`).join(''), 'No one is waiting for a senior callback.')}
      ${listCard('Missed calls', 'Dropped or unanswered calls', q.callbacks, q.callbacks.map((r) => `<div class="item click" data-act="open" data-id="${r.id}"><div class="grow"><div class="t">${phoneLink(r.caller_phone)}</div><div class="m">Call came in ${ago(r.created_at)}</div></div><div class="side"><button class="btn sm brand" data-act="done" data-id="${r.id}">Called back</button></div></div>`).join(''), 'No missed calls to return.')}
    </div>
    <div style="height:12px"></div>
    ${listCard('Declined calls to check', 'A wrong decline loses a real lead. Read it, then confirm or reverse it', q.declines, q.declines.map((r) => `<div class="item click" data-act="open" data-id="${r.id}"><div class="grow"><div class="t">${callName(r)} <span class="m">${esc(r.area || '')}</span></div><div class="m">Reason: ${esc(r.decline_reason || 'not recorded')} · ${ago(r.created_at)}</div><div class="snip">${esc(r.summary || '')}</div></div><div class="side"><button class="btn sm danger" data-act="reverse" data-id="${r.id}" data-name="${esc(r.caller_name || 'this caller')}">Wrong, reverse</button><button class="btn sm" data-act="reviewed" data-id="${r.id}">Looks right</button></div></div>`).join(''), 'Every decline has been checked.')}`);
}

/* ---------- a single call ---------- */
async function vCall(id) {
  const d = await api(`call?id=${encodeURIComponent(id)}`);
  S.callData = d;
  S.callTab = d.call.outcome === 'qualified' ? 'leads' : 'attention';
  markTab();
  drawCall();
}
function parseTranscript(text) {
  const lines = String(text).split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    const m = /^\s*(agent|assistant|ai|bot|caller|user|customer)\s*[:\-]\s*(.*)$/i.exec(line);
    if (m) out.push({ who: /^(caller|user|customer)$/i.test(m[1]) ? 'caller' : 'agent', text: m[2] });
    else if (line.trim() && out.length) out[out.length - 1].text += `\n${line}`;
    else if (line.trim()) out.push({ who: 'agent', text: line });
  }
  return out;
}
function pathHtml(c) {
  const idx = PATH.indexOf(c.status);
  const closed = CLOSED.includes(c.status) && c.status !== 'won';
  return `<ol class="path ${closed ? 'closed' : ''}" aria-label="Lead status">${PATH.map((p, i) => `<li class="${!closed && i < idx ? 'done' : !closed && i === idx ? 'cur' : ''}"><button data-act="status" data-id="${c.id}" data-status="${p}" ${closed ? 'disabled' : ''}>${!closed && i < idx ? ic('check') : ''}${STATUS[p]}</button></li>`).join('')}</ol>`;
}
function drawCall() {
  const { call: c, events } = S.callData;
  const now = Date.now();
  const back = `#/${S.callTab}`;
  const qualified = c.outcome === 'qualified';
  const open = !CLOSED.includes(c.status);
  const actions = [
    `<a class="btn" href="${back}">${ic('back')} Back</a>`,
    c.caller_phone ? `<a class="btn brand" href="tel:${tel(c.caller_phone)}">${ic('phone')} Call ${esc(c.caller_phone)}</a>` : '',
    qualified && open ? `<button class="btn" data-act="status" data-id="${c.id}" data-status="not_a_fit">Not a fit</button><button class="btn danger" data-act="status" data-id="${c.id}" data-status="lost">Mark lost</button>` : '',
    c.outcome === 'declined' ? `<button class="btn danger" data-act="reverse" data-id="${c.id}" data-name="${esc(c.caller_name || 'this caller')}">Wrong decline, reverse</button>${c.reviewed ? '' : `<button class="btn" data-act="reviewed" data-id="${c.id}">Looks right</button>`}` : '',
    ['escalated', 'missed'].includes(c.outcome) && c.status === 'new' ? `<button class="btn brand" data-act="done" data-id="${c.id}">Mark done</button>` : '',
  ].join('');
  const banner = c.outcome === 'declined'
    ? `<div class="banner warn">${ic('warning')}<div class="grow"><strong>The agent declined this call.</strong> Reason: ${esc(c.decline_reason || 'not recorded')}. Read the summary and transcript before agreeing: a wrongly declined lead is the costliest mistake.${c.reviewed ? ' <strong>Already checked.</strong>' : ''}</div></div>`
    : c.outcome === 'escalated' && c.status === 'new'
      ? `<div class="banner err">${ic('clock')}<div class="grow"><strong>Senior callback owed.</strong> The caller was promised a call within 15 minutes of ${clock(c.created_at)}. ${due(new Date(Date.parse(c.created_at) + 15 * MIN).toISOString(), now)}</div></div>`
      : c.outcome === 'qualified' && c.window_missed && open
        ? `<div class="banner warn">${ic('warning')}<div class="grow"><strong>No designer slot was free inside the call-by window.</strong> The earliest slot was booked instead. Call this lead as soon as you can.</div></div>`
        : '';
  const tabs = [['details', 'Details'], ['transcript', 'Transcript and recording'], ['activity', `Activity (${events.length})`]];
  let body;
  if (S.rtab === 'transcript') {
    const turns = c.transcript ? parseTranscript(c.transcript) : [];
    body = `${c.recording_url && /^https:\/\//i.test(c.recording_url) ? `<div style="margin-bottom:16px"><div class="l muted small">Recording${c.duration_sec ? ` · ${Math.floor(c.duration_sec / 60)}m ${c.duration_sec % 60}s` : ''}</div><audio controls preload="none" src="${esc(c.recording_url)}"></audio></div>` : ''}
      ${turns.length ? `<div class="bubbles">${turns.map((t) => `<div class="bub ${t.who}"><div class="who">${t.who === 'caller' ? 'Caller' : 'Agent'}</div>${esc(t.text)}</div>`).join('')}</div>` : `<div class="banner info">${ic('doc')}<div class="grow">${c.recording_url ? 'No transcript has been attached to this call yet.' : 'The transcript and recording have not been attached to this call yet.'} The full conversation is always in Vaani under Conversations, History.</div><a class="btn sm" href="https://app.vaanivoice.ai/conversations/history" target="_blank" rel="noopener">Open Vaani history</a></div>`}`;
  } else if (S.rtab === 'activity') {
    const items = [...events].reverse().map((e) => [STATUS[e.status] || e.status.replace('_', ' '), `${when(e.created_at)}${e.note ? ` · ${e.note}` : ''}`]);
    items.push(['Call received', when(c.created_at)]);
    body = `<ul class="timeline">${items.map(([t, m]) => `<li><div class="strong">${esc(t)}</div><div class="muted small">${esc(m)}</div></li>`).join('')}</ul>`;
  } else {
    const f = (l, v, full) => `<div class="${full ? 'full' : ''}"><div class="l">${l}</div><div>${v ? esc(v) : '<span class="muted">Not given</span>'}</div></div>`;
    body = `<div class="dl">${f('Project', c.project_type)}${f('Size', c.size_sqft ? `${c.size_sqft} sq ft` : '')}${f('Area', c.area)}${f('Timeline', c.timeline_text)}${f('Decision-maker', c.decision_maker)}${f('Heard about us', c.source)}${f('Budget', c.budget_note)}${f('Why this urgency', c.tier_reasons)}${f('Summary for the designer', c.summary, true)}</div>`;
  }
  const highlights = `<div class="hl">
      <div><div class="l">Phone</div><div class="v">${phoneLink(c.caller_phone)}</div></div>
      <div><div class="l">Area</div><div class="v">${esc(c.area || '-')}</div></div>
      <div><div class="l">Project</div><div class="v">${esc(c.project_type || '-')}${c.size_sqft ? `, ${esc(c.size_sqft)} sq ft` : ''}</div></div>
      <div><div class="l">Designer</div><div class="v">${esc(c.designer || '-')}</div></div>
      ${qualified ? `<div><div class="l">Call by</div><div class="v">${when(c.call_by)} ${open ? due(c.call_by, now) : ''}</div></div><div><div class="l">Consultation</div><div class="v">${when(c.slot_start) || '-'}</div></div><div><div class="l">Status</div><div class="v">${statusBadge(c.status)}</div></div>` : ''}
    </div>`;
  render(`${pageHead({ icon: 'phone', color: '#0b827c', kicker: `Call · ${when(c.created_at)}`, title: `${callName(c)} ${outcomeBadge(c.outcome)} ${tierBadge(c.tier)}`, actions, extra: highlights })}
    ${qualified ? pathHtml(c) : ''}${banner}
    <div class="card"><div class="rtabs">${tabs.map(([k, l]) => `<button class="rtab ${S.rtab === k ? 'on' : ''}" data-act="rtab" data-t="${k}">${l}</button>`).join('')}</div><div class="card-b">${body}</div></div>`);
}

/* ---------- designer: my leads ---------- */
async function vLeads() {
  const { leads } = await api('my-leads');
  const now = Date.now();
  const needs = leads.filter((l) => ['new', 'accepted'].includes(l.status));
  const prog = leads.filter((l) => ['called', 'held', 'proposal'].includes(l.status));
  const closed = leads.filter((l) => CLOSED.includes(l.status));
  const callNow = needs.filter((l) => Date.parse(l.call_by) - now < 2 * HOUR).length;
  const week = leads.filter((l) => !CLOSED.includes(l.status) && l.slot_start && Date.parse(l.slot_start) >= now && Date.parse(l.slot_start) < now + 7 * DAY).length;
  setBadge('leads', callNow);
  const item = (l) => {
    const next = NEXT[l.status];
    const isOpen = !CLOSED.includes(l.status);
    return `<div class="item click" data-act="open" data-id="${l.id}"><span class="bar ${l.tier || ''}"></span><div class="grow">
      <div class="row wrap"><span class="t">${esc(l.caller_name || 'Unknown caller')}</span>${tierBadge(l.tier)}${statusBadge(l.status)}</div>
      <div class="m">${esc(l.area || '')}${l.project_type ? ` · ${esc(l.project_type)}` : ''}${l.size_sqft ? ` · ${esc(l.size_sqft)} sq ft` : ''}</div>
      ${isOpen ? `<div class="m" style="margin-top:4px">Call by ${when(l.call_by)} ${due(l.call_by, now)}${l.slot_start ? ` · Consultation ${when(l.slot_start)}` : ''}</div>` : ''}
      <div class="snip" style="margin-top:4px">${esc(l.summary || '')}</div></div>
      <div class="side">${l.caller_phone && isOpen ? `<a class="btn sm" href="tel:${tel(l.caller_phone)}">${ic('phone')} Call</a>` : ''}${next ? `<button class="btn sm brand" data-act="status" data-id="${l.id}" data-status="${next[0]}">${next[1]}</button>` : ''}</div></div>`;
  };
  const sec = (title, hint, rows, empty) => `<section class="card"><div class="card-h"><h2>${title}</h2><span class="count ${rows.length ? '' : 'zero'}" ${rows.length && title === 'In progress' ? 'style="background:var(--brand)"' : ''}>${rows.length}</span><span class="hint right">${hint}</span></div>${rows.length ? rows.map(item).join('') : emptyState(empty)}</section>`;
  render(`${pageHead({ icon: 'phone', color: '#f88962', kicker: `${day(now)} · My leads`, title: `${greeting()}, ${esc(S.me.name.split(' ')[0])}`, actions: refreshBtn })}
    ${kpis([['Call now', callNow, callNow ? 'bad' : 'good'], ['Waiting for a first call', needs.length], ['In progress', prog.length], ['Consultations this week', week], ['Won', leads.filter((l) => l.status === 'won').length, 'good']])}
    ${sec('Needs a call', 'Soonest deadline first', needs, 'No new leads waiting. Nice work.')}
    ${sec('In progress', 'Called, consultation, proposal', prog, 'Nothing in progress.')}
    ${closed.length ? sec('Closed', 'Won, lost or not a fit', closed, '') : ''}`);
}

/* ---------- calendar ---------- */
async function vCalendar() {
  const data = await api('calendar');
  const today = istMidnight(Date.now());
  const c = S.cal || (S.cal = { mode: S.me.role === 'designer' ? 'week' : 'day', dayMs: today, designerId: S.me.designer_id || data.designers[0]?.id });
  c.data = data;
  if (!c.designerId) c.designerId = data.designers[0]?.id;
  drawCalendar();
}
function slotsFor(data, dayMs) {
  const wd = ist(dayMs + 12 * HOUR).wd;
  const h = data.hours[wd];
  if (!h) return null;
  const out = [];
  for (let m = h[0]; m < h[1]; m += data.slot_minutes) out.push({ min: m, ms: dayMs + m * MIN });
  return out;
}
function drawCalendar() {
  const c = S.cal, data = c.data;
  if (!data || S.route.name !== 'calendar') return;
  const now = Date.now(), today = istMidnight(now);
  c.dayMs = Math.min(Math.max(c.dayMs, today - DAY), today + 7 * DAY);
  const book = new Map(data.bookings.map((b) => [`${b.designer_id}|${Date.parse(b.start_at)}`, b]));
  const cellFor = (b, slot) => {
    if (!b) return `<div class="slot ${slot.ms + data.slot_minutes * MIN < now ? 'past' : ''} ${slot.ms <= now && now < slot.ms + data.slot_minutes * MIN ? 'now' : ''}"></div>`;
    if (b.busy) return '<div class="bk busy"><div class="nm">Busy</div></div>';
    return `<div class="bk ${b.tier || ''}" data-act="open" data-id="${b.call_row_id}" title="${esc(b.caller_name || '')}"><div class="nm">${esc(b.caller_name || 'Lead')}</div><div class="ar">${esc(b.area || '')}</div></div>`;
  };
  let grid = '', cols = 0, title = '';
  if (c.mode === 'day') {
    const slots = slotsFor(data, c.dayMs);
    title = `${day(c.dayMs + 6 * HOUR)}`;
    if (!slots) grid = '<div class="empty">The studio is closed on Sundays, so there are no slots.</div>';
    else {
      cols = data.designers.length;
      grid = `<div class="cal" style="grid-template-columns:76px repeat(${cols},minmax(112px,1fr))"><div class="hd tm corner"></div>${data.designers.map((d) => `<div class="hd ${d.id === S.me.designer_id ? 'me' : ''}">${esc(d.name)}${d.id === S.me.designer_id ? '&nbsp;(you)' : ''}</div>`).join('')}
        ${slots.map((s) => `<div class="tm">${hhmm(s.min)}</div>${data.designers.map((d) => cellFor(book.get(`${d.id}|${s.ms}`), s)).join('')}`).join('')}</div>`;
    }
  } else {
    const wd = ist(c.dayMs + 12 * HOUR).wd;
    const monday = c.dayMs - ((wd + 6) % 7) * DAY;
    const days = [0, 1, 2, 3, 4, 5].map((i) => monday + i * DAY);
    const d = data.designers.find((x) => x.id === c.designerId) || data.designers[0];
    title = `${esc(d?.name || '')}, week of ${day(monday + 6 * HOUR)}`;
    const ref = slotsFor(data, days[0]) || [];
    cols = days.length;
    grid = `<div class="cal" style="grid-template-columns:76px repeat(${cols},minmax(112px,1fr))"><div class="hd tm corner"></div>${days.map((m) => `<div class="hd ${m === today ? 'me' : ''}">${day(m + 6 * HOUR)}</div>`).join('')}
      ${ref.map((s) => `<div class="tm">${hhmm(s.min)}</div>${days.map((m) => cellFor(book.get(`${d.id}|${m + s.min * MIN}`), { ms: m + s.min * MIN })).join('')}`).join('')}</div>`;
  }
  render(`${pageHead({ icon: 'calendar', color: '#e56798', kicker: 'Calendar', title: 'Designer calendars', actions: `${data.next_designer ? `<span class="b b-info" title="The next qualified lead goes to this designer if they have a free slot">Next in rotation: ${esc(data.next_designer)}</span>` : ''}${refreshBtn}` })}
    <div class="card"><div class="toolbar">
      <div class="row"><button class="btn icon" data-act="cal-prev" aria-label="Previous">${ic('left')}</button><button class="btn" data-act="cal-today">Today</button><button class="btn icon" data-act="cal-next" aria-label="Next">${ic('right')}</button></div>
      <strong>${title}</strong>
      <div class="chips"><button class="chip ${c.mode === 'day' ? 'on' : ''}" data-act="cal-mode" data-m="day">Day, all designers</button><button class="chip ${c.mode === 'week' ? 'on' : ''}" data-act="cal-mode" data-m="week">Week, one designer</button></div>
      ${c.mode === 'week' ? `<select class="field" id="cal-designer" aria-label="Designer">${data.designers.map((d) => `<option value="${d.id}" ${d.id === c.designerId ? 'selected' : ''}>${esc(d.name)}${d.id === S.me.designer_id ? ' (you)' : ''}</option>`).join('')}</select>` : ''}
      <div class="legend right"><span><i style="background:#fde8e6;border-left:3px solid #ba0517"></i>Hot</span><span><i style="background:#fef0cd;border-left:3px solid #fe9339"></i>Priority</span><span><i style="background:#eaf5fe;border-left:3px solid #0176d3"></i>Standard</span><span><i style="background:#ecebea"></i>Busy</span></div>
    </div>${grid}</div>
    <p class="muted small">Times are India time. Slots are 30 minutes, ${S.me.role === 'designer' ? 'and you see other designers only as busy' : 'booked by the agent in rotation'}. Showing today and the next seven days.</p>`);
}

/* ---------- modal ---------- */
function modal({ title, body, confirm, danger, onConfirm, hideCancel }) {
  const el = document.createElement('div');
  el.className = 'overlay';
  el.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header>${esc(title)}<button class="btn icon right" data-close aria-label="Close" style="border:0">&times;</button></header>
    <div class="body">${body}<div id="m-err"></div></div>
    <footer>${hideCancel ? '' : '<button class="btn" data-close>Cancel</button>'}${confirm ? `<button class="btn ${danger ? 'danger' : 'brand'}" data-ok>${esc(confirm)}</button>` : ''}</footer></div>`;
  const close = () => { el.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  el.addEventListener('click', async (e) => {
    if (e.target === el || e.target.closest('[data-close]')) return close();
    if (e.target.closest('[data-ok]')) {
      const ok = e.target.closest('[data-ok]');
      ok.disabled = true;
      try { if (!onConfirm || (await onConfirm(el)) !== false) close(); } catch (err) { $('#m-err', el).innerHTML = `<div class="err-msg">${esc(err.message)}</div>`; }
      ok.disabled = false;
    }
  });
  document.addEventListener('keydown', onKey);
  document.body.append(el);
  const first = $('input,textarea', el); if (first) first.focus();
  return el;
}

/* ---------- actions ---------- */
const refreshNow = () => run(true);
async function guard(el, fn) {
  if (el) el.disabled = true;
  try { await fn(); } catch (e) { if (e.status !== 401) toast(e.message, 'err'); } finally { if (el && el.isConnected) el.disabled = false; }
}
const ACTIONS = {
  open: (el) => { location.hash = `#/call/${el.dataset.id}`; },
  refresh: () => run(true).then(() => { const u = $('#updated'); if (u) u.textContent = 'Updated just now'; }),
  logout: async () => { await api('logout', {}, { quiet: true }).catch(() => {}); S.me = null; showLogin(); },
  chpw: () => {
    $('#menu').classList.add('hide');
    modal({ title: 'Change password', body: passwordFields(false), confirm: 'Save password', onConfirm: async (m) => { const ok = await submitPassword(m); if (ok) toast('Password changed.'); return ok; } });
  },
  done: (el) => guard(el, async () => { await api('review', { id: Number(el.dataset.id), action: 'done' }); toast('Marked done.'); await refreshNow(); }),
  reviewed: (el) => guard(el, async () => { await api('review', { id: Number(el.dataset.id), action: 'reviewed' }); toast('Decline confirmed.'); await refreshNow(); }),
  reverse: (el) => {
    const id = Number(el.dataset.id), name = el.dataset.name;
    modal({
      title: 'Reverse this decline?',
      body: `<p style="margin-top:0">The agent declined <strong>${esc(name)}</strong>. This books them with the next designer in rotation and marks the lead <strong>Hot</strong>, so they are called within two working hours.</p>
        <label class="lbl" for="rv-note">Why was the decline wrong? (optional)</label><textarea class="field" id="rv-note" rows="3" maxlength="300" placeholder="For example: the caller was flexible on the date"></textarea>`,
      confirm: 'Reverse and book', danger: true,
      onConfirm: async (m) => {
        const r = await api('review', { id, action: 'reverse', note: $('#rv-note', m).value });
        toast(`Booked with ${r.designer}. Call by ${when(r.call_by)}.`);
        await refreshNow();
      },
    });
  },
  status: (el) => guard(el, async () => {
    const status = el.dataset.status;
    await api('set-status', { id: Number(el.dataset.id), status });
    toast(`Marked ${STATUS[status].toLowerCase()}.`);
    await refreshNow();
  }),
  rtab: (el) => { S.rtab = el.dataset.t; drawCall(); },
  'cal-prev': () => { S.cal.dayMs -= S.cal.mode === 'week' ? 7 * DAY : DAY; drawCalendar(); },
  'cal-next': () => { S.cal.dayMs += S.cal.mode === 'week' ? 7 * DAY : DAY; drawCalendar(); },
  'cal-today': () => { S.cal.dayMs = istMidnight(Date.now()); drawCalendar(); },
  'cal-mode': (el) => { S.cal.mode = el.dataset.m; drawCalendar(); },
  copy: async (el) => { try { await navigator.clipboard.writeText(el.dataset.text); toast('Copied.'); } catch (e) { toast('Copy it by hand.', 'err'); } },
};

/* ---------- wiring ---------- */
document.addEventListener('click', (e) => {
  const menu = $('#menu');
  if (menu && !e.target.closest('#menu') && !e.target.closest('#avatar')) menu.classList.add('hide');
  if (e.target.closest('#avatar')) { menu.classList.toggle('hide'); return; }
  if (e.target.closest('a[href]:not([href="#"])')) return;
  const el = e.target.closest('[data-act]');
  if (!el) return;
  e.preventDefault();
  const fn = ACTIONS[el.dataset.act];
  if (fn) fn(el);
});
document.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  if (form.id === 'login-form') {
    const btn = $('button', form); btn.disabled = true;
    try {
      const r = await api('login', { username: $('#u').value, password: $('#p').value }, { quiet: true });
      lsSet('aangan_user', r.user.username);
      S.me = r.user;
      if (S.me.must_change) showChange(true); else { showShell(); route(); }
    } catch (err) { $('#login-err').innerHTML = `<div class="err-msg" role="alert">${esc(err.message)}</div>`; btn.disabled = false; $('#p').select(); }
  } else if (form.id === 'change-form') {
    if (await submitPassword(form)) { toast('Password saved. Welcome.'); showShell(); route(); }
  }
});
document.addEventListener('change', (e) => {
  if (e.target.id === 'cal-designer') { S.cal.designerId = Number(e.target.value); drawCalendar(); }
});
window.addEventListener('hashchange', route);

(async function boot() {
  try { S.me = (await api('me', null, { quiet: true })).user; } catch (e) { S.me = null; }
  if (!S.me) return showLogin();
  if (S.me.must_change) return showChange(true);
  showShell();
  route();
})();
})();
