create table if not exists designers (
  id serial primary key,
  name text not null unique,
  rr_order int not null unique,
  telegram_chat_id text,
  active boolean not null default true
);

create table if not exists rr_state (
  id int primary key default 1 check (id = 1),
  next_index int not null default 0
);

create table if not exists calls (
  id serial primary key,
  call_id text unique,
  created_at timestamptz not null default now(),
  caller_name text,
  caller_phone text,
  project_type text,
  area text,
  size_sqft int,
  timeline_text text,
  decision_maker text,
  source text,
  budget_note text,
  outcome text not null check (outcome in ('qualified','declined','escalated','missed','info_only')),
  decline_reason text,
  tier text check (tier in ('hot','priority','standard')),
  tier_reasons text,
  call_by timestamptz,
  designer_id int references designers(id),
  slot_start timestamptz,
  window_missed boolean not null default false,
  status text not null default 'new',
  summary text,
  transcript text,
  duration_sec int,
  cost_inr numeric(10,2),
  reviewed boolean not null default false,
  hubspot_deal_id text,
  telegram_message_id text
);

create table if not exists bookings (
  id serial primary key,
  designer_id int not null references designers(id),
  call_id int references calls(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  unique (designer_id, start_at)
);

create table if not exists status_events (
  id serial primary key,
  call_id int not null references calls(id),
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists calls_outcome_idx on calls (outcome, created_at desc);
