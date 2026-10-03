import { effectiveToPeriodic } from '@/lib/calculations/interest'
import { roundMoney } from '@/lib/calculations/rounding'
import { getCountry } from '@/lib/countries'
import type {
  Debt,
  DebtPayoffDetail,
  DebtPayoffInput,
  DebtPayoffResult,
  PayoffMonth,
  PayoffStrategy,
  StrategyComparison,
} from './types'

const MAX_MONTHS = 600

/**
 * Simulates paying down several debts month by month.
 *
 * Both named strategies pay every minimum, then throw the entire remaining
 * budget at one target debt. Avalanche targets the highest rate, which always
 * costs the least interest; snowball targets the smallest balance, which clears
 * accounts sooner. The simulation is honest about both — it does not pick.
 */
export function calculateDebtPayoff(input: DebtPayoffInput): DebtPayoffResult {
  const country = getCountry(input.countryCode)
  const totalMinimums = input.debts.reduce((sum, d) => sum + d.minimumPayment, 0)

  if (input.monthlyBudget < totalMinimums) {
    return emptyResult(input, country.currency, roundMoney(totalMinimums - input.monthlyBudget))
  }

  const order = orderDebts(input.debts, input.strategy)
  const balances = new Map(input.debts.map((d) => [d.id, d.balance]))
  const interestPaid = new Map(input.debts.map((d) => [d.id, 0]))
  const amountPaid = new Map(input.debts.map((d) => [d.id, 0]))
  const payoffMonth = new Map<string, number>()

  const timeline: PayoffMonth[] = []
  let month = 0
  let cumulativePaid = 0

  while (month < MAX_MONTHS && anyRemaining(balances)) {
    month += 1
    let monthInterest = 0
    let monthPaid = 0

    // 1. Accrue interest on every open balance.
    for (const debt of input.debts) {
      const balance = balances.get(debt.id)!
      if (balance <= 0) continue

      const monthlyRate = country.rules.consumerRatesEffective
        ? effectiveToPeriodic(debt.annualRate, 12)
        : debt.annualRate / 12
      const interest = roundMoney(balance * monthlyRate)
      balances.set(debt.id, roundMoney(balance + interest))
      interestPaid.set(debt.id, roundMoney(interestPaid.get(debt.id)! + interest))
      monthInterest += interest
    }

    // 2. Pay minimums on everything still open.
    let available = input.monthlyBudget
    for (const debt of input.debts) {
      const balance = balances.get(debt.id)!
      if (balance <= 0) continue

      const payment = Math.min(debt.minimumPayment, balance, available)
      applyPayment(debt.id, payment, balances, amountPaid)
      available = roundMoney(available - payment)
      monthPaid += payment
    }

    // 3. Everything left goes to the target debt, then the next one, and so on.
    for (const debt of order) {
      if (available <= 0) break
      const balance = balances.get(debt.id)!
      if (balance <= 0) continue

      const payment = Math.min(available, balance)
      applyPayment(debt.id, payment, balances, amountPaid)
      available = roundMoney(available - payment)
      monthPaid += payment
    }

    // 4. Record anything cleared this month.
    for (const debt of input.debts) {
      if (balances.get(debt.id)! <= 0 && !payoffMonth.has(debt.id)) {
        payoffMonth.set(debt.id, month)
      }
    }

    cumulativePaid = roundMoney(cumulativePaid + monthPaid)
    timeline.push({
      month,
      totalBalance: roundMoney([...balances.values()].reduce((a, b) => a + Math.max(0, b), 0)),
      totalPaid: cumulativePaid,
      interestPaid: roundMoney(monthInterest),
    })
  }

  const perDebt: DebtPayoffDetail[] = input.debts.map((debt) => ({
    debtId: debt.id,
    name: debt.name,
    payoffMonth: payoffMonth.get(debt.id) ?? Infinity,
    totalInterest: interestPaid.get(debt.id)!,
    totalPaid: amountPaid.get(debt.id)!,
  }))

  return {
    strategy: input.strategy,
    monthsToDebtFree: month,
    totalInterest: roundMoney(perDebt.reduce((sum, d) => sum + d.totalInterest, 0)),
    totalPaid: cumulativePaid,
    perDebt,
    timeline,
    payoffOrder: [...perDebt]
      .sort((a, b) => a.payoffMonth - b.payoffMonth)
      .map((d) => d.debtId),
    currency: country.currency,
    shortfall: null,
  }
}

function applyPayment(
  id: string,
  payment: number,
  balances: Map<string, number>,
  amountPaid: Map<string, number>,
) {
  balances.set(id, roundMoney(balances.get(id)! - payment))
  amountPaid.set(id, roundMoney(amountPaid.get(id)! + payment))
}

function anyRemaining(balances: Map<string, number>): boolean {
  for (const balance of balances.values()) if (balance > 0) return true
  return false
}

function orderDebts(debts: Debt[], strategy: PayoffStrategy): Debt[] {
  const copy = [...debts]
  if (strategy === 'avalanche') return copy.sort((a, b) => b.annualRate - a.annualRate)
  if (strategy === 'snowball') return copy.sort((a, b) => a.balance - b.balance)
  return copy
}

function emptyResult(
  input: DebtPayoffInput,
  currency: DebtPayoffResult['currency'],
  shortfall: number,
): DebtPayoffResult {
  return {
    strategy: input.strategy,
    monthsToDebtFree: Infinity,
    totalInterest: 0,
    totalPaid: 0,
    perDebt: [],
    timeline: [],
    payoffOrder: [],
    currency,
    shortfall,
  }
}

/** Runs both strategies so the UI can show the real trade-off side by side. */
export function compareStrategies(input: DebtPayoffInput): StrategyComparison {
  const avalanche = calculateDebtPayoff({ ...input, strategy: 'avalanche' })
  const snowball = calculateDebtPayoff({ ...input, strategy: 'snowball' })

  return {
    avalanche,
    snowball,
    interestDifference: roundMoney(snowball.totalInterest - avalanche.totalInterest),
    monthsDifference: snowball.monthsToDebtFree - avalanche.monthsToDebtFree,
  }
}
