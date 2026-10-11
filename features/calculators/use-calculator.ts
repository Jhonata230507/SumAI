'use client'

import { useCallback, useMemo, useState } from 'react'
import type { z } from 'zod'
import { toFieldErrors } from '@/lib/validation/common'
import { translateValidation } from '@/lib/i18n'
import { useI18n } from '@/lib/i18n/client'

export interface UseCalculatorOptions<I> {
  /**
   * What the form shows at first, over `initial`. A number set to NaN is an
   * empty field the user must fill: until they do, the calculator is not
   * `ready` and the page shows no result. `initial` stays a complete, valid
   * input underneath, so every derived calculation keeps working meanwhile.
   */
  start?: Partial<I>
  /**
   * Values used for fields the user leaves empty, e.g. a market-average rate.
   * The field still shows empty; the calculation uses the fallback.
   */
  fallback?: Partial<I> | ((input: I) => Partial<I>)
  /** Further fields that, when empty, must be filled (e.g. ones a mode switch empties). */
  required?: (keyof I & string)[]
}

/**
 * State for one calculator form.
 *
 * Holds two copies of the input: `input` is exactly what the user has typed,
 * and `committed` is the last version that passed validation. Results derive
 * from `committed`, so a half-typed field shows an error beside it without the
 * result flashing to zero or jumping back to defaults.
 *
 * Empty fields are NaN. An empty optional field counts as 0; an empty required
 * one (see `start`) keeps the calculator from being `ready`, and its "enter an
 * amount" error is not shown — the page asks for the numbers instead.
 *
 * Schema messages are translation keys; errors come back in the visitor's language.
 */
export function useCalculator<I extends object, R>(
  schema: z.ZodType<I, z.ZodTypeDef, unknown>,
  calculate: (input: I) => R,
  initial: I,
  options: UseCalculatorOptions<I> = {},
) {
  const { t } = useI18n()
  const startInput = useMemo(() => ({ ...initial, ...options.start }) as I, [initial, options.start])
  // A fallback may depend on other inputs (e.g. a rate estimated from a credit score).
  const fallbackFor = useCallback(
    (value: I): Partial<I> =>
      typeof options.fallback === 'function' ? options.fallback(value) : (options.fallback ?? {}),
    [options.fallback],
  )
  const fallback = useMemo(() => fallbackFor(startInput), [fallbackFor, startInput])
  // Fields the user must fill: the ones `start` leaves empty and that have no fallback.
  const required = useMemo(
    () =>
      new Set(
        Object.entries(options.start ?? {})
          .filter(([k, v]) => (isEmpty(v) || hasEmpty(v)) && !(k in fallback))
          .map(([k]) => k)
          .concat(options.required ?? []),
      ),
    [options.start, options.required, fallback],
  )
  // What gets calculated: empty fields with a fallback take it.
  const withFallback = useCallback(
    (value: I) => {
      const current = fallbackFor(value) as Record<string, unknown>
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, isEmpty(v) && k in current ? current[k] : v]),
      ) as I
    },
    [fallbackFor],
  )

  const [input, setInput] = useState<I>(startInput)
  const [committed, setCommitted] = useState<I>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [ready, setReady] = useState(() => !hasEmpty(withFallback(startInput)))

  const update = useCallback(
    (raw: I) => {
      // An empty optional number counts as 0.
      const next = Object.fromEntries(
        Object.entries(raw).map(([key, value]) => [
          key,
          isEmpty(value) && !required.has(key) && !(key in fallback) ? 0 : value,
        ]),
      ) as I
      setInput(next)

      const parsed = schema.safeParse(withFallback(next))
      if (parsed.success) {
        setCommitted(parsed.data)
        setErrors({})
        setReady(true)
        return
      }

      // A required field left empty: no result until it is filled.
      if (hasEmpty(withFallback(next))) setReady(false)
      const keys = toFieldErrors(parsed.error)
      setErrors(
        Object.fromEntries(
          Object.entries(keys)
            // An empty field is not an error yet; the page asks for it instead.
            .filter(([field]) => !isEmpty(valueAt(next, field)))
            .map(([field, key]) => [field, translateValidation(key, t)]),
        ),
      )
    },
    [schema, t, required, fallback, withFallback],
  )

  const set = useCallback(
    <K extends keyof I>(key: K, value: I[K]) => update({ ...input, [key]: value }),
    [input, update],
  )

  const reset = useCallback(() => {
    setInput(startInput)
    setCommitted(initial)
    setErrors({})
    setReady(!hasEmpty(withFallback(startInput)))
  }, [initial, startInput, withFallback])

  const result = useMemo(() => calculate(committed), [calculate, committed])

  return {
    input,
    committed,
    errors,
    result,
    set,
    update,
    reset,
    /** False while a required field is empty: show no result yet. */
    ready,
    /** A form-level error, from a cross-field rule with no single field to sit beside. */
    formError: errors._form ?? null,
  }
}

const isEmpty = (value: unknown) => typeof value === 'number' && Number.isNaN(value)

/** True when any number in the value, nested ones included, is empty. */
function hasEmpty(value: unknown): boolean {
  if (isEmpty(value)) return true
  if (Array.isArray(value)) return value.some(hasEmpty)
  if (value && typeof value === 'object') return Object.values(value).some(hasEmpty)
  return false
}

function valueAt(source: object, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], source)
}
