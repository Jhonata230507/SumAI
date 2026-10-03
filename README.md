# SumAI

Financial calculators that explain their own numbers, for Colombia, the United States and Canada.

Every figure is computed by deterministic, tested code. An AI layer explains results in plain language but never computes or invents a number.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn-style primitives in `components/ui` |
| Data | Supabase (Postgres + Auth, row-level security) |
| AI | Anthropic via the Vercel AI SDK |
| Charts | Recharts |
| Validation | Zod |
| Analytics | PostHog |
| Tests | Vitest (unit and integration), Playwright (e2e) |

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the keys
npm run dev
```

The public calculators run with no environment variables at all. Supabase is needed for sign-in, saved scenarios, goals and the product catalogue. An Anthropic key is needed for the AI features.

### Database

Run the migrations in order, then the seeds:

```bash
supabase db reset          # applies database/migrations/*.sql
psql "$DATABASE_URL" -f database/seed/countries.sql
psql "$DATABASE_URL" -f database/seed/providers.sql
psql "$DATABASE_URL" -f database/seed/products.sql
npm run db:types           # regenerate database/types.ts after any migration
```

The seeded providers and products are **placeholders**. They are not real institutions and their rates are illustrative.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` | Production build |
| `npm test` | Unit and integration tests |
| `npm run test:e2e` | Playwright smoke tests (starts the dev server) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Project layout

```
app/            Routes. Route groups split marketing, calculators, products and the signed-in app.
components/     UI. `ui/` holds primitives; the other folders are grouped by feature.
features/       Business logic: calculator maths, product ranking, scenarios, goals, AI prompts.
lib/            Infrastructure: core maths, country config, Supabase and AI clients, formatters.
data/           Reference data: country benchmarks and the calculator registry.
database/       SQL migrations, seeds and the generated database types.
content/        Editorial and SEO copy, as Markdown.
tests/          Cross-feature tests. Per-calculator tests live beside each calculator.
types/          Shared domain types.
```

Files that sit beside a `page.tsx` (for example `LoanCalculator.tsx`, `actions.ts`) are private to that route. Next.js does not route them.

## Conventions that matter

These are the rules most likely to cause a wrong number if they are broken.

**Rates are fractions everywhere.** `0.0725` means 7.25%. The only conversion to and from a percentage happens in `PercentageInput` and `formatPercent`. Validation caps rates at `1` to catch a 7.25 that should have been 0.0725.

**Countries quote rates differently.** The US quotes a nominal annual rate compounded monthly. Colombia quotes an effective annual rate (E.A.). Every calculator gets its periodic rate from `toPeriodicRate` in `lib/calculations/interest.ts`, which reads `quotesEffectiveAnnualRate` from the country rules. Do not divide an annual rate by 12 directly.

**Money is rounded at the edges.** Values that reach a user or a database row go through `roundMoney`. Display formatting goes through `formatCurrency`, never `toFixed`, because COP shows no decimals.

**The model never computes.** Prompts pass the computed figures as authoritative context (`features/ai/prompts.ts`). Every call goes through `lib/ai/client.ts`, which prepends the safety preamble and screens the output. If you add an AI feature, route it through that client.

**Consumer rates have their own rule.** Savings and credit-card rates follow `consumerRatesEffective` in the country rules (E.A. in Colombia, nominal in the US and Canada), separate from `quotesEffectiveAnnualRate`, which only governs loans. Rate fields use `RateInput`, which offers Colombian visitors an E.A. / M.V. switch while the calculators keep working in E.A.

**Language follows the country.** Choosing Colombia (COP) renders the whole interface in Spanish; the United States and Canada are English. Each country config has a `language`, and every visible string lives in `lib/i18n/dictionaries/` — `en.ts` is the source of truth and `es.ts` is type-checked against it, so a missing translation fails the build. Server pages use `getRequestContext()` from `lib/i18n/server`; client components use `useI18n()` from `lib/i18n/client`. Never hard-code UI text in a component. Validation messages are keys, translated by `useCalculator`, and AI answers are told to reply in the page language.

**Calculators are the registry.** `data/calculators/definitions.ts` drives navigation, the index page, related links and metadata. Add a new calculator there first.

## Adding a calculator

1. Add the id to `CALCULATOR_IDS` in `types/common.ts`.
2. Create `features/calculators/<id>/` with `types.ts`, `schema.ts`, `calculation.ts` and `tests/`.
3. Register it in `data/calculators/definitions.ts`.
4. Add its comparable fields to `COMPARABLE_FIELDS` in `features/scenarios/calculate-difference.ts`.
5. Add the route: `app/(calculators)/calculators/<id>/page.tsx` plus a client component that uses `useCalculator`.
6. Update the `calculator_id` check constraint in a new migration.

## Known gaps

- **Sign-in UI.** The middleware protects the app area and the Supabase clients are wired, but there is no sign-in page or auth callback route yet. "Sign in" buttons link to `/dashboard`, which redirects signed-out visitors.
- **Saving from a calculator.** `ScenarioPanel` and `POST /api/scenarios` exist but are not yet mounted on the calculator pages.
- **Reopening a scenario.** The scenario page links to its calculator with the inputs as query params, but calculator pages do not read `searchParams` yet.
- **Rate limiting.** The AI routes have no per-user limit. Add one before launch; each call is a paid model request.
- **Content rendering.** `content/` is Markdown with frontmatter. Nothing renders it yet. Add an MDX pipeline or a Markdown loader.
- **Pricing.** The tiers on `/pricing` are placeholders.
- **Spanish editorial content.** The Markdown in `content/` is English only.
- **Dark mode for charts.** Tokens are defined for both modes in `components/charts/theme.ts`, but the charts currently always use the light set.

## Disclaimer

SumAI provides general financial information and estimates, not financial advice. Rates shown are illustrative and are not offers of credit.
