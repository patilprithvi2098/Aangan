# Prompt to rebuild the Aangan Studio phone enquiry system

Paste everything below the line into a fresh Claude Code session in an empty folder. Fill the three `[...]` placeholders first.

---

## 1. Role and goal

You are building, end to end, a working product for a case study: **Case 03, "Nikhil: Unanswered Enquiries"**, for **Aangan Studio**, an interior design studio in Pune with 14 designers and about 200 enquiries a month. 48% of enquiries get no answer within 48 hours. Scope is **incoming phone calls only**.

Build it with the seriousness of a real product, not a demo. Deliver:

1. A **voice agent named Chayya** that acts as the studio's one front-desk person, built on the **Vaani** platform (app.vaanivoice.ai).
2. A **backend** (Postgres plus an HTTP API) that the agent's tools call.
3. A **designer dashboard** (web, light, Salesforce-inspired) for the 14 designers, plus a separate **test login for Chayya**.
4. A **HubSpot** setup for the founder (Nikhil), separate from the dashboard.
5. Realistic **demo data** for every designer, clearly flagged and removable.
6. Documentation an evaluator can follow, including how the project data gets into the system.

Ask me before anything that spends money, sends messages to real people, or deletes data. Never print secrets (API keys, tokens, DB URLs). Keep them in a gitignored `.env`.

Placeholders I will give you: `[GITHUB repo name]`, `[my email for HubSpot/Vaani logins]`, `[the class notes / meeting transcript, pasted]`.

## 2. Business rules the agent must follow

- Chayya answers every call, in **English by default**, and switches to **Hindi or Marathi only when the caller clearly speaks it in a full sentence**.
- Studio does **full design and execution** for homes and small offices. It does **not** do advice-only work, restaurants or hospitality.
- Service area: **Pune and Pimpri Chinchwad (PCMC)**. Anything else is politely declined after reading the area back to confirm.
- Timeline: execution needs lead time; a request to finish in a few weeks is declined with a later start offered.
- Questions are asked **one at a time, in a fixed order**: what they need, where the property is, size and whether new or lived-in, when they want to start, who decides and whether they will attend, how they heard about the studio, then name and number. Read the details back and get a yes.
- **Never guess a fact.** If unsure, say the designer will confirm. **Never repeat a sentence.**
- **Tiers**: Hot, Priority, Standard, from timeline, decision-maker and source. Hot leads are called within two working hours, with a "call-by" deadline.
- **Booking**: round robin over 14 designers, working hours Mon to Sat 10:00 to 19:00 IST, 30-minute consultation slots, never over a designer's existing visit or meeting (multi-slot bookings expand). If no slot fits before the call-by deadline, book the earliest and flag `window_missed`.
- **Escalation**: existing client unhappy or asking for Nikhil or a senior person gets a Telegram alert and a promised callback within 15 minutes.
- **Declines are reviewable**: a designer can mark "looks right" or **reverse** a decline, which books the lead as Hot with the next designer. A wrongly declined lead is the costliest mistake.

## 3. Architecture (use exactly this)

- **Database:** Neon Postgres (project `[name]`). Schema in `db/schema.sql`, applied by `scripts/migrate.js` (statements split on `;` plus newline). Tests run on **PGlite** (in-memory).
- **API:** a Hono app (`src/index.ts`) deployed as a **Neon Function** with `neon deploy --env .env`. Request handlers live in `handlers/*.js` as plain functions wrapped by `route({method, auth, roles, pendingChangeOk}, fn)` in `lib/http.js`. `server.js` is a local dev server using the same handlers (`--local` uses PGlite, `--demo` seeds demo data).
- **Front end:** static `public/index.html`, `app.css`, `app.js` (plain JavaScript, no build step, everything escaped with `esc()`). `scripts/build-pages.js` embeds them into `src/pages.ts` for the Neon function.
- **Hosting:** **Vercel** project serving `public/` and proxying `/api/:path*` to the Neon function through `vercel.json` rewrites (so no env vars are needed on Vercel). Auto-deploys from GitHub `main`.
- **Agent tools:** authenticated with an `x-api-key` header (`AGENT_API_KEY`). Staff APIs use session cookies.
- **Notifications:** Telegram bot to designers (all share one chat id for now), saved WhatsApp drafts (WhatsApp is not connected, so messages are stored as `not_sent`), HubSpot deals.

### Tables
`designers, rr_state, calls, bookings, status_events, users, sessions, projects, project_designs, project_photos, messages, files`. Calls carry outcome (qualified, declined, escalated, missed, info_only), tier, call_by, designer, slot, status, summary, transcript, recording_url, hubspot_deal_id, is_demo. Bookings carry kind (consultation, site_visit, design_review, client_meeting, vendor, measurement, handover), title, project_id, location, is_demo. Files are stored in Postgres as bytea.

### Agent endpoints (key auth)
`POST /api/check-area`, `/api/book` (qualifies, tiers, assigns, books, notifies, creates the HubSpot deal), `/api/log-call` (declined, escalated, missed, info), `/api/call-update` (attach transcript and recording), `/api/telegram` (webhook with its own secret). `GET /api/health`.

## 4. Authentication and roles

- **PBKDF2-SHA256**, 100k iterations, WebCrypto. Random 32-byte session tokens; only their SHA-256 is stored. Cookie `aangan_session`: HttpOnly, SameSite=Lax, Secure when not localhost, 12-hour sessions.
- Lockout after 5 wrong passwords for 10 minutes. Constant-time check even for unknown usernames. POSTs must be `application/json` (CSRF defence).
- Password rule for self-chosen passwords: at least 10 characters, letter plus digit, not containing the username. One-time passwords are generated, `must_change` forces a change at first login.
- **Roles:** `designer` (14 logins, username is the lowercase first name) and `chayya` (one login for the voice agent test console). **There is no front-desk role: the voice agent replaces the front desk.**
- For this class demo I set every password to `1234567890` directly in the database, bypassing the rule. Record this in `credentials.local.txt` (gitignored) and flag it as weak.
- Designers see **only their own** leads, projects and files. The calendar shows other designers as "busy". The "Needs attention" queue is shared. Chayya reads every call but cannot open leads, projects or calendars or change anything. Every designer-only handler declares `roles: ['designer']`.

## 5. Designer dashboard

Light Salesforce-style UI, responsive down to phone width. Tabs: **My leads, My projects, Needs attention, Calendar**.

- **My leads:** my qualified leads with tier, call-by countdown, status path (new, accepted, called, held, proposal, won), actions (accept, mark called, consultation held, proposal sent, won, lost, not a fit). Won leads can start a project. Moves sync to the HubSpot deal stage.
- **Needs attention:** escalations (15-minute callback), missed calls, declines to check (reverse or "looks right").
- **Call view:** details, transcript and recording (or a link to Vaani History), activity timeline including Chayya's messages.
- **Calendar:** day and week grid, multi-slot spans, working hours, others shown as busy; add events (site visit, design review, client meeting, vendor, measurement, handover) with overlap and hours checks.
- **My projects:** list plus detail with Overview (stage, progress, target date, value, summary), Designs, Site photos, Messages. **Upload spaces**: photos (JPEG, PNG, WebP) and designs (also PDF), 2.5 MB cap, client-side canvas resize to 1600 px, server content sniffing, SVG refused, served through an authenticated `/api/file?id=` with a sandbox CSP. Create-project and edit-project modals; value and close date push to the HubSpot deal. A `won_without_project` list nudges designers.
- **Do not put HubSpot in the dashboard.** It is a separate tool for the founder.

## 6. Chayya test console (login `chayya`)

A single page "Voice agent" showing: last-24-hour counts (excluding demo data), next designer in rotation, a **Talk to Chayya** card (button to open the Vaani agent's test page plus steps to start a web RTC audio call, and a script of lines in English, Hindi, Marathi, one that should decline, one that should escalate), a **Calls handled** list refreshing every 5 seconds with per-call checks (assigned, slot booked, Telegram sent, WhatsApp draft saved, HubSpot deal), an "include demo data" toggle, and a connections panel (Telegram, HubSpot, WhatsApp not connected). State honestly that Vaani cannot embed its call widget in a website yet ("Deploy on a Website" shows Coming soon), and that live-call transcripts stay in Vaani History until a Vaani API key is connected.

## 7. Demo data (realistic, flagged, removable)

Seeded, deterministic generator under `lib/demo/*`, run with `node scripts/seed-demo.js` and removed with `--remove`. Every row has `is_demo = true`.

- For **all 14 designers**: ongoing projects across stages (design, approvals, execution, finishing, handover) with Pune society names, areas, customer names, values, targets and summaries.
- Calendars for yesterday plus the next seven days: site visits, design reviews, client meetings, showroom trips, measurements, handovers, and consultations for open leads. No overlaps, 30-minute travel gaps, plenty of free time left. **Keep Aryan's first working morning free** so a live call can book into it (Aryan is the walk-through example).
- About 85 calls with realistic English and Hinglish transcripts (booked, declined, escalated, info-only, dropped).
- **Customer messages from Chayya** (Telegram and saved WhatsApp) at each project stage.
- Dummy designs (generated SVG floor plans and mood boards) and **site photos downloaded from the web**, credited in `public/photos/CREDITS.md`.
- Document `docs/how-the-data-gets-here.md`: calls arrive through the agent tools, projects through designer uploads and forms, and demo data through the seed script.

## 8. HubSpot (founder's view)

- Use a **service key** (HubSpot's newer replacement for private apps) on the account's API base `api.hubapi.com`. Store as `HUBSPOT_TOKEN`.
- Create 8 custom deal properties (`aangan_*`) with `scripts/hubspot-properties.js`. Map statuses to the default pipeline stages. Retry on 429. Batch update endpoint where possible.
- Every booked call creates a deal associated to a contact; moves in the dashboard move the deal. Backfill script for deals that failed.
- Create a founder **reports dashboard** (pipeline by stage, leads by tier, by source, by designer, won value). Set deal close dates so date-filtered tiles are not empty. Seed the 75 demo deals so every tile has data.

## 9. Vaani voice agent (configure in the Vaani UI)

Agent name `aangan-studio-enquiry-agent`, persona **Chayya**, female voice, Indian accent.

- **Language:** Hindi main with English fallback. **STT:** Sarvam saaras:v3 (covers Hindi, Marathi, English), AssemblyAI fallback. **LLM:** gpt-4o main, Groq llama-3.3-70b fallback (primary and fallback providers must differ). **TTS:** Cartesia sonic-3.5 voice Arushi, fallback Sarvam bulbul:v3 ritu (voices must match the Sarvam model; switching language resets providers, so re-check them). **Pronunciation:** Chayya as "Chaaya". Keep keywords for studio and place names.
- **Greeting:** "Namaste, you've reached Aangan Studio. This is Chayya. How can I help you today?"
- **Prompt** (about 6.5k characters, in `docs/agent-prompt.md`): identity, voice style (short sentences, one question at a time, digits spoken one by one), language rule, the ordered questions (a) to (g), read-back, never guess, never repeat, decline and escalation scripts, tool-use rules.
- **Tools** (HTTP actions with the `x-api-key` header): check_area, book_consultation, log_call. Knowledge base from `docs/knowledge-base/aangan-knowledge.md`.
- Save with cmd+s and verify on the Overview page. Pitfalls seen: pasted text sometimes does not replace the old text, and edits are lost on navigation, so verify length and content afterwards. Test with the web (RTC) Audio call, with headphones in a quiet room, and review Vaani History after each call.

## 10. Quality bar

- Automated tests (node:test) for tiers, slots, area check, store, auth, API, demo data. All must pass before each deploy. Include tests that roles are enforced (designers cannot see each other's leads; Chayya cannot touch designer pages).
- Secrets only in `.env`; `credentials.local.txt` and `.data` gitignored. Never log or echo tokens.
- Commit in small steps; commit messages end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- After each deploy, verify the live URL (login, a key endpoint, the page) rather than assuming.
- Finish with `docs/SETUP.md` (status, how to run, how to reset), a one-page briefing for the evaluator, and a list of known gaps: no real phone number yet (paid), WhatsApp not connected, Vaani transcripts not synced (needs a Vaani API key), shared Telegram chat, weak demo password, hygiene items (rotate DB password and Telegram token, revoke unused API keys).

## 11. Order of work

1. Read the class notes `[pasted]` and restate the requirements and the open questions. 2. Schema, store logic, tiers, slots, area check, tests. 3. Agent endpoints and Telegram. 4. Auth and roles. 5. Dashboard and project uploads. 6. Demo seed. 7. Deploy Neon, Vercel, GitHub. 8. HubSpot properties, deals, founder dashboard. 9. Vaani agent configuration and test calls. 10. Chayya test console. 11. Documentation and final verification.
