'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { COMPARABLE_FIELDS } from '@/features/scenarios/calculate-difference'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatMonths } from '@/lib/utils/format-number'
import { formatDate } from '@/lib/utils/dates'
import { useI18n } from '@/lib/i18n/client'
import type { Scenario } from '@/types/scenario'
import type { CurrencyCode } from '@/types/currency'

export interface ScenarioCardProps {
  scenario: Scenario
  currency: CurrencyCode
  selected?: boolean
  onToggle?: (id: string) => void
}

export function ScenarioCard({ scenario, currency, selected, onToggle }: ScenarioCardProps) {
  const { t, locale } = useI18n()
  const fieldLabels = t.fields[scenario.calculatorId] ?? {}
  // The first two comparable fields are the headline figures for that calculator.
  const headline = COMPARABLE_FIELDS[scenario.calculatorId].slice(0, 2)

  return (
    <Card className={selected ? 'border-primary' : undefined}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          {onToggle && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggle(scenario.id)}
              aria-label={t.scenarios.selectForComparison(scenario.name)}
              className="mt-1 h-4 w-4 accent-primary"
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/scenarios/${scenario.id}`} className="truncate font-medium hover:underline">
                {scenario.name}
              </Link>
              <Badge variant="secondary">{t.calculators[scenario.calculatorId].shortTitle}</Badge>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-3">
              {headline.map((field) => {
                const value = scenario.results[field.key]
                if (value === undefined) return null

                return (
                  <div key={field.key}>
                    <dt className="text-xs text-muted-foreground">
                      {fieldLabels[field.key] ?? field.label}
                    </dt>
                    <dd className="mt-0.5 font-medium tabular-nums">
                      {field.format === 'months'
                        ? formatMonths(value, locale)
                        : formatCurrency(value, currency)}
                    </dd>
                  </div>
                )
              })}
            </dl>

            {scenario.notes && (
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{scenario.notes}</p>
            )}

            <p className="mt-3 text-xs text-muted-foreground">
              {t.scenarios.updated(formatDate(scenario.updatedAt, locale))}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
