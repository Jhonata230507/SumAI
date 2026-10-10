'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TermInput } from '@/components/common/TermInput'
import { ComparisonChart } from '@/components/charts/ComparisonChart'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { RateInput } from '@/components/common/RateInput'
import { calculateLoan } from '@/features/calculators/loan/calculation'
import { formatCurrency } from '@/lib/utils/format-currency'
import { useI18n } from '@/lib/i18n/client'
import type { CountryConfig } from '@/types/country'

interface Offer {
  id: string
  name: string
  annualRate: number
  termMonths: number
  fee: number
}

export interface CompareOffersProps {
  country: CountryConfig
  amount: number
  initialOffers: Offer[]
}


export function CompareOffers({ country, amount: initialAmount, initialOffers }: CompareOffersProps) {
  const { t } = useI18n()
  const [amount, setAmount] = useState(initialAmount)
  const [offers, setOffers] = useState(initialOffers)

  const results = offers.map((offer) => {
    const result = calculateLoan({
      amount,
      annualRate: offer.annualRate,
      termMonths: offer.termMonths,
      frequency: 'monthly',
      extraPayment: 0,
      originationFee: offer.fee,
      countryCode: country.code,
    })
    return { offer, result }
  })

  const cheapest = Math.min(...results.map((r) => r.result.totalPaid))

  function update(id: string, patch: Partial<Offer>) {
    setOffers((current) => current.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }

  return (
    <div className="mt-10 space-y-8">
      <div className="max-w-xs">
        <CurrencyInput
          id="amount"
          label={t.compare.amount}
          currency={country.currency}
          value={amount}
          onChange={setAmount}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {results.map(({ offer, result }) => {
          const isCheapest = result.totalPaid === cheapest

          return (
            <Card key={offer.id} className={isCheapest ? 'border-primary' : undefined}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Input
                    aria-label={t.compare.offerName}
                    value={offer.name}
                    onChange={(e) => update(offer.id, { name: e.target.value })}
                    className="h-8 font-medium"
                  />
                  {isCheapest && <Badge variant="success">{t.compare.cheapest}</Badge>}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <RateInput
                  id={`${offer.id}-rate`}
                  country={country}
                  value={offer.annualRate}
                  onChange={(v) => update(offer.id, { annualRate: v })}
                />
                <TermInput
                  id={`${offer.id}-term`}
                  label={t.compare.term}
                  months={offer.termMonths}
                  defaultUnit="months"
                  onChange={(months) => update(offer.id, { termMonths: months })}
                />
                <CurrencyInput
                  id={`${offer.id}-fee`}
                  label={t.compare.upfrontFees}
                  currency={country.currency}
                  value={offer.fee}
                  onChange={(v) => update(offer.id, { fee: v })}
                />

                <dl className="space-y-1.5 border-t pt-4 text-sm">
                  <Row label={t.compare.monthlyPayment} value={formatCurrency(result.payment, result.currency)} />
                  <Row label={t.compare.totalInterest} value={formatCurrency(result.totalInterest, result.currency)} />
                  <Row label={t.compare.totalCost} value={formatCurrency(result.totalPaid, result.currency)} strong />
                  {!isCheapest && (
                    <p className="pt-1 text-xs text-muted-foreground">
                      {t.compare.moreThanCheapest(formatCurrency(result.totalPaid - cheapest, result.currency))}
                    </p>
                  )}
                </dl>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t.compare.chartTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <ComparisonChart
            currency={country.currency}
            caption={t.compare.chartCaption}
            bars={results.map(({ offer, result }) => ({
              label: offer.name,
              value: result.totalPaid,
              highlight: result.totalPaid === cheapest,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? 'font-semibold tabular-nums' : 'tabular-nums'}>{value}</dd>
    </div>
  )
}
