'use client'

import { CurrencyInput } from '@/components/common/CurrencyInput'
import { OptionalTag } from '@/components/common/OptionalTag'
import { RateInput } from '@/components/common/RateInput'
import { TermInput } from '@/components/common/TermInput'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { CREDIT_BANDS } from '@/features/calculators/mortgage/us'
import { TYPICAL_FEES, VEHICLE_CONDITIONS } from '@/features/calculators/car-loan/us'
import type { CarLoanSchema } from '@/features/calculators/car-loan/schema'
import { useI18n } from '@/lib/i18n/client'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatPercent } from '@/lib/utils/format-number'
import { cn } from '@/lib/utils/cn'
import type { CountryConfig } from '@/types/country'

export interface UsCarLoanFieldsProps {
  country: CountryConfig
  input: CarLoanSchema
  errors: Record<string, string>
  /** The rate used while the rate field is empty (by condition and credit). */
  estimatedRate: number
  onChange: <K extends keyof CarLoanSchema>(key: K, value: CarLoanSchema[K]) => void
}

/**
 * The US auto-loan form, in two groups split by a line. First, what the
 * payment is built from: the car's condition, its price, the down payment, the
 * term, the rate (estimated from condition and credit until the user types one)
 * and income. Then the refinements: registration and fees (estimated until
 * typed), a trade-in, and the credit score. On desktop the form box shows the
 * first group; the second scrolls inside it.
 */
export function UsCarLoanFields({ country, input, errors, estimatedRate, onChange }: UsCarLoanFieldsProps) {
  const { t } = useI18n()
  const c = t.carLoan
  const u = t.mortgage.us
  const condition = c.conditions[input.condition ?? 'new']
  const rate = `${formatPercent(estimatedRate, country.locale)} ${t.products.rateBasis.nominal}`

  return (
    <>
      <div className="space-y-1.5">
        <Label id="condition-label">{c.condition}</Label>
        <div
          role="radiogroup"
          aria-labelledby="condition-label"
          className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-xs font-medium"
        >
          {VEHICLE_CONDITIONS.map((option) => {
            const selected = input.condition === option
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                // Clicking the selected one again clears it (the field is optional).
                onClick={() => onChange('condition', selected ? null : option)}
                className={cn(
                  'rounded-lg py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selected ? 'bg-white text-black' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {c.conditions[option]}
              </button>
            )
          })}
        </div>
      </div>

      <CurrencyInput
        id="price"
        label={c.vehiclePrice}
        currency={country.currency}
        value={input.vehiclePrice}
        error={errors.vehiclePrice}
        onChange={(v) => onChange('vehiclePrice', v)}
      />

      <CurrencyInput
        id="down"
        label={country.terminology.downPayment}
        currency={country.currency}
        value={input.downPayment}
        error={errors.downPayment}
        onChange={(v) => onChange('downPayment', v)}
      />

      <TermInput
        id="term"
        label={country.terminology.loanTerm}
        months={input.termMonths}
        defaultUnit="years"
        max={96}
        onChange={(months) => onChange('termMonths', months)}
      />

      <RateInput
        id="rate"
        country={country}
        optional
        value={input.annualRate}
        error={errors.annualRate}
        fallback={estimatedRate}
        fallbackNote={c.autoRateNote(rate, condition, input.creditBand ?? null)}
        onChange={(v) => onChange('annualRate', v)}
      />

      <CurrencyInput
        id="income"
        optional
        label={t.loan.income}
        currency={country.currency}
        value={input.annualIncome ?? Number.NaN}
        hint={u.incomeHint}
        onChange={(v) => onChange('annualIncome', v)}
      />

      {/* The refinements, below a line; on desktop they scroll inside the form box. */}
      <hr className="border-white/[0.08]" />

      <CurrencyInput
        id="fees"
        optional
        label={c.feesLabel}
        currency={country.currency}
        value={input.feesAndRegistration}
        hint={
          Number.isFinite(input.feesAndRegistration)
            ? undefined
            : c.feesNote(formatCurrency(TYPICAL_FEES, country.currency, { compact: true }))
        }
        onChange={(v) => onChange('feesAndRegistration', v)}
      />

      <CurrencyInput
        id="trade-value"
        optional
        label={c.tradeInValue}
        currency={country.currency}
        value={input.tradeInValue}
        onChange={(v) => onChange('tradeInValue', v)}
      />

      <div className="space-y-1.5">
        <div className="flex items-end justify-between gap-2">
          <Label htmlFor="credit">{u.creditScore}</Label>
          <OptionalTag />
        </div>
        <Select
          id="credit"
          value={input.creditBand ?? ''}
          options={[{ value: '', label: u.creditNone }, ...CREDIT_BANDS.map((band) => ({ value: band, label: band }))]}
          onChange={(event) => onChange('creditBand', (event.target.value || null) as CarLoanSchema['creditBand'])}
        />
      </div>
    </>
  )
}
