import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { Reveal } from '@/components/common/Reveal'
import { EmptyResults } from './EmptyResults'
import { FormColumn } from './FormColumn'

export interface CalculatorLayoutProps {
  header: ReactNode
  form: ReactNode
  results: ReactNode
  /** Charts and schedules, below the fold. */
  detail?: ReactNode
  /** The AI explanation: a third column beside the form and results on wide screens. */
  assistant?: ReactNode
  aside?: ReactNode
  /**
   * The AI explanation ("What this means"). Not shown for now: the column it used
   * shows the recommended credits instead. Kept so it can be placed again.
   */
  explanation?: ReactNode
  related?: ReactNode
  /**
   * Desktop: the form scrolls inside instead of stretching the row, keeping the
   * height it had before. For long forms (e.g. with optional fields expanded),
   * so the results do not fill with empty space and the box does not shrink.
   */
  scrollableForm?: boolean
  /**
   * False until the user has filled in the required fields: the results, the
   * explanation and everything below make way for a prompt to enter the numbers.
   */
  ready?: boolean
  className?: string
}

/**
 * The shared calculator shell.
 *
 * Form left, result right on desktop; result first on mobile. That ordering is
 * deliberate — on a phone the answer should be visible without scrolling past
 * the inputs the user just filled in.
 */
// The header, form, results and recommendations show at once (Reveal instant):
// a calculator is a tool, and fading it in for a second reads as slowness.
// Only what sits further down (charts, related calculators) fades in.
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
  ready = true,
}: CalculatorLayoutProps) {
  const detailBlock = ready && detail && <Reveal className="space-y-8">{detail}</Reveal>

  if (!assistant) {
    return (
      <div className={cn('mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-8 pt-12', className)}>
        {/* Own wrapper: `header` comes from a server page, and React's dev key check
            misfires on server-created elements rendered beside static siblings. */}
        <Reveal instant>{header}</Reveal>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <div className="order-2 lg:order-1">
            <Reveal instant delay={80} className="lg:sticky lg:top-24">
              {form}
            </Reveal>
          </div>

          <Reveal instant delay={160} className="order-1 space-y-6 lg:order-2">
            {ready ? (
              <>
                {results}
                {aside}
              </>
            ) : (
              <EmptyResults />
            )}
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
    // The three-column row needs the extra width, but on a 13" laptop 88rem is
    // wider than the screen, so the cap alone would leave the content hugging
    // both edges. The wider gutter from xl up keeps it breathing there, and
    // costs nothing on a large display where the cap bites first.
    <div
      className={cn(
        'mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6 lg:px-8 xl:max-w-[88rem] xl:px-12',
        className,
      )}
    >
      <Reveal instant>{header}</Reveal>

      <div
        className={cn(
          'mt-8 grid gap-6',
          'lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)_minmax(0,320px)]',
        )}
      >
        <Reveal
          instant
          delay={80}
          className="order-2 lg:order-none lg:col-start-1 lg:row-span-2 lg:row-start-1 xl:row-span-1 [&>*]:h-full"
        >
          {/* Scrollable when asked (long forms), keeping the height it had before. */}
          <FormColumn scrollable={scrollableForm}>{form}</FormColumn>
        </Reveal>

        {!ready && (
          // Until the numbers are in, one prompt takes the results and explanation columns.
          <Reveal
            instant
            delay={160}
            className="order-1 lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1 xl:col-span-2 xl:row-span-1 [&>*]:h-full"
          >
            <EmptyResults />
          </Reveal>
        )}

        {/* One results card grows to fill the column, so it ends level with the form: the
            one marked data-grow, or else the last. */}
        {ready && (
          <Reveal
            instant
            delay={160}
            className="order-1 flex flex-col gap-6 lg:order-none lg:col-start-2 lg:row-start-1 [&>*:last-child]:flex-1 has-[>[data-grow]]:[&>*:last-child]:flex-none [&>[data-grow]]:flex-1"
          >
            {results}
            {aside}
          </Reveal>
        )}

        {ready && (
          <Reveal
            instant
            delay={240}
            className="order-3 lg:order-none lg:col-start-2 lg:row-start-2 xl:col-start-3 xl:row-start-1 xl:[&>*]:h-full"
          >
            {assistant}
          </Reveal>
        )}

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
