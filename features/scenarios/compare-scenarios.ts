import { calculateDifference, isImprovement } from './calculate-difference'
import type { Scenario, ScenarioComparison } from '@/types/scenario'

/** Compares two saved scenarios of the same calculator. */
export function compareScenarios(base: Scenario, compared: Scenario): ScenarioComparison {
  if (base.calculatorId !== compared.calculatorId) {
    throw new Error('Scenarios from different calculators cannot be compared')
  }

  const diffs = calculateDifference(base.calculatorId, base.results, compared.results)

  return { base, compared, diffs, summary: summarize(base, compared, diffs) }
}

function summarize(
  base: Scenario,
  compared: Scenario,
  diffs: ReturnType<typeof calculateDifference>,
): string {
  const wins = diffs.filter(isImprovement)
  const losses = diffs.filter((d) => d.delta !== 0 && !isImprovement(d))

  if (wins.length === 0 && losses.length === 0) {
    return `${compared.name} and ${base.name} produce the same figures.`
  }

  const parts: string[] = []
  if (wins.length) parts.push(`improves ${wins.map((d) => d.label.toLowerCase()).join(', ')}`)
  if (losses.length) parts.push(`costs more on ${losses.map((d) => d.label.toLowerCase()).join(', ')}`)

  return `Compared with ${base.name}, ${compared.name} ${parts.join(' but ')}.`
}

/** Compares several scenarios against the first, for the multi-column view. */
export function compareMany(scenarios: Scenario[]): ScenarioComparison[] {
  if (scenarios.length < 2) return []
  const [base, ...rest] = scenarios
  return rest.map((scenario) => compareScenarios(base, scenario))
}
