-- 002_profiles.sql
-- Optional financial profile. Every column is nullable: the product works
-- without any of it, and each field is something the user chose to share.

create table if not exists public.profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  country_code text not null default 'us' check (country_code in ('co', 'us', 'ca')),
  monthly_income numeric(14, 2) check (monthly_income >= 0),
  monthly_expenses numeric(14, 2) check (monthly_expenses >= 0),
  existing_debt_payments numeric(14, 2) check (existing_debt_payments >= 0),
  credit_score integer check (credit_score between 150 and 950),
  savings_balance numeric(14, 2) check (savings_balance >= 0),
  risk_tolerance text check (risk_tolerance in ('conservative', 'balanced', 'aggressive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles owner full access"
  on public.profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
