'use client'

import type { FormEvent, ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/client'

export interface CalculatorFormProps {
  title?: string
  children: ReactNode
  onReset?: () => void
  onSave?: () => void
  /** Shown above the actions when a cross-field rule fails. */
  error?: string | null
  saving?: boolean
}

/**
 * Form shell. Calculators recompute as you type rather than on submit, so
 * there is no primary submit button — the submit handler only exists to stop
 * Enter from reloading the page.
 */
export function CalculatorForm({
  title,
  children,
  onReset,
  onSave,
  error,
  saving = false,
}: CalculatorFormProps) {
  const { t } = useI18n()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{title ?? t.calculatorForm.title}</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {children}

          {error && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {(onReset || onSave) && (
            <div data-form-actions className="flex gap-2 border-t pt-4">
              {onSave && (
                <Button type="button" onClick={onSave} disabled={saving} className="flex-1">
                  {saving ? t.common.saving : t.calculatorForm.saveScenario}
                </Button>
              )}
              {onReset && (
                <Button type="button" variant="outline" onClick={onReset} className="flex-1 gap-2">
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  {t.common.restart}
                </Button>
              )}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
