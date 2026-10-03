-- 003_products.sql
-- Providers and the products they offer. Readable by everyone, including
-- signed-out visitors; writes are service-role only.

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  country_code text not null check (country_code in ('co', 'us', 'ca')),
  rating numeric(2, 1) check (rating between 0 and 5),
  website_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  category text not null check (category in ('mortgage', 'car-loan', 'personal-loan', 'savings')),
  name text not null,
  country_code text not null check (country_code in ('co', 'us', 'ca')),
  currency text not null check (currency in ('USD', 'COP', 'CAD')),

  -- Rates are stored as fractions: 0.0725 is 7.25%.
  rate_min numeric(8, 6) not null check (rate_min >= 0),
  rate_max numeric(8, 6) not null check (rate_max >= 0),
  rate_type text not null default 'fixed' check (rate_type in ('fixed', 'variable')),

  term_months_min integer not null check (term_months_min > 0),
  term_months_max integer not null check (term_months_max > 0),
  amount_min numeric(14, 2) not null check (amount_min >= 0),
  amount_max numeric(14, 2) not null check (amount_max >= 0),
  origination_fee numeric(14, 2) not null default 0,

  min_credit_score integer,
  min_income numeric(14, 2),
  max_debt_to_income numeric(4, 3),
  residency_required boolean not null default false,

  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint products_rate_order check (rate_max >= rate_min),
  constraint products_term_order check (term_months_max >= term_months_min),
  constraint products_amount_order check (amount_max >= amount_min)
);

-- The exact shape of the catalogue query in features/products/find-products.
create index if not exists products_lookup_idx
  on public.products (category, country_code, active, rate_min);

create index if not exists products_provider_idx on public.products (provider_id);

alter table public.providers enable row level security;
alter table public.products enable row level security;

create policy "providers are public" on public.providers for select using (true);
create policy "active products are public" on public.products for select using (active);
