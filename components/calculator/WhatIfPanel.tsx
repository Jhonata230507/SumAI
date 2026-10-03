'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay'
import { formatMonths } from '@/lib/utils/format-number'
import { useI18n } from '@/lib/i18n/client'
import type { CurrencyCode } from '@/types/currency'

export interface WhatIfOption {
  id: string
  /** English fallback; the panel shows the translated label for known ids. */
  label: string
  description: string
  /** Change in the headline cost figure versus the base case. */
  costDelta: number
  /** Change in payoff length, in periods. Negative is faster. */
  periodsDelta?: number
  /** Change in the recurring payment. */
  paymentDelta?: number
}

export interface WhatIfPanelProps {
  options: WhatIfOption[]
  currency: CurrencyCode
  onApply?: (id: string) => void
}

/**
 * Preset branches off the current calculation.
 *
 * Each row states the trade-off rather than just the saving: paying a loan off
 * faster costs more per month, and hiding that would make the panel dishonest.
 */
export function WhatIfPanel({ options, currency, onApply }: WhatIfPanelProps) {
  const { t, locale } = useI18n()
  if (options.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t.whatIf.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        {options.map((option) => {
          const saves = option.costDelta < 0
          const text = t.whatIf.options[option.id] ?? option

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onApply?.(option.id)}
              disabled={!onApply}
              className="flex w-full items-start gap-4 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50 disabled:cursor-default disabled:hover:bg-transparent"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{text.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{text.description}</p>

                {option.paymentDelta !== undefined && option.paymentDelta !== 0 && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {t.whatIf.paymentChangesBy}{' '}
                    <CurrencyDisplay
                      value={option.paymentDelta}
                      currency={currency}
                      delta
                      betterDirection="lower"
                    />
                  </p>
                )}
              </div>

              <div className="shrink-0 text-right">
                <Badge variant={saves ? 'success' : 'warning'}>
                  {saves ? t.whatIf.saves : t.whatIf.costs}{' '}
                  <CurrencyDisplay
                    value={Math.abs(option.costDelta)}
                    currency={currency}
                    compact
                    className="ml-1"
                  />
                </Badge>

                {option.periodsDelta !== undefined && option.periodsDelta !== 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {option.periodsDelta < 0 ? '−' : '+'}
                    {formatMonths(Math.abs(option.periodsDelta), locale)}
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
