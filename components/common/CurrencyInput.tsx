'use client'

import * as React from 'react'
import { CURRENCIES, type CurrencyCode } from '@/types/currency'
import { formatCurrency, parseCurrency, amountSeparators, formatAmountInput } from '@/lib/utils/format-currency'
import { cn } from '@/lib/utils/cn'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OptionalTag } from './OptionalTag'

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
  /**
   * Clearing the field reports NaN (empty) instead of 0, and 0 shows as an empty
   * field. On by default for calculators; forms that need
   * a number at all times turn it off.
   */
  allowEmpty?: boolean
  /** Shows a quiet "Optional" at the right of the label. */
  optional?: boolean
  className?: string
}

/**
 * Money field. While typing, thousands are grouped with the currency's
 * separator (1.000.000 for COP, 1,000,000 for USD) so nobody counts zeros; the
 * caret is put back after the same digit it was after, so regrouping never
 * makes it jump. When idle, the value shows fully formatted.
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
  allowEmpty = true,
  optional = false,
}: CurrencyInputProps) {
  const [focused, setFocused] = React.useState(false)
  const [draft, setDraft] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)
  // Where the caret goes after a regroup: after this many digits (and decimal point).
  const caret = React.useRef<number | null>(null)
  const { decimal } = amountSeparators(currency)

  React.useLayoutEffect(() => {
    const el = inputRef.current
    if (caret.current === null || !el || document.activeElement !== el) return
    let seen = 0
    let position = 0
    while (position < draft.length && seen < caret.current) {
      if (/\d/.test(draft[position]) || draft[position] === decimal) seen++
      position++
    }
    el.setSelectionRange(position, position)
    caret.current = null
  }, [draft, decimal])
  const config = CURRENCIES[currency]

  // The symbol is rendered as a fixed prefix, so the value itself omits it.
  const blank = !Number.isFinite(value) || (allowEmpty && value === 0)
  const display = focused ? draft : blank ? '' : formatCurrency(value, currency, { hideSymbol: true })

  function commit(raw: string) {
    if (allowEmpty && raw.trim() === '') {
      onChange(Number.NaN)
      return
    }
    const parsed = parseCurrency(raw, currency)
    const clamped = Math.min(Math.max(parsed, min), max ?? Number.MAX_SAFE_INTEGER)
    onChange(clamped)
  }

  return (
    // flex-1 on the label row: in a two-column grid both fields stretch to the
    // taller one, and the inputs stay level even if one label wraps.
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex flex-1 items-end justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {optional && <OptionalTag />}
      </div>

      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {config.symbol}
        </span>
        <Input
          ref={inputRef}
          id={id}
          inputMode="decimal"
          value={display}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn('pl-7 tabular-nums', error && 'border-destructive')}
          onFocus={() => {
            setDraft(blank ? '' : formatAmountInput(String(value).replace('.', decimal), currency))
            setFocused(true)
          }}
          onChange={(event) => {
            const raw = event.target.value
            const at = event.target.selectionStart ?? raw.length
            // Count the digits (and decimal point) before the caret, then regroup.
            caret.current = [...raw.slice(0, at)].filter((c) => /\d/.test(c) || c === decimal).length
            const formatted = formatAmountInput(raw, currency)
            setDraft(formatted)
            commit(formatted)
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
