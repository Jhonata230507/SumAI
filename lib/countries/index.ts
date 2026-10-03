import type { CountryCode, CountryConfig } from '@/types/country'
import { colombia } from './colombia/config'
import { usa } from './usa/config'
import { canada } from './canada/config'
import colombiaData from '@/data/countries/colombia.json'
import usaData from '@/data/countries/usa.json'
import canadaData from '@/data/countries/canada.json'

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  co: colombia,
  us: usa,
  ca: canada,
}

export const COUNTRY_LIST = Object.values(COUNTRIES)

export const DEFAULT_COUNTRY: CountryCode = 'us'

export function isCountryCode(value: string): value is CountryCode {
  return value in COUNTRIES
}

/**
 * Resolves a country from anything the edge gives us — a cookie, a geo header,
 * a query param — and never throws. An unknown value falls back to the default
 * rather than breaking a calculation.
 */
export function resolveCountry(value: string | null | undefined): CountryConfig {
  if (!value) return COUNTRIES[DEFAULT_COUNTRY]
  const normalized = value.toLowerCase()

  if (isCountryCode(normalized)) return COUNTRIES[normalized]

  const aliases: Record<string, CountryCode> = {
    colombia: 'co',
    usa: 'us',
    'united-states': 'us',
    canada: 'ca',
  }

  const aliased = aliases[normalized]
  return aliased ? COUNTRIES[aliased] : COUNTRIES[DEFAULT_COUNTRY]
}

export function getCountry(code: CountryCode): CountryConfig {
  return COUNTRIES[code]
}

export interface CountryBenchmarks {
  mortgage30Year: number
  mortgage15Year: number
  carLoanNew: number
  carLoanUsed: number
  personalLoan: number
  savingsHighYield: number
  inflation: number
}

const BENCHMARKS: Record<CountryCode, CountryBenchmarks> = {
  co: colombiaData.benchmarks,
  us: usaData.benchmarks,
  ca: canadaData.benchmarks,
}

/** Illustrative market rates used to seed calculator defaults. Not offers. */
export function getBenchmarks(code: CountryCode): CountryBenchmarks {
  return BENCHMARKS[code]
}

/** Typical sales tax, used as the car-loan default. */
export function getTypicalSalesTax(code: CountryCode): number {
  const data = { co: colombiaData, us: usaData, ca: canadaData }[code]
  return data.rules.typicalSalesTaxRate
}

/**
 * Rough scale for default amounts, so a Colombian visitor opens the mortgage
 * calculator on a plausible COP figure rather than 420,000 pesos. Only ever
 * used for starting values — never in a calculation.
 */
export function defaultAmountScale(code: CountryCode): number {
  return code === 'co' ? 4_000 : 1
}

export { colombia, usa, canada }
