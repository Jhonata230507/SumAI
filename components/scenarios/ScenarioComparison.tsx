'use client'

import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { isImprovement } from '@/features/scenarios/calculate-difference'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatMonths } from '@/lib/utils/format-number'
import { cn } from '@/lib/utils/cn'
import { useI18n } from '@/lib/i18n/client'
import type { ScenarioComparison as Comparison, ScenarioDiff } from '@/types/scenario'
import type { CurrencyCode } from '@/types/currency'

export interface ScenarioComparisonProps {
  comparison: Comparison
  currency: CurrencyCode
}

/**
 * Two scenarios, field by field.
 *
 * Direction is judged per field rather than by sign: a smaller payment is an
 * improvement, a smaller final balance is not. Every row carries an arrow and
 * a word, so the verdict never rests on colour alone.
 */
export function ScenarioComparison({ comparison, currency }: ScenarioComparisonProps) {
  const { t, locale } = useI18n()
  const { base, compared, diffs } = comparison
  const labels = t.fields[base.calculatorId] ?? {}
  const label = (diff: ScenarioDiff) => labels[diff.key] ?? diff.label

  const improves = diffs.filter(isImprovement).map((d) => label(d).toLowerCase())
  const costs = diffs.filter((d) => d.delta !== 0 && !isImprovement(d)).map((d) => label(d).toLowerCase())
  const summary =
    improves.length === 0 && costs.length === 0
      ? t.scenarios.summarySame(compared.name, base.name)
      : t.scenarios.summary(base.name, compared.name, improves, costs)

  const format = (diff: ScenarioDiff, value: number) => {
    // Period counts are the only non-money comparable field today.
    const isDuration = diff.key.toLowerCase().includes('period') || diff.key.includes('months')
    return isDuration ? formatMonths(value, locale) : formatCurrency(value, currency)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t.scenarios.vs(base.name, compared.name)}</CardTitle>
        <p className="text-sm text-muted-foreground">{summary}</p>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.scenarios.figure}</TableHead>
              <TableHead>{base.name}</TableHead>
              <TableHead>{compared.name}</TableHead>
              <TableHead>{t.scenarios.difference}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {diffs.map((diff) => (
              <TableRow key={diff.key}>
                <TableCell className="font-medium">{label(diff)}</TableCell>
                <TableCell>{format(diff, diff.baseValue)}</TableCell>
                <TableCell>{format(diff, diff.comparedValue)}</TableCell>
                <TableCell>
                  <DeltaCell diff={diff} formatted={format(diff, Math.abs(diff.delta))} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function DeltaCell({ diff, formatted }: { diff: ScenarioDiff; formatted: string }) {
  const { t } = useI18n()

  if (diff.delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Minus className="h-3.5 w-3.5" />
        {t.scenarios.noChange}
      </span>
    )
  }

  const better = isImprovement(diff)
  const Icon = diff.delta < 0 ? ArrowDown : ArrowUp

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium tabular-nums',
        better ? 'text-emerald-400' : 'text-red-400',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {formatted}
      <span className="text-xs font-normal">{better ? t.scenarios.better : t.scenarios.worse}</span>
    </span>
  )
}
