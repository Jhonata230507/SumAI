import type { Metadata } from 'next'
import { defaultAmountScale, getBenchmarks } from '@/lib/countries'
import { getRequestContext } from '@/lib/i18n/server'
import { CompareOffers } from './CompareOffers'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestContext()
  return { title: t.compare.metaTitle, description: t.compare.metaDescription }
}

export default async function ComparePage() {
  const { country, t } = await getRequestContext()
  const rate = getBenchmarks(country.code).personalLoan
  const scale = defaultAmountScale(country.code)

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">{t.compare.title}</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">{t.compare.intro}</p>

      <CompareOffers
        // Remount when the country changes, so amounts, currency and rate
        // defaults reset to the new market instead of keeping the old ones.
        key={country.code}
        country={country}
        amount={20_000 * scale}
        initialOffers={[
          { id: 'a', name: t.compare.offer('A'), annualRate: rate, termMonths: 60, fee: 0 },
          {
            id: 'b',
            name: t.compare.offer('B'),
            annualRate: Math.max(0, rate - 0.015),
            termMonths: 60,
            fee: 600 * scale,
          },
          { id: 'c', name: t.compare.offer('C'), annualRate: rate + 0.01, termMonths: 36, fee: 0 },
        ]}
      />
    </div>
  )
}
