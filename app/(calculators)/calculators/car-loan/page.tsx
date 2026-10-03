import type { Metadata } from 'next'
import { CalculatorHeader } from '@/components/calculator/CalculatorHeader'
import { RelatedCalculators } from '@/components/calculator/RelatedCalculators'
import { getCalculator } from '@/data/calculators/definitions'
import { getRequestContext } from '@/lib/i18n/server'
import { defaultAmountScale, getBenchmarks, getTypicalSalesTax } from '@/lib/countries'
import { carLoanDefaults } from '@/features/calculators/car-loan/schema'
import { CarLoanCalculator } from './CarLoanCalculator'

const calculator = getCalculator('car-loan')

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestContext()
  const text = t.calculators[calculator.id]
  return { title: text.title, description: text.description, keywords: calculator.keywords }
}

export default async function CarLoanCalculatorPage() {
  const { country } = await getRequestContext()
  const benchmarks = getBenchmarks(country.code)
  const scale = defaultAmountScale(country.code)

  const initial = {
    ...carLoanDefaults,
    vehiclePrice: carLoanDefaults.vehiclePrice * scale,
    downPayment: carLoanDefaults.downPayment * scale,
    feesAndRegistration: carLoanDefaults.feesAndRegistration * scale,
    salesTaxRate: getTypicalSalesTax(country.code),
    annualRate: benchmarks.carLoanNew,
    countryCode: country.code,
  }

  return (
    <CarLoanCalculator
      // Remount when the country changes, so amounts, currency and rate
      // defaults reset to the new market instead of keeping the old ones.
      key={country.code}
      country={country}
      initial={initial}
      header={<CalculatorHeader calculator={calculator} country={country} />}
      related={<RelatedCalculators calculatorId="car-loan" />}
    />
  )
}
