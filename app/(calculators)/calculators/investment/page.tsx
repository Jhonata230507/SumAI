import type { Metadata } from 'next'
import { CalculatorHeader } from '@/components/calculator/CalculatorHeader'
import { RelatedCalculators } from '@/components/calculator/RelatedCalculators'
import { getCalculator } from '@/data/calculators/definitions'
import { getRequestContext } from '@/lib/i18n/server'
import { defaultAmountScale, getBenchmarks } from '@/lib/countries'
import { investmentDefaults } from '@/features/calculators/investment/schema'
import { InvestmentCalculator } from './InvestmentCalculator'

const calculator = getCalculator('investment')

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestContext()
  const text = t.calculators[calculator.id]
  return { title: text.title, description: text.description, keywords: calculator.keywords }
}

export default async function InvestmentCalculatorPage() {
  const { country } = await getRequestContext()
  const benchmarks = getBenchmarks(country.code)
  const scale = defaultAmountScale(country.code)

  const initial = {
    ...investmentDefaults,
    initialAmount: investmentDefaults.initialAmount * scale,
    contribution: investmentDefaults.contribution * scale,
    inflationRate: benchmarks.inflation,
    countryCode: country.code,
  }

  return (
    <InvestmentCalculator
      // Remount when the country changes, so amounts, currency and rate
      // defaults reset to the new market instead of keeping the old ones.
      key={country.code}
      country={country}
      initial={initial}
      header={<CalculatorHeader calculator={calculator} country={country} />}
      related={<RelatedCalculators calculatorId="investment" />}
    />
  )
}
