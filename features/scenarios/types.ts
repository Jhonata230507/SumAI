import type { CalculatorId } from '@/types/common'

export interface CreateScenarioInput {
  calculatorId: CalculatorId
  name: string
  inputs: Record<string, number | string>
  results: Record<string, number>
  notes?: string
}

export interface UpdateScenarioInput {
  id: string
  name?: string
  notes?: string
  inputs?: Record<string, number | string>
  results?: Record<string, number>
}

/** Which result keys a comparison surfaces, and which direction is an improvement. */
export interface ComparableField {
  key: string
  label: string
  betterDirection: 'lower' | 'higher'
  format: 'currency' | 'percent' | 'months' | 'number'
}
