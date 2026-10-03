import { calculateLoan } from './calculation'
import type { LoanInput, LoanResult } from './types'

export interface LoanScenario {
  id: string
  label: string
  description: string
  input: LoanInput
  result: LoanResult
}

/**
 * Preset what-if branches shown beside the main result.
 * Each one changes exactly one variable, so the comparison stays readable.
 */
export function buildLoanScenarios(base: LoanInput): LoanScenario[] {
  const variants: { id: string; label: string; description: string; apply: (i: LoanInput) => LoanInput }[] = [
    {
      id: 'shorter-term',
      label: 'Shorter term',
      description: 'Same loan paid over 12 fewer months',
      apply: (i) => ({ ...i, termMonths: Math.max(12, i.termMonths - 12) }),
    },
    {
      id: 'extra-payment',
      label: 'Pay a little extra',
      description: 'An extra 10% of the payment toward principal each period',
      apply: (i) => ({
        ...i,
        extraPayment: Math.round(calculateLoan(i).payment * 0.1),
      }),
    },
    {
      id: 'better-rate',
      label: 'One point lower',
      description: 'The same loan at a rate one percentage point lower',
      apply: (i) => ({ ...i, annualRate: Math.max(0, i.annualRate - 0.01) }),
    },
  ]

  return variants.map(({ apply, ...meta }) => {
    const input = apply(base)
    return { ...meta, input, result: calculateLoan(input) }
  })
}

/** How much a scenario improves on the base case, in money terms. */
export function scenarioSavings(base: LoanResult, scenario: LoanResult) {
  return {
    interestDelta: Number((scenario.totalInterest - base.totalInterest).toFixed(2)),
    paymentDelta: Number((scenario.payment - base.payment).toFixed(2)),
    periodsDelta: scenario.payoffPeriods - base.payoffPeriods,
  }
}
