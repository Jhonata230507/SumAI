-- 005_scenarios.sql
-- Saved calculator runs. Inputs and results are stored as jsonb because the
-- shape differs per calculator, and the calculation code is the schema of record.

create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  calculator_id text not null check (
    calculator_id in ('loan', 'mortgage', 'car-loan', 'investment', 'savings', 'debt-payoff')
  ),
  name text not null check (char_length(name) between 1 and 120),
  inputs jsonb not null default '{}'::jsonb,
  results jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scenarios_user_idx
  on public.scenarios (user_id, updated_at desc);

create index if not exists scenarios_calculator_idx
  on public.scenarios (user_id, calculator_id);

alter table public.scenarios enable row level security;

create policy "scenarios owner full access"
  on public.scenarios for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
