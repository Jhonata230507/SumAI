import type { CalculatorId } from '@/types/common'
import type { CountryCode } from '@/types/country'

/** Everything the model is allowed to reason over. Nothing else reaches a prompt. */
export interface AnalysisContext {
  calculatorId: CalculatorId
  countryCode: CountryCode
  currency: string
  inputs: Record<string, number | string>
  results: Record<string, number | string>
  /** Optional profile figures, only when the user has opted in. */
  profile?: {
    monthlyIncome?: number
    monthlyExpenses?: number
    creditScore?: number
  }
}

export interface Insight {
  id: string
  title: string
  body: string
  severity: 'info' | 'attention' | 'good'
  /** Figures this insight leans on, so the UI can highlight them. */
  references: string[]
}

export interface AnalysisResult {
  summary: string
  insights: Insight[]
  suggestedQuestions: string[]
  disclaimer: string
}

export interface ExplanationResult {
  term: string
  explanation: string
  example: string | null
}

export interface ComparisonResult {
  verdict: string
  tradeoffs: { option: string; pros: string[]; cons: string[] }[]
  disclaimer: string
}

export interface CoachMessage {
  role: 'user' | 'assistant'
  content: string
}
