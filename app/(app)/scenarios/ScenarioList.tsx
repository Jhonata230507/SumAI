'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScenarioCard } from '@/components/scenarios/ScenarioCard'
import { ScenarioComparison } from '@/components/scenarios/ScenarioComparison'
import { compareScenarios } from '@/features/scenarios/compare-scenarios'
import { useI18n } from '@/lib/i18n/client'
import type { Scenario } from '@/types/scenario'
import type { CurrencyCode } from '@/types/currency'

export interface ScenarioListProps {
  scenarios: Scenario[]
  currency: CurrencyCode
}

/**
 * Selection is capped at two, and at one calculator: comparing a mortgage to a
 * savings plan field by field has no meaning, so the second pick is limited to
 * scenarios that match the first.
 */
export function ScenarioList({ scenarios, currency }: ScenarioListProps) {
  const { t } = useI18n()
  const [selected, setSelected] = useState<string[]>([])

  const first = scenarios.find((s) => s.id === selected[0])

  function toggle(id: string) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id)
      if (current.length >= 2) return [current[1], id]
      return [...current, id]
    })
  }

  const comparison = useMemo(() => {
    if (selected.length !== 2) return null
    const [a, b] = selected.map((id) => scenarios.find((s) => s.id === id)!)
    if (a.calculatorId !== b.calculatorId) return null
    return compareScenarios(a, b)
  }, [selected, scenarios])

  return (
    <div className="space-y-6">
      {selected.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
          <p className="flex-1">
            {selected.length === 1
              ? t.scenarios.pickOneMore
              : comparison
                ? t.scenarios.comparing
                : t.scenarios.incompatible}
          </p>
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
            {t.scenarios.clear}
          </Button>
        </div>
      )}

      {comparison && <ScenarioComparison comparison={comparison} currency={currency} />}

      <div className="grid gap-4 md:grid-cols-2">
        {scenarios.map((scenario) => {
          const incompatible =
            first !== undefined &&
            !selected.includes(scenario.id) &&
            scenario.calculatorId !== first.calculatorId

          return (
            <div key={scenario.id} className={incompatible ? 'opacity-50' : undefined}>
              <ScenarioCard
                scenario={scenario}
                currency={currency}
                selected={selected.includes(scenario.id)}
                onToggle={incompatible ? undefined : toggle}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
