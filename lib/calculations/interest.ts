/**
 * Rate conversions. Markets quote rates differently — the US quotes a nominal
 * annual rate compounded monthly, Colombia commonly quotes an effective annual
 * rate (E.A.) — and mixing the two silently produces wrong payments.
 *
 * These return full precision on purpose. Rounding a periodic rate mid-calculation
 * shifts the payment by cents, and over a 30-year mortgage the drift compounds.
 * Round only for display, via formatPercent.
 */

/** Nominal annual rate to periodic rate: 0.06 over 12 periods gives 0.005. */
export function nominalToPeriodic(annualRate: number, periodsPerYear: number): number {
  if (periodsPerYear <= 0) throw new Error('periodsPerYear must be positive')
  return annualRate / periodsPerYear
}

/** Effective annual rate to the equivalent periodic rate. */
export function effectiveToPeriodic(effectiveAnnual: number, periodsPerYear: number): number {
  if (periodsPerYear <= 0) throw new Error('periodsPerYear must be positive')
  return (1 + effectiveAnnual) ** (1 / periodsPerYear) - 1
}

/** Periodic rate to effective annual rate. */
export function periodicToEffective(periodicRate: number, periodsPerYear: number): number {
  return (1 + periodicRate) ** periodsPerYear - 1
}

/** Nominal annual rate compounded m times per year to effective annual rate. */
export function nominalToEffective(annualRate: number, periodsPerYear: number): number {
  return periodicToEffective(nominalToPeriodic(annualRate, periodsPerYear), periodsPerYear)
}

/** Strips inflation out of a nominal return (Fisher equation). */
export function realRate(nominalRate: number, inflationRate: number): number {
  return (1 + nominalRate) / (1 + inflationRate) - 1
}

/**
 * Resolves a quoted annual rate into a periodic rate, honouring how the
 * country quotes it. Every calculator funnels through here.
 */
export function toPeriodicRate(
  annualRate: number,
  periodsPerYear: number,
  quotesEffectiveAnnualRate: boolean,
): number {
  return quotesEffectiveAnnualRate
    ? effectiveToPeriodic(annualRate, periodsPerYear)
    : nominalToPeriodic(annualRate, periodsPerYear)
}
