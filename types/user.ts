import type { CountryCode } from './country'

export interface User {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  createdAt: string
}

export interface FinancialProfile {
  userId: string
  countryCode: CountryCode
  monthlyIncome: number | null
  monthlyExpenses: number | null
  existingDebtPayments: number | null
  creditScore: number | null
  savingsBalance: number | null
  riskTolerance: 'conservative' | 'balanced' | 'aggressive' | null
  updatedAt: string
}

export interface Goal {
  id: string
  userId: string
  name: string
  type: 'savings' | 'debt-free' | 'purchase' | 'retirement'
  targetAmount: number
  currentAmount: number
  targetDate: string | null
  monthlyContribution: number | null
  /** Expected annual return on money set aside for this goal. */
  annualReturn: number
  createdAt: string
}
