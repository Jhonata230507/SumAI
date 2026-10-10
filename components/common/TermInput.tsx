'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/lib/i18n/client'

type Unit = 'years' | 'months'

export interface TermInputProps {
  id: string
  label: string
  /** Stored in months everywhere, whatever unit the user types in. */
  months: number
  onChange: (months: number) => void
  /** Bounds, in months. */
  min?: number
  max?: number
  /** The unit the field opens in. */
  defaultUnit?: Unit
  className?: string
}

/**
 * A typed term — any length, not a pick from a short list — with a switch for
 * the unit it is typed in. Calculators store terms in months; the conversion
 * happens here and nowhere else. Fractions of a year are allowed and rounded
 * to the nearest month (1.5 years → 18 months), and a note spells out the
 * other unit so the conversion is never a surprise.
 */
export function TermInput({
  id,
  label,
  months,
  onChange,
  min = 1,
  max = 600,
  defaultUnit = 'years',
  className,
}: TermInputProps) {
  const { t, locale } = useI18n()
  const [unit, setUnit] = React.useState<Unit>(defaultUnit)
  const [draft, setDraft] = React.useState<string | null>(null)

  const perUnit = unit === 'years' ? 12 : 1
  // Up to two decimals in years (1.5, 2.25), whole numbers in months.
  const display = draft ?? String(Math.round((months / perUnit) * 100) / 100)
  // The term in the other unit, e.g. "= 90 meses" or "= 1,5 años" (locale decimals).
  const years = months / 12
  const note =
    unit === 'years'
      ? months % 12 === 0
        ? null
        : t.common.months(months)
      : Number.isInteger(years)
        ? t.common.years(years)
        : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(years)} ${t.common.termUnits.years.toLowerCase()}`

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex flex-1 items-end gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        <div
          role="radiogroup"
          aria-label={t.common.termUnit}
          className="ml-auto flex rounded-full bg-muted p-0.5 text-[11px] font-medium"
        >
          {(['years', 'months'] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={unit === option}
              onClick={() => {
                setUnit(option)
                setDraft(null)
              }}
              className={cn(
                'rounded-full px-2.5 py-0.5 transition-colors',
                unit === option ? 'bg-white text-black' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.common.termUnits[option]}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode={unit === 'years' ? 'decimal' : 'numeric'}
          step={unit === 'years' ? 0.5 : 1}
          min={min / perUnit}
          max={max / perUnit}
          value={display}
          className="pr-16 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          onChange={(event) => {
            setDraft(event.target.value)
            const typed = Number.parseFloat(event.target.value)
            if (Number.isFinite(typed) && typed > 0) {
              onChange(Math.min(Math.max(Math.round(typed * perUnit), min), max))
            }
          }}
          onBlur={() => setDraft(null)}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {t.common.termUnits[unit].toLowerCase()}
        </span>
      </div>

      {note && <p className="text-xs text-muted-foreground">= {note}</p>}
    </div>
  )
}
