'use client'

import { useEffect, useMemo, useState } from 'react'

/**
 * Single-choice "what if" scenarios on top of a calculator.
 *
 * Applying a scenario remembers the numbers it replaced (the base). While one
 * is applied, every scenario is still built from — and compared against — that
 * base, so picking another one swaps it in rather than stacking on the first.
 * Clicking the applied one again restores the base.
 *
 * Editing any input ends the scenario: the edited numbers become the new base.
 */
export function useWhatIf<I extends object, S extends { id: string; input: I }>(
  committed: I,
  build: (base: I) => S[],
  update: (next: I) => void,
) {
  const [applied, setApplied] = useState<{ id: string; base: I; input: I } | null>(null)

  // The user changed something after applying: the scenario no longer describes the form.
  useEffect(() => {
    if (applied && !sameInput(committed, applied.input)) setApplied(null)
  }, [committed, applied])

  const base = applied?.base ?? committed
  const scenarios = useMemo(() => build(base), [build, base])

  function toggle(id: string) {
    if (applied?.id === id) {
      setApplied(null)
      update(applied.base)
      return
    }
    const scenario = scenarios.find((candidate) => candidate.id === id)
    if (!scenario) return
    setApplied({ id, base, input: scenario.input })
    update(scenario.input)
  }

  return { base, scenarios, selectedId: applied?.id ?? null, toggle }
}

/** Field-by-field equality, ignoring key order and missing-versus-undefined. */
function sameInput(a: object, b: object): boolean {
  const left = a as Record<string, unknown>
  const right = b as Record<string, unknown>
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  for (const key of keys) {
    if (JSON.stringify(left[key] ?? null) !== JSON.stringify(right[key] ?? null)) return false
  }
  return true
}
