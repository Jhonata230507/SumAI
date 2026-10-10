import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { Reveal } from '@/components/common/Reveal'

export interface CalculatorLayoutProps {
  header: ReactNode
  form: ReactNode
  results: ReactNode
  /** Charts and schedules, below the fold. */
  detail?: ReactNode
  /** The AI explanation: a third column beside the form and results on wide screens. */
  assistant?: ReactNode
  aside?: ReactNode
  related?: ReactNode
  /**
   * Desktop: the form takes the height the results set and scrolls inside,
   * rather than stretching the row. For long forms (e.g. with optional fields
   * expanded), so the results do not fill with empty space.
   */
  scrollableForm?: boolean
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
  assistant,
  aside,
  related,
  className,
  scrollableForm = false,
}: CalculatorLayoutProps) {
  const detailBlock = detail && <Reveal className="space-y-8">{detail}</Reveal>

  if (!assistant) {
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

        {detailBlock && <div className="mt-10">{detailBlock}</div>}
        {related && <Reveal className="mt-12 border-t pt-8">{related}</Reveal>}
      </div>
    )
  }

  // With the AI explanation, one grid holds everything so it can sit beside the
  // numbers as they are typed:
  //   phone  — results, form, explanation, charts, stacked;
  //   lg     — form | results, explanation under the results, charts full width;
  //   xl     — form | results | explanation in one row, charts full width below.
  // The columns of that row share one height: each card stretches to the row,
  // so their bottoms line up. Nothing floats (no sticky columns) here.
  return (
    <div className={cn('mx-auto max-w-6xl px-4 pb-8 pt-12 xl:max-w-[88rem]', className)}>
      <Reveal>{header}</Reveal>

      <div
        className={cn(
          'mt-8 grid gap-6',
          'lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)_minmax(0,320px)]',
        )}
      >
        <Reveal
          delay={80}
          className={cn(
            'order-2 lg:order-none lg:col-start-1 lg:row-span-2 lg:row-start-1 xl:row-span-1 [&>*]:h-full',
            scrollableForm && 'lg:relative',
          )}
        >
          {scrollableForm ? (
            // Out of the flow on wide screens, so the row's height comes from the other
            // columns; the card scrolls within it (min-h-full keeps it filling the column).
            // The form's actions (Restart) stay pinned to the bottom while the fields scroll.
            <div
              className={cn(
                'lg:absolute lg:inset-0 lg:overflow-y-auto lg:rounded-2xl [&>*]:min-h-full',
                'lg:[scrollbar-width:thin] lg:[scrollbar-color:rgba(255,255,255,0.15)_transparent]',
                'lg:[&_[data-form-actions]]:sticky lg:[&_[data-form-actions]]:bottom-0 lg:[&_[data-form-actions]]:z-10',
                'lg:[&_[data-form-actions]]:-mx-6 lg:[&_[data-form-actions]]:-mb-6 lg:[&_[data-form-actions]]:px-6 lg:[&_[data-form-actions]]:pb-6',
                'lg:[&_[data-form-actions]]:bg-card lg:[&_[data-form-actions]]:shadow-[0_-12px_20px_-12px_rgba(0,0,0,0.6)]',
              )}
            >
              {form}
            </div>
          ) : (
            form
          )}
        </Reveal>

        {/* One results card grows to fill the column, so it ends level with the form: the
            one marked data-grow, or else the last. */}
        <Reveal
          delay={160}
          className="order-1 flex flex-col gap-6 lg:order-none lg:col-start-2 lg:row-start-1 [&>*:last-child]:flex-1 has-[>[data-grow]]:[&>*:last-child]:flex-none [&>[data-grow]]:flex-1"
        >
          {results}
          {aside}
        </Reveal>

        <Reveal
          delay={240}
          className="order-3 lg:order-none lg:col-start-2 lg:row-start-2 xl:col-start-3 xl:row-start-1 xl:[&>*]:h-full"
        >
          {assistant}
        </Reveal>

        {detailBlock && (
          <div className="order-4 mt-4 lg:order-none lg:col-span-2 lg:col-start-1 lg:row-start-3 xl:col-span-3 xl:row-start-2">
            {detailBlock}
          </div>
        )}
      </div>

      {related && <Reveal className="mt-12 border-t pt-8">{related}</Reveal>}
    </div>
  )
}
