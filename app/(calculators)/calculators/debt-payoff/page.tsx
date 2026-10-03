import type { Metadata } from 'next'
import { CalculatorHeader } from '@/components/calculator/CalculatorHeader'
import { RelatedCalculators } from '@/components/calculator/RelatedCalculators'
import { getCalculator } from '@/data/calculators/definitions'
import { getRequestContext } from '@/lib/i18n/server'
import { defaultAmountScale } from '@/lib/countries'
import { debtPayoffDefaults } from '@/features/calculators/debt-payoff/schema'
import { DebtPayoffCalculator } from './DebtPayoffCalculator'

const calculator = getCalculator('debt-payoff')

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestContext()
  const text = t.calculators[calculator.id]
  return { title: text.title, description: text.description, keywords: calculator.keywords }
}

export default async function DebtPayoffCalculatorPage() {
  const { country, t } = await getRequestContext()
  const scale = defaultAmountScale(country.code)

  const initial = {
    ...debtPayoffDefaults,
    debts: debtPayoffDefaults.debts.map((debt) => ({
      ...debt,
      name: t.debtPayoff.defaultNames[debt.id] ?? debt.name,
      balance: debt.balance * scale,
      minimumPayment: debt.minimumPayment * scale,
    })),
    monthlyBudget: debtPayoffDefaults.monthlyBudget * scale,
    countryCode: country.code,
  }

  return (
    <DebtPayoffCalculator
      // Remount when the country changes, so amounts, currency and rate
      // defaults reset to the new market instead of keeping the old ones.
      key={country.code}
      country={country}
      initial={initial}
      header={<CalculatorHeader calculator={calculator} country={country} />}
      related={<RelatedCalculators calculatorId="debt-payoff" />}
    />
  )
}
