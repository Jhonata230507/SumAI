'use client'

import { CheckCircle2, TriangleAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/client'
import { formatPercent } from '@/lib/utils/format-number'
import { cn } from '@/lib/utils/cn'

export interface DebtToIncomeProps {
  /** Null until an income is entered. */
  value: { front: number; back: number; frontLimit: number | null; backLimit: number } | null
  locale: string
}

/** Bars run from 0 to this share of income, so typical guidelines sit mid-track. */
const SCALE = 0.6

/**
 * The two ratios lenders size a mortgage by: the housing payment, and all
 * monthly debts, each against the loan program's guideline. Status is shown
 * with an icon and a label, never colour alone.
 */
export function DebtToIncome({ value, locale }: DebtToIncomeProps) {
  const { t } = useI18n()
  const d = t.mortgage.us.dti

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <h2 className="text-sm font-medium">{d.title}</h2>
        {value ? (
          <>
            <Ratio label={d.front} ratio={value.front} limit={value.frontLimit} locale={locale} />
            <Ratio label={d.back} ratio={value.back} limit={value.backLimit} locale={locale} />
            <p className="text-xs text-muted-foreground">{d.note}</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{d.addIncome}</p>
        )}
      </CardContent>
    </Card>
  )
}

function Ratio({ label, ratio, limit, locale }: { label: string; ratio: number; limit: number | null; locale: string }) {
  const { t } = useI18n()
  const d = t.mortgage.us.dti
  const over = limit !== null && ratio > limit
  const Icon = over ? TriangleAlert : CheckCircle2

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl tabular-nums tracking-tight">{formatPercent(ratio, locale, 1)}</p>
      </div>

      <div className="relative mt-2 h-2 rounded-full bg-white/[0.06]">
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full', over ? 'bg-amber-400' : 'bg-[#3987e5]')}
          style={{ width: `${Math.min(ratio / SCALE, 1) * 100}%` }}
        />
        {limit !== null && (
          <span
            aria-hidden
            className="absolute -inset-y-1 w-0.5 rounded-full bg-foreground/70"
            style={{ left: `${Math.min(limit / SCALE, 1) * 100}%` }}
          />
        )}
      </div>

      {limit !== null && (
        <p className={cn('mt-1.5 flex items-center gap-1.5 text-xs', over ? 'text-amber-300' : 'text-emerald-400')}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {over ? d.above : d.within}
          <span className="text-muted-foreground">· {d.guideline(formatPercent(limit, locale, 0))}</span>
        </p>
      )}
    </div>
  )
}
