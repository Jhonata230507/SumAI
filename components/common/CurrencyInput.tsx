'use client'

import * as React from 'react'
import { CURRENCIES, type CurrencyCode } from '@/types/currency'
import { formatCurrency, parseCurrency } from '@/lib/utils/format-currency'
import { cn } from '@/lib/utils/cn'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface CurrencyInputProps {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  currency?: CurrencyCode
  hint?: string
  error?: string
  min?: number
  max?: number
  disabled?: boolean
  className?: string
}

/**
 * Money field that formats while idle and shows the raw number while focused.
 *
 * Formatting a field mid-typing fights the user — the caret jumps and grouping
 * separators appear under the cursor. So the value is only formatted when the
 * field is not focused.
 */
export function CurrencyInput({
  id,
  label,
  value,
  onChange,
  currency = 'USD',
  hint,
  error,
  min = 0,
  max,
  disabled,
  className,
}: CurrencyInputProps) {
  const [focused, setFocused] = React.useState(false)
  const [draft, setDraft] = React.useState('')
  const config = CURRENCIES[currency]

  // The symbol is rendered as a fixed prefix, so the value itself omits it.
  const display = focused ? draft : formatCurrency(value, currency, { hideSymbol: true })

  function commit(raw: string) {
    const parsed = parseCurrency(raw, currency)
    const clamped = Math.min(Math.max(parsed, min), max ?? Number.MAX_SAFE_INTEGER)
    onChange(clamped)
  }

  return (
    // flex-1 on the label row: in a two-column grid both fields stretch to the
    // taller one, and the inputs stay level even if one label wraps.
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex flex-1 items-end">
        <Label htmlFor={id}>{label}</Label>
      </div>

      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {config.symbol}
        </span>
        <Input
          id={id}
          inputMode="decimal"
          value={display}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn('pl-7 tabular-nums', error && 'border-destructive')}
          onFocus={() => {
            setDraft(value === 0 ? '' : String(value))
            setFocused(true)
          }}
          onChange={(event) => {
            setDraft(event.target.value)
            commit(event.target.value)
          }}
          onBlur={() => setFocused(false)}
        />
      </div>

      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
