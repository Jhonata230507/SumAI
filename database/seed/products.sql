-- products.sql
-- Placeholder catalogue for local development. Rates are illustrative only.
-- Stored as fractions, matching the application: 0.0625 is 6.25%.

insert into public.products (
  provider_id, category, name, country_code, currency,
  rate_min, rate_max, rate_type,
  term_months_min, term_months_max,
  amount_min, amount_max, origination_fee,
  min_credit_score, min_income, max_debt_to_income, featured
)
select p.id, v.category, v.name, v.country_code, v.currency,
       v.rate_min, v.rate_max, v.rate_type,
       v.term_min, v.term_max,
       v.amount_min, v.amount_max, v.fee,
       v.min_score, v.min_income, v.max_dti, v.featured
from (values
  -- United States
  ('northbank',     'mortgage',      '30-Year Fixed',        'us', 'USD', 0.0625, 0.0735, 'fixed',    180, 360,   80000.0, 1500000.0, 1200.0, 680, 60000.0, 0.430, true),
  ('northbank',     'mortgage',      '15-Year Fixed',        'us', 'USD', 0.0585, 0.0680, 'fixed',    120, 180,   80000.0, 1500000.0, 1200.0, 700, 70000.0, 0.430, false),
  ('harbor-credit', 'car-loan',      'Auto Loan',            'us', 'USD', 0.0649, 0.1199, 'fixed',     24,  84,    5000.0,  100000.0,    0.0, 640, 30000.0, 0.450, true),
  ('summit-lending','personal-loan', 'Personal Loan',        'us', 'USD', 0.0799, 0.2399, 'fixed',     12,  84,    2000.0,   50000.0,  500.0, 600, 25000.0, 0.450, false),
  ('northbank',     'savings',       'High-Yield Savings',   'us', 'USD', 0.0410, 0.0440, 'variable',   1, 120,       0.0, 10000000.0,  0.0, null,    null,  null, true),

  -- Colombia (rates quoted effective annual)
  ('banco-andino',     'mortgage',      'Crédito Hipotecario',  'co', 'COP', 0.1150, 0.1450, 'fixed',    120, 240, 50000000.0, 1500000000.0, 0.0, 600, 24000000.0, 0.400, true),
  ('credito-pacifico', 'car-loan',      'Crédito de Vehículo',  'co', 'COP', 0.1490, 0.2190, 'fixed',     12,  72, 10000000.0,  300000000.0, 0.0, 550, 18000000.0, 0.400, false),
  ('credito-pacifico', 'personal-loan', 'Crédito de Libranza',  'co', 'COP', 0.1790, 0.2650, 'fixed',     12,  84,  1000000.0,  100000000.0, 0.0, 500, 12000000.0, 0.450, false),
  ('banco-andino',     'savings',       'Cuenta de Ahorros',    'co', 'COP', 0.0850, 0.1050, 'variable',   1, 120,        0.0, 5000000000.0, 0.0, null,       null,  null, true),

  -- Canada
  ('maple-trust',    'mortgage',      '5-Year Fixed',      'ca', 'CAD', 0.0489, 0.0579, 'fixed',    60, 360, 100000.0, 2000000.0, 900.0, 660, 65000.0, 0.440, true),
  ('lakeshore-bank', 'car-loan',      'Vehicle Financing', 'ca', 'CAD', 0.0699, 0.1099, 'fixed',    24,  96,   5000.0,  120000.0,   0.0, 630, 32000.0, 0.440, false),
  ('lakeshore-bank', 'savings',       'Savings Account',   'ca', 'CAD', 0.0375, 0.0425, 'variable',  1, 120,      0.0, 8000000.0,   0.0, null,    null,  null, false)
) as v (
  provider_slug, category, name, country_code, currency,
  rate_min, rate_max, rate_type, term_min, term_max,
  amount_min, amount_max, fee, min_score, min_income, max_dti, featured
)
join public.providers p on p.slug = v.provider_slug;
