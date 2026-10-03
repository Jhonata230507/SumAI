import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { Reveal } from '@/components/common/Reveal'

export interface CalculatorLayoutProps {
  header: ReactNode
  form: ReactNode
  results: ReactNode
  /** Charts, schedules and AI analysis, below the fold. */
  detail?: ReactNode
  aside?: ReactNode
  related?: ReactNode
  className?: string
}

/**
 * The shared calculator shell.
 *
 * Form left, result right on desktop; result first on mobile. That ordering is
 * deliberate — on a phone the answer should be visible without scrolling past
 * the inputs the user just filled in.
 */
export function CalculatorLayout({
  header,
  form,
  results,
  detail,
  aside,
  related,
  className,
}: CalculatorLayoutProps) {
  return (
    <div className={cn('mx-auto max-w-6xl px-4 pb-8 pt-12', className)}>
      {/* Own wrapper: `header` comes from a server page, and React's dev key check
          misfires on server-created elements rendered beside static siblings. */}
      <Reveal>{header}</Reveal>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="order-2 lg:order-1">
          <Reveal delay={80} className="lg:sticky lg:top-24">{form}</Reveal>
        </div>

        <Reveal delay={160} className="order-1 space-y-6 lg:order-2">
          {results}
          {aside}
        </Reveal>
      </div>

      {detail && <Reveal className="mt-10 space-y-8">{detail}</Reveal>}
      {related && <Reveal className="mt-12 border-t pt-8">{related}</Reveal>}
    </div>
  )
}
