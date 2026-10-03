import type { Metadata } from 'next'
import { CalculatorHeader } from '@/components/calculator/CalculatorHeader'
import { RelatedCalculators } from '@/components/calculator/RelatedCalculators'
import { getCalculator } from '@/data/calculators/definitions'
import { getRequestContext } from '@/lib/i18n/server'
import { defaultAmountScale, getBenchmarks } from '@/lib/countries'
import { loanDefaults } from '@/features/calculators/loan/schema'
import { LoanCalculator } from './LoanCalculator'

const calculator = getCalculator('loan')

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestContext()
  const text = t.calculators[calculator.id]
  return { title: text.title, description: text.description, keywords: calculator.keywords }
}

export default async function LoanCalculatorPage() {
  const { country } = await getRequestContext()
  const benchmarks = getBenchmarks(country.code)

  const initial = {
    ...loanDefaults,
    amount: loanDefaults.amount * defaultAmountScale(country.code),
    annualRate: benchmarks.personalLoan,
    countryCode: country.code,
  }

  return (
    <LoanCalculator
      // Remount when the country changes, so amounts, currency and rate
      // defaults reset to the new market instead of keeping the old ones.
      key={country.code}
      country={country}
      initial={initial}
      header={<CalculatorHeader calculator={calculator} country={country} />}
      related={<RelatedCalculators calculatorId="loan" />}
    />
  )
}
