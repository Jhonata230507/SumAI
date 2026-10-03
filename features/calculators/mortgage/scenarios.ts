import { calculateMortgage } from './calculation'
import type { MortgageInput, MortgageResult } from './types'

export interface MortgageScenario {
  id: string
  label: string
  description: string
  input: MortgageInput
  result: MortgageResult
}

export function buildMortgageScenarios(base: MortgageInput): MortgageScenario[] {
  const variants = [
    {
      id: 'fifteen-year',
      label: '15-year term',
      description: 'Higher payment, far less interest overall',
      apply: (i: MortgageInput) => ({ ...i, termMonths: 180 }),
    },
    {
      id: 'twenty-percent-down',
      label: '20% down',
      description: 'Enough equity to avoid mortgage insurance',
      apply: (i: MortgageInput) => ({ ...i, downPayment: Math.round(i.homePrice * 0.2) }),
    },
    {
      id: 'extra-200',
      label: 'Extra toward principal',
      description: 'An additional amount applied to principal every month',
      apply: (i: MortgageInput) => ({ ...i, extraPayment: 200 }),
    },
    {
      id: 'rate-drop',
      label: 'Half a point lower',
      description: 'What a refinance at a better rate would look like',
      apply: (i: MortgageInput) => ({ ...i, annualRate: Math.max(0, i.annualRate - 0.005) }),
    },
  ]

  return variants.map(({ apply, ...meta }) => {
    const input = apply(base)
    return { ...meta, input, result: calculateMortgage(input) }
  })
}
