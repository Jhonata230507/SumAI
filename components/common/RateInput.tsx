'use client'

import { useCallback, useEffect, useState } from 'react'
import { PercentageInput } from './PercentageInput'
import { effectiveToPeriodic, periodicToEffective } from '@/lib/calculations/interest'
import { formatPercent } from '@/lib/utils/format-number'
import { useI18n } from '@/lib/i18n/client'
import { cn } from '@/lib/utils/cn'
import type { CountryConfig } from '@/types/country'

export type RateBasis = 'ea' | 'mv'

const STORAGE_KEY = 'sumai:rate-basis'
const SYNC_EVENT = 'sumai:rate-basis'

/**
 * The visitor's preferred way to read rates, shared by every rate field on the
 * page (the compare page has three) and remembered between visits. Read after
 * mount, so the server render and the first client render always agree.
 */
function useRateBasis(): [RateBasis, (basis: RateBasis) => void] {
  const [basis, setBasis] = useState<RateBasis>('ea')

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'mv') setBasis('mv')
    } catch {
      // Storage blocked: stay on the default.
    }
    const onSync = (event: Event) => setBasis((event as CustomEvent<RateBasis>).detail)
    window.addEventListener(SYNC_EVENT, onSync)
    return () => window.removeEventListener(SYNC_EVENT, onSync)
  }, [])

  const update = useCallback((next: RateBasis) => {
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Not persisted, but still applied for this page.
    }
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: next }))
  }, [])

  return [basis, update]
}

export interface RateInputProps {
  id: string
  country: CountryConfig
  /** Annual rate as a fraction, in the country's own convention (E.A. in Colombia). */
  value: number
  onChange: (value: number) => void
  error?: string
  label?: string
  /**
   * For narrow two-column rows: the equivalent rate moves from a line under
   * the input into the tooltip, so the field stays the height of its neighbour.
   */
  compact?: boolean
  /** Passed to the underlying PercentageInput. */
  allowEmpty?: boolean
  /**
   * The rate used when the field is left empty (effective annual, like `value`).
   * The empty field shows it as a placeholder, with `fallbackNote` in the field's tooltip.
   */
  fallback?: number
  fallbackNote?: string
  /** Shows a quiet "Optional" at the right of the label. */
  optional?: boolean
  /** Colombia: the second basis offered, monthly (M.V.) or nominal annual compounded monthly (N.M.V.). */
  monthlyBasis?: 'mv' | 'nmv'
  /** Shown first in the field's tooltip. */
  hint?: string
}

/**
 * Interest-rate field that speaks the market's language.
 *
 * Colombian lenders quote either an effective annual rate (E.A.) or a monthly
 * rate (M.V., mes vencido). The calculators always work in E.A.; this field
 * only changes how the rate is shown and typed, converting exactly —
 * (1 + E.A.) = (1 + M.V.)^12 — so toggling never changes a result.
 * Other markets get a plain rate field.
 */
export function RateInput({
  id,
  country,
  value,
  onChange,
  error,
  label,
  compact = false,
  allowEmpty = true,
  fallback,
  fallbackNote,
  optional = false,
  monthlyBasis = 'mv',
  hint,
}: RateInputProps) {
  const { t } = useI18n()
  const [basis, setBasis] = useRateBasis()

  const offersMonthly = country.code === 'co' && country.rules.quotesEffectiveAnnualRate

  if (!offersMonthly) {
    return (
      <PercentageInput
        id={id}
        label={label ?? country.terminology.interestRate}
        value={value}
        error={error}
        onChange={onChange}
        allowEmpty={allowEmpty}
        optional={optional}
        placeholder={fallback !== undefined ? (fallback * 100).toFixed(2) : undefined}
        hint={
          [hint, !Number.isFinite(value) && fallback !== undefined ? fallbackNote : undefined]
            .filter(Boolean)
            .join(' ') || undefined
        }
      />
    )
  }

  const monthly = basis === 'mv'
  // N.M.V. is twelve times the monthly rate: (1 + E.A.) = (1 + N.M.V./12)^12.
  const nominal = monthlyBasis === 'nmv'
  const scale = nominal ? 12 : 1
  const monthlyLabel = nominal ? t.rateInput.nominalMonthly : t.rateInput.monthly
  const toMonthly = (effective: number) => effectiveToPeriodic(effective, 12) * scale
  const shown = monthly ? toMonthly(value) : value
  const other = monthly ? value : toMonthly(value)
  const otherLabel = monthly ? t.rateInput.effectiveAnnual : monthlyLabel
  // M.V. rates are small and need three decimals; N.M.V. reads like an annual rate.
  const decimals = monthly && !nominal ? 3 : 2
  const usingFallback = !Number.isFinite(value) && fallback !== undefined
  const placeholder =
    fallback !== undefined ? ((monthly ? toMonthly(fallback) : fallback) * 100).toFixed(decimals) : undefined
  const equivalent = Number.isFinite(value)
    ? t.rateInput.equivalent(formatPercent(other, country.locale, monthly || nominal ? 2 : 3), otherLabel)
    : ''
  const basisHint = !monthly
    ? t.rateInput.effectiveAnnualHint
    : nominal
      ? t.rateInput.nominalMonthlyHint
      : t.rateInput.monthlyHint

  return (
    <PercentageInput
      // Remount on switch so a half-typed value in the old basis is discarded.
      key={basis}
      id={id}
      label={label ?? t.rateInput.label}
      hint={[hint, compact ? `${basisHint} ${equivalent}.` : basisHint, usingFallback ? fallbackNote : undefined]
        .filter(Boolean)
        .join(' ')}
      value={shown}
      // Monthly rates are small; three decimals keep them meaningful (1.281%).
      decimals={decimals}
      step={decimals === 3 ? 0.01 : 0.05}
      max={monthly && !nominal ? 20 : 100}
      error={error}
      allowEmpty={allowEmpty}
      optional={optional}
      placeholder={placeholder}
      note={usingFallback || compact || !equivalent ? undefined : equivalent}
      onChange={(typed) => onChange(monthly ? periodicToEffective(typed / scale, 12) : typed)}
      adornment={
        <div
          role="radiogroup"
          aria-label={t.rateInput.basis}
          className={cn('flex rounded-full bg-muted p-0.5 font-medium', compact ? 'text-[10px]' : 'text-[11px]')}
        >
          {(['ea', 'mv'] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={basis === option}
              onClick={() => setBasis(option)}
              className={cn(
                'rounded-full py-0.5 transition-colors',
                compact ? 'px-1.5' : 'px-2.5',
                basis === option ? 'bg-white text-black' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option === 'ea' ? t.rateInput.effectiveAnnual : monthlyLabel}
            </button>
          ))}
        </div>
      }
    />
  )
}
