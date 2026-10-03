import type { Metadata } from 'next'
import { CalculatorHeader } from '@/components/calculator/CalculatorHeader'
import { RelatedCalculators } from '@/components/calculator/RelatedCalculators'
import { getCalculator } from '@/data/calculators/definitions'
import { getRequestContext } from '@/lib/i18n/server'
import { defaultAmountScale, getBenchmarks } from '@/lib/countries'
import { mortgageDefaults } from '@/features/calculators/mortgage/schema'
import { MortgageCalculator } from './MortgageCalculator'

const calculator = getCalculator('mortgage')

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestContext()
  const text = t.calculators[calculator.id]
  return { title: text.title, description: text.description, keywords: calculator.keywords }
}

export default async function MortgageCalculatorPage() {
  const { country } = await getRequestContext()
  const benchmarks = getBenchmarks(country.code)
  const scale = defaultAmountScale(country.code)

  const homePrice = mortgageDefaults.homePrice * scale

  const initial = {
    ...mortgageDefaults,
    homePrice,
    // Start at the country minimum down payment, so the default is a realistic purchase.
    downPayment: Math.round(homePrice * Math.max(country.rules.minDownPaymentRatio, 0.2)),
    propertyTaxAnnual: mortgageDefaults.propertyTaxAnnual * scale,
    homeInsuranceAnnual: mortgageDefaults.homeInsuranceAnnual * scale,
    annualRate: benchmarks.mortgage30Year,
    termMonths: country.rules.commonLoanTermsMonths.at(-1) ?? 360,
    countryCode: country.code,
  }

  return (
    <MortgageCalculator
      // Remount when the country changes, so amounts, currency and rate
      // defaults reset to the new market instead of keeping the old ones.
      key={country.code}
      country={country}
      initial={initial}
      header={<CalculatorHeader calculator={calculator} country={country} />}
      related={<RelatedCalculators calculatorId="mortgage" />}
    />
  )
}
