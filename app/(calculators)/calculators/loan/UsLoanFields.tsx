'use client'

import { useId, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { PercentageInput } from '@/components/common/PercentageInput'
import { RateInput } from '@/components/common/RateInput'
import { TermInput } from '@/components/common/TermInput'
import { Label } from '@/components/ui/label'
import { OptionalTag } from '@/components/common/OptionalTag'
import { Select } from '@/components/ui/select'
import { CREDIT_BANDS } from '@/features/calculators/mortgage/us'
import { LOAN_PURPOSES } from '@/features/calculators/loan/us'
import type { LoanSchema } from '@/features/calculators/loan/schema'
import { useI18n } from '@/lib/i18n/client'
import { formatPercent } from '@/lib/utils/format-number'
import { roundMoney, roundTo } from '@/lib/calculations/rounding'
import { cn } from '@/lib/utils/cn'
import type { CountryConfig } from '@/types/country'

export interface UsLoanFieldsProps {
  country: CountryConfig
  input: LoanSchema
  errors: Record<string, string>
  /** The rate used while the rate field is empty (estimated from credit when known). */
  estimatedRate: number
  open: boolean
  onToggle: (open: boolean) => void
  onChange: <K extends keyof LoanSchema>(key: K, value: LoanSchema[K]) => void
  /** Several fields at once (switching the fee between an amount and a percentage). */
  onPatch: (patch: Partial<LoanSchema>) => void
}

type FeeUnit = 'amount' | 'percent'

/**
 * The US personal-loan form. Visible: how much and for how long (required),
 * then the rate (estimated from the average and the credit score until the user
 * types one), income and debts (debt-to-income and lender eligibility) and the
 * credit score — all optional. The origination fee (in dollars or as a share of
 * the amount, deducted from what the borrower receives) and what the loan is for
 * sit behind "Improve my estimates". Empty fields show an example value.
 */
export function UsLoanFields({
  country,
  input,
  errors,
  estimatedRate,
  open,
  onToggle,
  onChange,
  onPatch,
}: UsLoanFieldsProps) {
  const { t } = useI18n()
  const u = t.mortgage.us
  const panelId = useId()
  const rate = `${formatPercent(estimatedRate, country.locale)} ${t.products.rateBasis.nominal}`
  const example = (value: number) => new Intl.NumberFormat(country.locale).format(value)
  const [feeUnit, setFeeUnit] = useState<FeeUnit>(() => ((input.originationFeeRate ?? 0) > 0 ? 'percent' : 'amount'))

  // Switching the unit converts what was typed, so the fee itself stays the same.
  function switchFee(next: FeeUnit) {
    if (next === feeUnit) return
    setFeeUnit(next)
    const amount = Number.isFinite(input.amount) && input.amount > 0 ? input.amount : null
    if (next === 'percent') {
      const fee = input.originationFee
      onPatch({
        originationFee: Number.NaN,
        originationFeeRate: amount && fee > 0 ? roundTo(fee / amount, 4) : Number.NaN,
      })
    } else {
      const feeRate = input.originationFeeRate ?? 0
      onPatch({
        originationFeeRate: Number.NaN,
        originationFee: amount && feeRate > 0 ? roundMoney(amount * feeRate) : Number.NaN,
      })
    }
  }

  const feeSwitch = (
    <div
      role="radiogroup"
      aria-label={t.loan.feeUnit}
      className="flex rounded-full bg-muted p-0.5 text-[11px] font-medium"
    >
      {(['amount', 'percent'] as const).map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={feeUnit === option}
          onClick={() => switchFee(option)}
          className={cn(
            'rounded-full px-2.5 py-0.5 transition-colors',
            feeUnit === option ? 'bg-white text-black' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t.loan.feeUnits[option]}
        </button>
      ))}
    </div>
  )

  return (
    <>
      <CurrencyInput
        id="amount"
        label={t.loan.amount}
        currency={country.currency}
        value={input.amount}
        error={errors.amount}
        placeholder={example(5_000)}
        onChange={(v) => onChange('amount', v)}
      />

      <TermInput
        id="term"
        label={country.terminology.loanTerm}
        months={input.termMonths}
        placeholder="5"
        onChange={(months) => onChange('termMonths', months)}
      />

      <RateInput
        id="rate"
        country={country}
        optional
        value={input.annualRate}
        error={errors.annualRate}
        fallback={estimatedRate}
        fallbackNote={t.loan.estimatedRateNote(rate, input.creditBand ?? null)}
        onChange={(v) => onChange('annualRate', v)}
      />

      <CurrencyInput
        id="income"
        label={t.loan.income}
        optional
        currency={country.currency}
        value={input.annualIncome ?? Number.NaN}
        placeholder={example(60_000)}
        hint={u.incomeHint}
        onChange={(v) => onChange('annualIncome', v)}
      />

      <CurrencyInput
        id="debts"
        label={u.debts}
        optional
        currency={country.currency}
        value={input.monthlyDebts ?? Number.NaN}
        placeholder={example(400)}
        hint={u.debtsHint}
        onChange={(v) => onChange('monthlyDebts', v)}
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
          onChange={(event) => onChange('creditBand', (event.target.value || null) as LoanSchema['creditBand'])}
        />
      </div>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onToggle(!open)}
        className="group flex items-center gap-1.5 rounded-md text-sm font-medium text-primary transition-colors hover:text-foreground/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronRight className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-90')} aria-hidden />
        {u.improveEstimates}
      </button>

      <div id={panelId} hidden={!open} className="space-y-4">
        {feeUnit === 'amount' ? (
          <CurrencyInput
            id="fee"
            label={t.loan.fee}
            optional
            adornment={feeSwitch}
            currency={country.currency}
            value={input.originationFee}
            placeholder="0"
            hint={t.loan.feeDeducted}
            onChange={(v) => onChange('originationFee', v)}
          />
        ) : (
          <PercentageInput
            id="fee"
            label={t.loan.fee}
            optional
            adornment={feeSwitch}
            step={0.1}
            max={20}
            value={input.originationFeeRate ?? Number.NaN}
            error={errors.originationFeeRate}
            placeholder="0"
            hint={t.loan.feeDeducted}
            onChange={(v) => onChange('originationFeeRate', v)}
          />
        )}

        <div className="space-y-1.5">
          <div className="flex items-end justify-between gap-2">
            <Label htmlFor="purpose">{t.loan.purpose}</Label>
            <OptionalTag />
          </div>
          <Select
            id="purpose"
            value={input.purpose ?? ''}
            options={[
              { value: '', label: t.loan.purposeNone },
              ...LOAN_PURPOSES.map((purpose) => ({ value: purpose, label: t.loan.purposes[purpose] })),
            ]}
            onChange={(event) => onChange('purpose', (event.target.value || null) as LoanSchema['purpose'])}
          />
        </div>
      </div>
    </>
  )
}
