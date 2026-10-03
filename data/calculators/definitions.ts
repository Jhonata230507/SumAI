import type { CalculatorId } from '@/types/common'

export interface CalculatorDefinition {
  id: CalculatorId
  slug: string
  title: string
  shortTitle: string
  description: string
  /** One line for the card and the meta description. */
  tagline: string
  category: 'borrowing' | 'growing' | 'planning'
  icon: string
  /** Product category to surface beneath the result, when one applies. */
  productCategory: 'mortgage' | 'car-loan' | 'personal-loan' | 'savings' | null
  related: CalculatorId[]
  keywords: string[]
  popular: boolean
}

/**
 * The calculator registry. Navigation, the index page, related links and
 * sitemap entries all read from here, so a new calculator is added once.
 */
export const CALCULATORS: Record<CalculatorId, CalculatorDefinition> = {
  loan: {
    id: 'loan',
    slug: 'loan',
    title: 'Loan Calculator',
    shortTitle: 'Loan',
    description:
      'Work out the payment, total interest and payoff date on any instalment loan, and see what paying a little extra would do.',
    tagline: 'Payment, interest and payoff on any loan',
    category: 'borrowing',
    icon: 'banknote',
    productCategory: 'personal-loan',
    related: ['mortgage', 'car-loan', 'debt-payoff'],
    keywords: ['loan calculator', 'monthly payment', 'amortization', 'interest'],
    popular: true,
  },

  mortgage: {
    id: 'mortgage',
    slug: 'mortgage',
    title: 'Mortgage Calculator',
    shortTitle: 'Mortgage',
    description:
      'The full monthly cost of a home: principal, interest, tax, insurance and mortgage insurance, plus what you can afford.',
    tagline: 'The real monthly cost of a home',
    category: 'borrowing',
    icon: 'home',
    productCategory: 'mortgage',
    related: ['loan', 'savings', 'investment'],
    keywords: ['mortgage calculator', 'home loan', 'affordability', 'down payment'],
    popular: true,
  },

  'car-loan': {
    id: 'car-loan',
    slug: 'car-loan',
    title: 'Car Loan Calculator',
    shortTitle: 'Car loan',
    description:
      'Finance a vehicle including tax, fees and a trade-in, and see when you stop owing more than the car is worth.',
    tagline: 'Vehicle financing, tax and trade-in included',
    category: 'borrowing',
    icon: 'car',
    productCategory: 'car-loan',
    related: ['loan', 'debt-payoff', 'savings'],
    keywords: ['car loan calculator', 'auto loan', 'trade-in', 'negative equity'],
    popular: true,
  },

  investment: {
    id: 'investment',
    slug: 'investment',
    title: 'Investment Calculator',
    shortTitle: 'Investment',
    description:
      'Project what regular contributions could grow into, after fees, and what that will be worth in today’s money.',
    tagline: 'What regular investing could grow into',
    category: 'growing',
    icon: 'trending-up',
    productCategory: null,
    related: ['savings', 'mortgage', 'loan'],
    keywords: ['investment calculator', 'compound interest', 'returns', 'retirement'],
    popular: true,
  },

  savings: {
    id: 'savings',
    slug: 'savings',
    title: 'Savings Calculator',
    shortTitle: 'Savings',
    description:
      'Grow a savings balance at a given rate, or work backwards from a target to the deposit it takes to get there.',
    tagline: 'Reach a savings target, or project a balance',
    category: 'growing',
    icon: 'piggy-bank',
    productCategory: 'savings',
    related: ['investment', 'mortgage', 'debt-payoff'],
    keywords: ['savings calculator', 'compound interest', 'savings goal', 'APY'],
    popular: true,
  },

  'debt-payoff': {
    id: 'debt-payoff',
    slug: 'debt-payoff',
    title: 'Debt Payoff Calculator',
    shortTitle: 'Debt payoff',
    description:
      'Compare avalanche and snowball across all your debts, and see what each one costs in interest and time.',
    tagline: 'Avalanche or snowball, compared honestly',
    category: 'planning',
    icon: 'trending-down',
    productCategory: 'personal-loan',
    related: ['loan', 'car-loan', 'savings'],
    keywords: ['debt payoff calculator', 'avalanche', 'snowball', 'debt free'],
    popular: true,
  },
}

export const CALCULATOR_LIST = Object.values(CALCULATORS)

export const CALCULATOR_CATEGORIES = [
  { id: 'borrowing', label: 'Borrowing', description: 'Loans, mortgages and financing' },
  { id: 'growing', label: 'Growing', description: 'Saving and investing over time' },
  { id: 'planning', label: 'Planning', description: 'Getting out of debt and hitting goals' },
] as const

export function getCalculator(id: CalculatorId): CalculatorDefinition {
  return CALCULATORS[id]
}

export function getCalculatorBySlug(slug: string): CalculatorDefinition | undefined {
  return CALCULATOR_LIST.find((c) => c.slug === slug)
}

export function calculatorsByCategory(category: CalculatorDefinition['category']) {
  return CALCULATOR_LIST.filter((c) => c.category === category)
}

export function relatedCalculators(id: CalculatorId): CalculatorDefinition[] {
  return CALCULATORS[id].related.map(getCalculator)
}
