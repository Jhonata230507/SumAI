'use client'

import { Calculator } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/client'

/**
 * Stands in for the results until the user has filled in their numbers: the
 * calculators open with empty fields, and there is nothing honest to show
 * before then. The icon is the one element allowed to glow.
 */
export function EmptyResults() {
  const { t } = useI18n()

  return (
    <Card className="flex min-h-[22rem] items-center justify-center">
      <CardContent className="flex max-w-md flex-col items-center p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffa07f] to-[#f2603a] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_10px_30px_-6px_rgba(255,122,79,0.6),0_0_40px_-6px_rgba(255,122,79,0.45)]">
          <Calculator className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="mt-5 text-xl font-semibold tracking-tight">{t.calculatorForm.emptyTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.calculatorForm.emptyBody}</p>
      </CardContent>
    </Card>
  )
}
