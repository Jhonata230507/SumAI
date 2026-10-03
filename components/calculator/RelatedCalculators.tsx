'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { relatedCalculators } from '@/data/calculators/definitions'
import { useI18n } from '@/lib/i18n/client'
import type { CalculatorId } from '@/types/common'

export function RelatedCalculators({ calculatorId }: { calculatorId: CalculatorId }) {
  const { t } = useI18n()
  const related = relatedCalculators(calculatorId)
  if (related.length === 0) return null

  return (
    <section>
      <h2 className="text-lg font-semibold">{t.related.title}</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((calculator) => {
          const text = t.calculators[calculator.id]
          return (
            <Link key={calculator.id} href={`/calculators/${calculator.slug}`} className="group">
              <Card className="h-full transition-colors group-hover:border-primary/40">
                <CardContent className="p-5">
                  <p className="font-medium">{text.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{text.tagline}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm text-primary">
                    {t.common.open}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
