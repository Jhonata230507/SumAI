'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

export interface PercentageInputProps {
  id: string
  label: string
  /** Stored as a fraction (0.0725); displayed as a percentage (7.25). */
  value: number
  onChange: (value: number) => void
  hint?: string
  error?: string
  step?: number
  min?: number
  max?: number
  disabled?: boolean
  className?: string
  /** Shown at the right of the label row, e.g. a rate-basis switch. */
  adornment?: React.ReactNode
  /** Secondary line under the input, e.g. the equivalent rate in another basis. */
  note?: string
  /** Decimals shown when the field is not being edited. */
  decimals?: number
}

/**
 * Rate field. The app stores fractions everywhere; users think in percent.
 * The conversion happens here and nowhere else, which is what keeps a 7.25%
 * rate from ever being applied as 725%.
 */
export function PercentageInput({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  step = 0.05,
  min = 0,
  max = 100,
  disabled,
  className,
  adornment,
  note,
  decimals = 2,
}: PercentageInputProps) {
  const [draft, setDraft] = React.useState<string | null>(null)
  const display = draft ?? (value * 100).toFixed(decimals)

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex flex-1 items-end gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        {hint && (
          <Tooltip content={hint}>
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </Tooltip>
        )}
        {adornment && <div className="ml-auto">{adornment}</div>}
      </div>

      <div className="relative">
        <Input
          id={id}
          inputMode="decimal"
          type="number"
          step={step}
          min={min}
          max={max}
          value={display}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className={cn('pr-8 tabular-nums', error && 'border-destructive')}
          onChange={(event) => {
            setDraft(event.target.value)
            const percent = Number.parseFloat(event.target.value)
            if (Number.isFinite(percent)) {
              onChange(Math.min(Math.max(percent, min), max) / 100)
            }
          }}
          onBlur={() => setDraft(null)}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          %
        </span>
      </div>

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        note && <p className="text-xs text-muted-foreground">{note}</p>
      )}
    </div>
  )
}
