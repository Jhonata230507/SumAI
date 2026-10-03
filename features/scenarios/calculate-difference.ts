import { roundTo } from '@/lib/calculations/rounding'
import type { CalculatorId } from '@/types/common'
import type { ScenarioDiff } from '@/types/scenario'
import type { ComparableField } from './types'

/**
 * Which figures matter per calculator, and which way is better.
 * Direction is not cosmetic — it decides whether a delta renders as a win or a
 * cost, and a lower monthly payment is not automatically good if interest rises.
 */
export const COMPARABLE_FIELDS: Record<CalculatorId, ComparableField[]> = {
  loan: [
    { key: 'payment', label: 'Payment', betterDirection: 'lower', format: 'currency' },
    { key: 'totalInterest', label: 'Total interest', betterDirection: 'lower', format: 'currency' },
    { key: 'totalPaid', label: 'Total paid', betterDirection: 'lower', format: 'currency' },
    { key: 'payoffPeriods', label: 'Payoff time', betterDirection: 'lower', format: 'months' },
  ],
  mortgage: [
    { key: 'monthlyTotal', label: 'Monthly payment', betterDirection: 'lower', format: 'currency' },
    { key: 'totalInterest', label: 'Total interest', betterDirection: 'lower', format: 'currency' },
    { key: 'loanAmount', label: 'Amount borrowed', betterDirection: 'lower', format: 'currency' },
    { key: 'payoffPeriods', label: 'Payoff time', betterDirection: 'lower', format: 'months' },
  ],
  'car-loan': [
    { key: 'monthlyPayment', label: 'Payment', betterDirection: 'lower', format: 'currency' },
    { key: 'amountFinanced', label: 'Amount financed', betterDirection: 'lower', format: 'currency' },
    { key: 'totalInterest', label: 'Total interest', betterDirection: 'lower', format: 'currency' },
  ],
  investment: [
    { key: 'finalBalance', label: 'Final balance', betterDirection: 'higher', format: 'currency' },
    { key: 'realBalance', label: 'In today’s money', betterDirection: 'higher', format: 'currency' },
    { key: 'totalGrowth', label: 'Growth', betterDirection: 'higher', format: 'currency' },
    { key: 'totalFees', label: 'Fees', betterDirection: 'lower', format: 'currency' },
  ],
  savings: [
    { key: 'finalBalance', label: 'Final balance', betterDirection: 'higher', format: 'currency' },
    { key: 'totalInterest', label: 'Interest earned', betterDirection: 'higher', format: 'currency' },
    { key: 'monthsToTarget', label: 'Time to goal', betterDirection: 'lower', format: 'months' },
  ],
  'debt-payoff': [
    { key: 'monthsToDebtFree', label: 'Debt free in', betterDirection: 'lower', format: 'months' },
    { key: 'totalInterest', label: 'Total interest', betterDirection: 'lower', format: 'currency' },
    { key: 'totalPaid', label: 'Total paid', betterDirection: 'lower', format: 'currency' },
  ],
}

export function calculateDifference(
  calculatorId: CalculatorId,
  base: Record<string, number>,
  compared: Record<string, number>,
): ScenarioDiff[] {
  return COMPARABLE_FIELDS[calculatorId]
    .filter((field) => base[field.key] !== undefined && compared[field.key] !== undefined)
    .map((field) => ({
      key: field.key,
      label: field.label,
      baseValue: base[field.key],
      comparedValue: compared[field.key],
      delta: roundTo(compared[field.key] - base[field.key], 2),
      betterDirection: field.betterDirection,
    }))
}

/** True when a delta moves in the direction that helps the user. */
export function isImprovement(diff: ScenarioDiff): boolean {
  if (diff.delta === 0) return false
  return diff.betterDirection === 'lower' ? diff.delta < 0 : diff.delta > 0
}
