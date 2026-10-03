-- countries.sql
-- Reference rows for the three launch markets. The authoritative config lives
-- in lib/countries; this table exists so SQL reports can join on it.

create table if not exists public.countries (
  code text primary key check (code in ('co', 'us', 'ca')),
  name text not null,
  currency text not null,
  locale text not null,
  quotes_effective_annual_rate boolean not null,
  max_debt_to_income numeric(4, 3) not null,
  min_down_payment_ratio numeric(4, 3) not null
);

insert into public.countries (code, name, currency, locale, quotes_effective_annual_rate, max_debt_to_income, min_down_payment_ratio)
values
  ('co', 'Colombia',      'COP', 'es-CO', true,  0.400, 0.300),
  ('us', 'United States', 'USD', 'en-US', false, 0.430, 0.200),
  ('ca', 'Canada',        'CAD', 'en-CA', true,  0.440, 0.050)
on conflict (code) do update set
  name = excluded.name,
  currency = excluded.currency,
  locale = excluded.locale,
  quotes_effective_annual_rate = excluded.quotes_effective_annual_rate,
  max_debt_to_income = excluded.max_debt_to_income,
  min_down_payment_ratio = excluded.min_down_payment_ratio;

alter table public.countries enable row level security;
create policy "countries are public" on public.countries for select using (true);
