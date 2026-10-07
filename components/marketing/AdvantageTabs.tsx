'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { CarouselButton } from './CalculatorCarousel'

export interface AdvantageItem {
  key: string
  tab: string
  icon: ReactNode
  title: string
  body: string
  cta: string
  href: string
  visual: ReactNode
}

/**
 * The "Why SumAI" showcase: one large card — text and a call to action on the
 * left, a visual on the right — stepped through with the same round prev/next
 * buttons as the calculators carousel, centred under the card. The buttons
 * disable at either end, like the carousel's.
 *
 * The card is a live region, so screen readers announce each new advantage.
 */
export function AdvantageTabs({
  items,
  label,
  labels,
}: {
  items: AdvantageItem[]
  label: string
  /** `positions[i]` announces item i, e.g. "2 of 3". */
  labels: { previous: string; next: string; positions: string[] }
}) {
  const [active, setActive] = useState(0)
  const go = (delta: number) => setActive((a) => Math.min(items.length - 1, Math.max(0, a + delta)))

  return (
    <section aria-roledescription="carousel" aria-label={label}>
      {/* The showcase card. Every item is rendered into the same grid cell, so the
          card always takes the height of the tallest one and does not jump when
          switching; only the active item is visible (and reachable). */}
      <div
        aria-live="polite"
        aria-label={labels.positions[active]}
        className="grid overflow-hidden rounded-[2rem] border border-white/[0.06] bg-card p-3 sm:p-4"
      >
        {items.map((item, index) => {
          const shown = index === active
          return (
            <div
              key={item.key}
              aria-hidden={!shown}
              inert={!shown}
              className={cn(
                'grid gap-4 [grid-area:1/1] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]',
                shown ? 'advantage-in' : 'invisible',
              )}
            >
              <div className="flex flex-col p-5 sm:p-8">
                {item.icon}
                <h3 className="mt-6 text-balance text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                  {item.title}
                </h3>
                <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">{item.body}</p>
                <div className="mt-8 lg:mt-auto lg:pt-10">
                  <Link
                    href={item.href}
                    className="group inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-[0_0_20px_-4px_rgba(255,122,79,0.55)] transition-[background-color,box-shadow] duration-300 hover:bg-[#ff8a63] hover:shadow-[0_0_32px_-2px_rgba(255,122,79,0.75)]"
                  >
                    {item.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </div>
              </div>

              {/* Visual panel. */}
              <div className="relative flex min-h-[22rem] items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/[0.05] bg-muted/60 p-6 sm:p-10">
                <span aria-hidden className="absolute h-[34rem] w-[34rem] rounded-full border border-white/[0.04]" />
                <span aria-hidden className="absolute h-[22rem] w-[22rem] rounded-full border border-white/[0.05]" />
                <div className="relative w-full max-w-sm">{item.visual}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Prev / next, the calculators carousel's buttons, centred. */}
      <div className="mt-6 flex justify-center gap-3">
        <CarouselButton label={labels.previous} disabled={active === 0} onClick={() => go(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </CarouselButton>
        <CarouselButton label={labels.next} disabled={active === items.length - 1} onClick={() => go(1)}>
          <ChevronRight className="h-5 w-5" />
        </CarouselButton>
      </div>
    </section>
  )
}
