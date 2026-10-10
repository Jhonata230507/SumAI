'use client'

import { useId } from 'react'
import { ChevronRight } from 'lucide-react'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { PercentageInput } from '@/components/common/PercentageInput'
import { TermInput } from '@/components/common/TermInput'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { CREDIT_BANDS, LOAN_TYPES, estimatePropertyTax, isZip, type LoanType } from '@/features/calculators/mortgage/us'
import type { MortgageSchema } from '@/features/calculators/mortgage/schema'
import { useI18n } from '@/lib/i18n/client'
import { formatPercent } from '@/lib/utils/format-number'
import { cn } from '@/lib/utils/cn'
import type { CountryConfig } from '@/types/country'

/** Which estimated fields the user has typed over; those stop following the estimate. */
export interface Touched {
  rate: boolean
  tax: boolean
  insurance: boolean
}

export interface UsMortgageFieldsProps {
  country: CountryConfig
  input: MortgageSchema
  errors: Record<string, string>
  touched: Touched
  minDownRatio: number | null
  onChange: <K extends keyof MortgageSchema>(key: K, value: MortgageSchema[K]) => void
  /** Whether the optional fields are showing; the page owns it (it changes the layout). */
  open: boolean
  onToggle: (open: boolean) => void
}

/**
 * The US mortgage form, in the order a buyer thinks about it: where the home
 * is, what it costs and what goes down, what the household earns and owes,
 * then the loan itself, then the pass-through costs.
 *
 * Only the required fields are visible at first. Everything optional — the
 * credit score, and the rate, property tax and insurance the page estimates —
 * sits behind "Improve my estimates", so a first-time visitor sees seven
 * fields, not thirteen.
 *
 * The rate, property tax and insurance start as estimates — from the market
 * average, the ZIP's state, and the price — and say so under the field. Once
 * the user types over one, it is theirs and stops following the estimate.
 */
export function UsMortgageFields({
  country,
  input,
  errors,
  touched,
  minDownRatio,
  onChange,
  open,
  onToggle,
}: UsMortgageFieldsProps) {
  const { t } = useI18n()
  const u = t.mortgage.us
  const panelId = useId()
  const zip = input.zip ?? ''
  const loanType: LoanType = input.loanType ?? 'conventional'
  const tax = estimatePropertyTax(input.homePrice, zip)
  const downRatio = input.downPayment / Math.max(input.homePrice, 1)
  const belowMinimum = minDownRatio !== null && downRatio < minDownRatio - 1e-9
  const optional = (label: string) => `${label} (${u.optional})`
  const pct = (value: number, decimals = 1) => formatPercent(value, country.locale, decimals)

  const zipNote = !zip
    ? u.zipRequired
    : !isZip(zip)
      ? u.zipRequired
      : tax.stateName
        ? u.zipState(tax.stateName)
        : u.zipUnknown

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="zip">{u.zip}</Label>
        <Input
          id="zip"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          placeholder={u.zipPlaceholder}
          value={zip}
          aria-invalid={zip.length > 0 && !isZip(zip)}
          className={cn('tabular-nums', zip.length === 5 && !isZip(zip) && 'border-destructive')}
          onChange={(event) => onChange('zip', event.target.value.replace(/\D/g, '').slice(0, 5))}
        />
        <p className={cn('text-xs', isZip(zip) ? 'text-muted-foreground' : 'text-amber-200/80')}>{zipNote}</p>
      </div>

      <CurrencyInput
        id="price"
        label={t.mortgage.homePrice}
        currency={country.currency}
        value={input.homePrice}
        error={errors.homePrice}
        onChange={(v) => onChange('homePrice', v)}
      />

      <CurrencyInput
        id="down"
        label={country.terminology.downPayment}
        currency={country.currency}
        value={input.downPayment}
        error={errors.downPayment ?? (belowMinimum ? u.minDown(pct(minDownRatio!), u.loanTypes[loanType]) : undefined)}
        hint={t.mortgage.ofPrice(pct(downRatio))}
        onChange={(v) => onChange('downPayment', v)}
      />

      <CurrencyInput
        id="income"
        label={u.income}
        currency={country.currency}
        value={input.annualIncome ?? 0}
        error={errors.annualIncome}
        hint={u.incomeHint}
        onChange={(v) => onChange('annualIncome', v)}
      />

      <CurrencyInput
        id="debts"
        label={u.debts}
        currency={country.currency}
        value={input.monthlyDebts ?? 0}
        error={errors.monthlyDebts}
        hint={u.debtsHint}
        onChange={(v) => onChange('monthlyDebts', v)}
      />

      <TermInput
        id="term"
        label={country.terminology.loanTerm}
        months={input.termMonths}
        onChange={(months) => onChange('termMonths', months)}
      />

      <div className="space-y-1.5">
        <Label id="loan-type-label">{u.loanType}</Label>
        <div
          role="radiogroup"
          aria-labelledby="loan-type-label"
          className="grid grid-cols-[1.8fr_1fr_1fr_1fr] gap-1 rounded-xl bg-muted p-1 text-xs font-medium"
        >
          {LOAN_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={loanType === type}
              onClick={() => onChange('loanType', type)}
              className={cn(
                'rounded-lg py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                loanType === type ? 'bg-white text-black' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {u.loanTypes[type]}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{u.loanTypeNotes[loanType]}</p>
      </div>

      {/* Optional fields, behind a disclosure. */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onToggle(!open)}
        className="group flex items-center gap-1.5 rounded-md text-sm font-medium text-primary transition-colors hover:text-[#ff8a63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronRight className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-90')} aria-hidden />
        {u.improveEstimates}
      </button>

      <div id={panelId} hidden={!open} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="credit">{optional(u.creditScore)}</Label>
          <Select
            id="credit"
            value={input.creditBand ?? ''}
            options={[
              { value: '', label: u.creditNone },
              ...CREDIT_BANDS.map((band) => ({ value: band, label: band })),
            ]}
            onChange={(event) => onChange('creditBand', (event.target.value || null) as MortgageSchema['creditBand'])}
          />
        </div>

        <PercentageInput
          id="rate"
          label={t.rateInput.label}
          value={input.annualRate}
          error={errors.annualRate}
          note={touched.rate ? undefined : u.rateEstimated(u.loanTypes[loanType], input.creditBand ?? null)}
          decimals={3}
          step={0.125}
          onChange={(v) => onChange('annualRate', v)}
        />

        <CurrencyInput
          id="tax"
          label={optional(t.mortgage.propertyTax)}
          currency={country.currency}
          value={input.propertyTaxAnnual}
          hint={touched.tax ? undefined : u.taxEstimated(pct(tax.rate, 2), tax.stateName)}
          onChange={(v) => onChange('propertyTaxAnnual', v)}
        />

        <CurrencyInput
          id="insurance"
          label={optional(t.mortgage.insurance)}
          currency={country.currency}
          value={input.homeInsuranceAnnual}
          hint={touched.insurance ? undefined : u.insuranceEstimated}
          onChange={(v) => onChange('homeInsuranceAnnual', v)}
        />

        <CurrencyInput
          id="hoa"
          label={optional(t.mortgage.hoa)}
          currency={country.currency}
          value={input.hoaMonthly}
          onChange={(v) => onChange('hoaMonthly', v)}
        />

        <CurrencyInput
          id="extra"
          label={optional(t.mortgage.extra)}
          currency={country.currency}
          value={input.extraPayment}
          onChange={(v) => onChange('extraPayment', v)}
        />
      </div>
    </>
  )
}
