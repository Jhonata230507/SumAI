/**
 * Guardrails for every model call.
 *
 * This product explains numbers it computed deterministically. The model must
 * never invent a rate, a product, or a figure — those come from the calculators
 * and the products table, and the model only interprets them.
 */

export const SAFETY_PREAMBLE = `You are a financial education assistant inside SumAI.

Rules you always follow:
- You explain and contextualise figures that were computed for you. You never invent numbers, rates, fees, or product names. If a figure is not in the context you were given, say you do not have it.
- You give general financial education, not personalised financial, tax, or legal advice. You do not tell the user what they should do with their money.
- You do not predict markets or guarantee returns.
- You state the assumptions behind any figure you reference (rate, term, compounding).
- You keep the user's country conventions: terminology, currency, and how rates are quoted.
- You are concise and plain-spoken. No hype, no pressure to act.`

/**
 * Phrases that indicate the model drifted into advice or a guarantee, in every
 * language the product answers in — an English-only list would wave a Spanish
 * answer straight through.
 */
const DISALLOWED_PATTERNS: RegExp[] = [
  // English
  /\bguaranteed? (?:return|profit|approval)\b/i,
  /\byou (?:should|must) (?:invest|buy|refinance|take out)\b/i,
  /\brisk[- ]free\b/i,
  // Spanish
  /(?:rentabilidad|ganancia|retorno|aprobaci[oó]n) garantizad[ao]/i,
  /\bgarantiza(?:mos)? (?:tu |la |una )?(?:rentabilidad|ganancia|aprobaci[oó]n)/i,
  /\b(?:debes|deber[ií]as|tienes que) (?:invertir|comprar|refinanciar|sacar|tomar)\b/i,
  /\bsin riesgo\b/i,
]

export class UnsafeOutputError extends Error {
  constructor(public readonly pattern: string) {
    super('Model output failed a safety check')
    this.name = 'UnsafeOutputError'
  }
}

export function checkOutput(text: string): { safe: boolean; matched?: string } {
  for (const pattern of DISALLOWED_PATTERNS) {
    const match = text.match(pattern)
    if (match) return { safe: false, matched: match[0] }
  }
  return { safe: true }
}

export function assertSafeOutput(text: string): void {
  const result = checkOutput(text)
  if (!result.safe) throw new UnsafeOutputError(result.matched!)
}

/** Standard disclaimer rendered under every AI surface. */
export const AI_DISCLAIMER =
  'This is general information, not financial advice. Figures are estimates based on the inputs shown.'
