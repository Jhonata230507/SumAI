import type { CountryCode } from '@/types/country'
import type { FinancialProduct, ProductCategory, Provider } from '@/types/financial-product'

/**
 * Sample catalogue, used only when no products database is configured (local
 * development, previews). The lenders are fictional — not real institutions —
 * and the rates are illustrative, in line with each market's typical range.
 * Anything served from here is flagged `sample` so the UI labels it as such.
 *
 * Mirrors database/seed, with a few more lenders so every category has a real
 * choice to rank.
 */

const provider = (id: string, name: string, countryCode: CountryCode, rating: number): Provider => ({
  id,
  name,
  slug: id,
  logoUrl: null,
  countryCode,
  rating,
  websiteUrl: null,
})

const P = {
  // Colombia
  andino: provider('banco-andino', 'Banco Andino', 'co', 4.2),
  pacifico: provider('credito-pacifico', 'Crédito Pacífico', 'co', 3.9),
  cordillera: provider('cooperativa-cordillera', 'Cooperativa Cordillera', 'co', 4.4),
  altiplano: provider('financiera-altiplano', 'Financiera Altiplano', 'co', 3.7),
  // United States
  northbank: provider('northbank', 'Northbank', 'us', 4.4),
  harbor: provider('harbor-credit', 'Harbor Credit', 'us', 4.1),
  summit: provider('summit-lending', 'Summit Lending', 'us', 3.8),
  prairie: provider('prairie-credit-union', 'Prairie Credit Union', 'us', 4.6),
  // Canada
  maple: provider('maple-trust', 'Maple Trust', 'ca', 4.5),
  lakeshore: provider('lakeshore-bank', 'Lakeshore Bank', 'ca', 4.0),
  granite: provider('granite-credit-union', 'Granite Credit Union', 'ca', 4.3),
}

type Row = [
  provider: Provider,
  category: ProductCategory,
  name: string,
  rateMin: number,
  rateMax: number,
  termMin: number,
  termMax: number,
  amountMin: number,
  amountMax: number,
  fee: number,
  minScore: number | null,
  minIncome: number | null,
  maxDti: number | null,
]

const ROWS: Row[] = [
  // Colombia — rates effective annual (E.A.), amounts in COP.
  [P.andino, 'mortgage', 'Crédito Hipotecario', 0.115, 0.145, 60, 360, 50e6, 3e9, 0, 600, 24e6, 0.4],
  [P.cordillera, 'mortgage', 'Hipotecario Vivienda', 0.1235, 0.151, 60, 240, 40e6, 2e9, 0, 580, 20e6, 0.4],
  [P.pacifico, 'mortgage', 'Hipotecario Tasa Fija', 0.129, 0.159, 60, 300, 50e6, 2.5e9, 0, 620, 30e6, 0.35],
  [P.altiplano, 'mortgage', 'Vivienda Fácil', 0.138, 0.168, 60, 240, 30e6, 1.5e9, 0, 550, 18e6, 0.4],
  [P.pacifico, 'car-loan', 'Crédito de Vehículo', 0.149, 0.219, 12, 84, 10e6, 400e6, 0, 550, 18e6, 0.4],
  [P.andino, 'car-loan', 'Vehículo Nuevo', 0.1575, 0.205, 12, 72, 15e6, 500e6, 0, 600, 24e6, 0.4],
  [P.cordillera, 'car-loan', 'Crédito Movilidad', 0.1625, 0.225, 12, 84, 8e6, 300e6, 0, 520, 15e6, 0.45],
  [P.altiplano, 'car-loan', 'Carro Ya', 0.1795, 0.245, 12, 60, 5e6, 200e6, 0, 500, 12e6, 0.45],
  [P.pacifico, 'personal-loan', 'Crédito de Libranza', 0.179, 0.265, 12, 120, 1e6, 150e6, 0, 500, 12e6, 0.45],
  [P.cordillera, 'personal-loan', 'Libre Inversión', 0.1925, 0.27, 6, 84, 1e6, 120e6, 0, 520, 12e6, 0.45],
  [P.andino, 'personal-loan', 'Crédito Personal', 0.2075, 0.2799, 12, 72, 2e6, 200e6, 0, 600, 18e6, 0.4],
  [P.altiplano, 'personal-loan', 'Crédito Express', 0.2399, 0.2854, 6, 60, 500e3, 80e6, 0, 480, 10e6, 0.5],
  [P.andino, 'savings', 'Cuenta de Ahorros', 0.085, 0.105, 1, 600, 0, 5e9, 0, null, null, null],
  [P.cordillera, 'savings', 'Ahorro Programado', 0.0925, 0.11, 1, 600, 0, 3e9, 0, null, null, null],
  [P.altiplano, 'savings', 'Cuenta Digital', 0.0975, 0.115, 1, 600, 0, 2e9, 0, null, null, null],

  // United States — APR, amounts in USD.
  [P.northbank, 'mortgage', '30-Year Fixed', 0.0625, 0.0735, 180, 360, 80e3, 1.5e6, 1200, 680, 60e3, 0.43],
  [P.prairie, 'mortgage', 'Member Mortgage', 0.0599, 0.071, 120, 360, 50e3, 1e6, 900, 660, 45e3, 0.45],
  [P.harbor, 'mortgage', 'Fixed-Rate Home Loan', 0.0645, 0.0755, 120, 360, 60e3, 2e6, 0, 640, 40e3, 0.45],
  [P.summit, 'mortgage', 'FlexHome', 0.0679, 0.079, 120, 360, 50e3, 1.2e6, 1500, 620, 35e3, 0.5],
  [P.harbor, 'car-loan', 'Auto Loan', 0.0649, 0.1199, 24, 84, 5e3, 100e3, 0, 640, 30e3, 0.45],
  [P.prairie, 'car-loan', 'New & Used Auto', 0.0589, 0.1099, 24, 84, 5e3, 120e3, 0, 660, 28e3, 0.45],
  [P.northbank, 'car-loan', 'Drive Loan', 0.0699, 0.1249, 12, 72, 7.5e3, 150e3, 0, 620, 30e3, 0.43],
  [P.summit, 'personal-loan', 'Personal Loan', 0.0799, 0.2399, 12, 84, 2e3, 100e3, 500, 600, 25e3, 0.45],
  [P.prairie, 'personal-loan', 'Debt Consolidation', 0.0849, 0.1899, 12, 60, 1e3, 50e3, 0, 640, 30e3, 0.4],
  [P.harbor, 'personal-loan', 'Everyday Loan', 0.0999, 0.2499, 12, 72, 1e3, 35e3, 250, 580, 20e3, 0.5],
  [P.northbank, 'savings', 'High-Yield Savings', 0.041, 0.044, 1, 600, 0, 10e6, 0, null, null, null],
  [P.prairie, 'savings', 'Member Savings', 0.0425, 0.045, 1, 600, 0, 5e6, 0, null, null, null],
  [P.harbor, 'savings', 'Online Savings', 0.0395, 0.042, 1, 600, 0, 5e6, 0, null, null, null],

  // Canada — rates quoted like the US, amounts in CAD.
  [P.maple, 'mortgage', '5-Year Fixed', 0.0499, 0.0599, 60, 360, 50e3, 2e6, 0, 650, 50e3, 0.44],
  [P.granite, 'mortgage', 'Member Fixed', 0.0485, 0.0589, 60, 300, 50e3, 1.5e6, 0, 640, 45e3, 0.44],
  [P.lakeshore, 'mortgage', '5-Year Variable', 0.0525, 0.0625, 60, 300, 50e3, 1.5e6, 0, 620, 40e3, 0.44],
  [P.lakeshore, 'car-loan', 'Auto Financing', 0.0699, 0.1099, 24, 96, 5e3, 100e3, 0, 620, 30e3, 0.44],
  [P.granite, 'car-loan', 'Vehicle Loan', 0.0675, 0.1049, 12, 84, 5e3, 80e3, 0, 640, 30e3, 0.44],
  [P.maple, 'personal-loan', 'Personal Line', 0.0899, 0.1899, 12, 60, 2e3, 50e3, 0, 640, 30e3, 0.44],
  [P.granite, 'personal-loan', 'Consolidation Loan', 0.0949, 0.1799, 12, 60, 2e3, 40e3, 0, 620, 28e3, 0.44],
  [P.maple, 'savings', 'High-Interest Savings', 0.0325, 0.04, 1, 600, 0, 5e6, 0, null, null, null],
  [P.granite, 'savings', 'Member Savings', 0.0335, 0.039, 1, 600, 0, 5e6, 0, null, null, null],
]

const CURRENCY = { co: 'COP', us: 'USD', ca: 'CAD' } as const

export const SAMPLE_PRODUCTS: FinancialProduct[] = ROWS.map(
  ([
    prov,
    category,
    name,
    rateMin,
    rateMax,
    termMin,
    termMax,
    amountMin,
    amountMax,
    fee,
    minScore,
    minIncome,
    maxDti,
  ]) => ({
    id: `${prov.id}-${category}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    providerId: prov.id,
    provider: prov,
    category,
    name,
    countryCode: prov.countryCode,
    currency: CURRENCY[prov.countryCode],
    rateMin,
    rateMax,
    rateType: category === 'savings' ? 'variable' : 'fixed',
    termMonthsMin: termMin,
    termMonthsMax: termMax,
    amountMin,
    amountMax,
    originationFee: fee,
    eligibility: { minCreditScore: minScore, minIncome, maxDebtToIncome: maxDti, residencyRequired: false },
    featured: false,
    updatedAt: '2026-10-01T00:00:00.000Z',
  }),
)

/** The same filters the database query applies. */
export function findSampleProducts(query: {
  category: ProductCategory
  countryCode: CountryCode
  amount?: number
  termMonths?: number
}): FinancialProduct[] {
  return SAMPLE_PRODUCTS.filter(
    (p) =>
      p.category === query.category &&
      p.countryCode === query.countryCode &&
      (query.amount === undefined || (p.amountMin <= query.amount && p.amountMax >= query.amount)) &&
      (query.termMonths === undefined || (p.termMonthsMin <= query.termMonths && p.termMonthsMax >= query.termMonths)),
  ).sort((a, b) => a.rateMin - b.rateMin)
}

/** True when there is no products database to query. */
export function usingSampleCatalog(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}
