-- 004_rates.sql
-- Time series of benchmark and per-product rates, so a calculator can show
-- today's number and a product page can show where it has been.

create table if not exists public.rates (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete cascade,
  -- Set when the row is a market benchmark rather than a product rate.
  benchmark text,
  country_code text not null check (country_code in ('co', 'us', 'ca')),
  category text not null check (category in ('mortgage', 'car-loan', 'personal-loan', 'savings')),
  rate numeric(8, 6) not null check (rate >= 0),
  effective_date date not null,
  source text,
  created_at timestamptz not null default now(),

  constraint rates_target check (product_id is not null or benchmark is not null)
);

create unique index if not exists rates_product_day_idx
  on public.rates (product_id, effective_date)
  where product_id is not null;

create index if not exists rates_benchmark_idx
  on public.rates (country_code, category, effective_date desc);

alter table public.rates enable row level security;
create policy "rates are public" on public.rates for select using (true);
