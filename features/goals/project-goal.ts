import { calculateGoal } from './calculate-goal'
import { roundMoney } from '@/lib/calculations/rounding'
import type { GoalInput, GoalProjection } from './types'

export interface GoalWhatIf {
  id: string
  label: string
  description: string
  projection: GoalProjection
  monthsSaved: number | null
}

/**
 * What-if branches for a goal. Each answers a question people actually ask:
 * what if I add a little more, what if I start now, what if returns disappoint.
 */
export function projectGoalVariants(base: GoalInput): GoalWhatIf[] {
  const baseline = calculateGoal(base)
  const current = base.monthlyContribution ?? 0

  const variants = [
    {
      id: 'add-50',
      label: 'Add a little more',
      description: 'An extra 50 a month toward the goal',
      apply: (i: GoalInput) => ({ ...i, monthlyContribution: current + 50 }),
    },
    {
      id: 'add-quarter',
      label: 'Increase by 25%',
      description: 'A quarter more than the current contribution',
      apply: (i: GoalInput) => ({ ...i, monthlyContribution: roundMoney(current * 1.25) }),
    },
    {
      id: 'lower-return',
      label: 'If returns disappoint',
      description: 'The same plan at two points lower',
      apply: (i: GoalInput) => ({ ...i, annualReturn: Math.max(0, i.annualReturn - 0.02) }),
    },
  ]

  return variants.map(({ apply, ...meta }) => {
    const projection = calculateGoal(apply(base))
    const monthsSaved =
      baseline.monthsRemaining !== null && projection.monthsRemaining !== null
        ? baseline.monthsRemaining - projection.monthsRemaining
        : null

    return { ...meta, projection, monthsSaved }
  })
}
