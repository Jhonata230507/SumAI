-- 007_events.sql
-- Server-side event log. PostHog covers product analytics; this table exists for
-- things that must be durable and attributable: outbound product clicks that
-- may carry a payout, and AI usage for cost tracking.

create table if not exists public.events (
  id bigserial primary key,
  user_id uuid references public.users (id) on delete set null,
  -- Kept for signed-out visitors, who have no user_id.
  anonymous_id text,
  name text not null,
  properties jsonb not null default '{}'::jsonb,
  country_code text check (country_code in ('co', 'us', 'ca')),
  created_at timestamptz not null default now()
);

create index if not exists events_name_time_idx on public.events (name, created_at desc);
create index if not exists events_user_idx on public.events (user_id, created_at desc);

create table if not exists public.ai_usage (
  id bigserial primary key,
  user_id uuid references public.users (id) on delete set null,
  feature text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_time_idx on public.ai_usage (created_at desc);

alter table public.events enable row level security;
alter table public.ai_usage enable row level security;

-- No public policies: both tables are written by the service role only, and
-- read through the admin client. Users cannot read their own rows here.
