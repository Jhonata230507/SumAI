-- 006_goals.sql
-- Savings and payoff goals, plus the contribution history behind the progress bar.

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  type text not null check (type in ('savings', 'debt-free', 'purchase', 'retirement')),
  target_amount numeric(14, 2) not null check (target_amount > 0),
  current_amount numeric(14, 2) not null default 0 check (current_amount >= 0),
  target_date date,
  monthly_contribution numeric(14, 2) check (monthly_contribution >= 0),
  annual_return numeric(8, 6) not null default 0.04,
  linked_scenario_id uuid references public.scenarios (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  amount numeric(14, 2) not null,
  occurred_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists goals_user_idx on public.goals (user_id, created_at desc);
create index if not exists goal_contributions_goal_idx
  on public.goal_contributions (goal_id, occurred_on desc);

alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;

create policy "goals owner full access"
  on public.goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Contributions inherit their owner from the parent goal.
create policy "goal contributions follow the goal"
  on public.goal_contributions for all
  using (
    exists (
      select 1 from public.goals g
      where g.id = goal_contributions.goal_id and g.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.goals g
      where g.id = goal_contributions.goal_id and g.user_id = auth.uid()
    )
  );
