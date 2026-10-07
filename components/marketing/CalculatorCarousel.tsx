'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { CALCULATOR_LIST } from '@/data/calculators/definitions'
import { useI18n } from '@/lib/i18n/client'
import { cn } from '@/lib/utils/cn'
import { CalculatorArt } from './CalculatorArt'

/**
 * Horizontal carousel of the six calculators, after the Apple "Why buy" row:
 * large heading and a "view all" link, then tall cards — category, headline,
 * a line of copy, an illustration and a round arrow — that scroll sideways.
 *
 * The track aligns its first card with the page's content column and bleeds
 * to the right edge, so the next card peeks in to show there is more. It
 * scrolls natively (swipe, trackpad, shift-wheel) with snap points per card;
 * the arrow buttons step one card and disable at either end.
 */
export function CalculatorCarousel() {
  const { t } = useI18n()
  const c = t.home.carousel
  const track = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const measure = useCallback(() => {
    const el = track.current
    if (!el) return
    setAtStart(el.scrollLeft <= 4)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  function step(direction: 1 | -1) {
    const el = track.current
    const card = el?.querySelector<HTMLElement>('[data-card]')
    if (!el || !card) return
    const gap = 20
    el.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: 'smooth' })
  }

  return (
    <div className="w-full">
      {/* Heading row, on the page's content column. */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-x-8 gap-y-4 px-4">
        <h2 className="max-w-xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          {c.title}
        </h2>
        <Link
          href="/calculators"
          className="group inline-flex items-center gap-1 pb-2 text-sm font-medium text-primary transition-colors hover:text-[#ff8a63]"
        >
          {c.viewAll}
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Track: first card on the content column, bleeding off to the right. */}
      <div
        ref={track}
        onScroll={measure}
        className={cn(
          // pt-2 leaves room for the hover lift: a horizontal scroller also clips vertically.
          'mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pt-2',
          'px-[max(1rem,calc((100vw-72rem)/2+1rem))] scroll-px-[max(1rem,calc((100vw-72rem)/2+1rem))]',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        {CALCULATOR_LIST.map((calculator) => {
          const card = c.cards[calculator.id]
          const name = t.calculators[calculator.id].title
          return (
            <Link
              key={calculator.id}
              data-card
              href={`/calculators/${calculator.slug}`}
              aria-label={c.open(name)}
              className={cn(
                'group relative flex h-[480px] w-[82vw] max-w-[340px] shrink-0 snap-start flex-col overflow-hidden rounded-[1.75rem]',
                'border border-white/[0.06] bg-card p-7 transition-[border-color,transform] duration-300',
                'hover:-translate-y-1 hover:border-white/25',
              )}
            >
              <p className="text-balance text-[1.6rem] font-semibold leading-[1.15] tracking-tight">
                {name}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{card.body}</p>

              <CalculatorArt
                id={calculator.id}
                className="mt-auto w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />

              <span className="absolute bottom-6 right-6 flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-foreground backdrop-blur transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
          )
        })}
      </div>

      {/* Prev / next, aligned with the right edge of the content column. */}
      <div className="mx-auto mt-4 flex max-w-6xl justify-end gap-3 px-4">
        <CarouselButton label={c.previous} disabled={atStart} onClick={() => step(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </CarouselButton>
        <CarouselButton label={c.next} disabled={atEnd} onClick={() => step(1)}>
          <ChevronRight className="h-5 w-5" />
        </CarouselButton>
      </div>
    </div>
  )
}

export function CarouselButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-foreground transition-colors',
        'hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:cursor-default disabled:opacity-35 disabled:hover:bg-white/[0.08]',
      )}
    >
      {children}
    </button>
  )
}
