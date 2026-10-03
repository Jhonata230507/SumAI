'use client'

import { useCallback, useMemo, useState } from 'react'
import type { z } from 'zod'
import { toFieldErrors } from '@/lib/validation/common'
import { translateValidation } from '@/lib/i18n'
import { useI18n } from '@/lib/i18n/client'

/**
 * State for one calculator form.
 *
 * Holds two copies of the input: `input` is exactly what the user has typed,
 * and `committed` is the last version that passed validation. Results derive
 * from `committed`, so a half-typed field shows an error beside it without the
 * result flashing to zero or jumping back to defaults.
 *
 * Schema messages are translation keys; errors come back in the visitor's language.
 */
export function useCalculator<I extends object, R>(
  schema: z.ZodType<I, z.ZodTypeDef, unknown>,
  calculate: (input: I) => R,
  initial: I,
) {
  const { t } = useI18n()
  const [input, setInput] = useState<I>(initial)
  const [committed, setCommitted] = useState<I>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const update = useCallback(
    (next: I) => {
      setInput(next)
      const parsed = schema.safeParse(next)
      if (parsed.success) {
        setCommitted(parsed.data)
        setErrors({})
      } else {
        const keys = toFieldErrors(parsed.error)
        setErrors(
          Object.fromEntries(
            Object.entries(keys).map(([field, key]) => [field, translateValidation(key, t)]),
          ),
        )
      }
    },
    [schema, t],
  )

  const set = useCallback(
    <K extends keyof I>(key: K, value: I[K]) => update({ ...input, [key]: value }),
    [input, update],
  )

  const reset = useCallback(() => update(initial), [initial, update])

  const result = useMemo(() => calculate(committed), [calculate, committed])

  return {
    input,
    committed,
    errors,
    result,
    set,
    update,
    reset,
    /** A form-level error, from a cross-field rule with no single field to sit beside. */
    formError: errors._form ?? null,
  }
}
