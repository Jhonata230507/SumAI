import type { CalculatorId } from './common'

export interface Scenario {
  id: string
  userId: string
  calculatorId: CalculatorId
  name: string
  inputs: Record<string, number | string>
  results: Record<string, number>
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface ScenarioDiff {
  key: string
  label: string
  baseValue: number
  comparedValue: number
  delta: number
  /** Positive delta is not always good; this says which direction helps the user. */
  betterDirection: 'lower' | 'higher'
}

export interface ScenarioComparison {
  base: Scenario
  compared: Scenario
  diffs: ScenarioDiff[]
  summary: string
}
