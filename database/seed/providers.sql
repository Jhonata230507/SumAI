-- providers.sql
-- Placeholder providers for local development. These are not real institutions
-- and carry no real rates; replace before anything ships to production.

insert into public.providers (name, slug, country_code, rating, website_url)
values
  ('Northbank',        'northbank',        'us', 4.4, 'https://example.com/northbank'),
  ('Harbor Credit',    'harbor-credit',    'us', 4.1, 'https://example.com/harbor'),
  ('Summit Lending',   'summit-lending',   'us', 3.8, 'https://example.com/summit'),
  ('Banco Andino',     'banco-andino',     'co', 4.2, 'https://example.com/andino'),
  ('Crédito Pacífico', 'credito-pacifico', 'co', 3.9, 'https://example.com/pacifico'),
  ('Maple Trust',      'maple-trust',      'ca', 4.5, 'https://example.com/maple'),
  ('Lakeshore Bank',   'lakeshore-bank',   'ca', 4.0, 'https://example.com/lakeshore')
on conflict (slug) do nothing;
