import { en, type Dictionary } from './dictionaries/en'
import { es } from './dictionaries/es'
import { getCalculator, type CalculatorDefinition } from '@/data/calculators/definitions'
import type { CalculatorId, Language } from '@/types/common'

/**
 * Interface language follows the country: picking Colombia (COP) switches the
 * whole UI to Spanish; the United States and Canada are English. The language
 * lives on each country config, so this module never hard-codes a mapping.
 */

const DICTIONARIES: Record<Language, Dictionary> = { en, es }

export function getDictionary(language: Language): Dictionary {
  return DICTIONARIES[language] ?? en
}

/** A calculator definition with its visible text in the requested language. */
export function localizeCalculator(id: CalculatorId, t: Dictionary): CalculatorDefinition {
  return { ...getCalculator(id), ...t.calculators[id] }
}

/** Translates a validation message key, falling back to the key itself. */
export function translateValidation(key: string, t: Dictionary): string {
  return t.validation[key] ?? key
}

export type { Dictionary, Language }
