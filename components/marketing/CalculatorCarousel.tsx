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
 * large heading and a "view all" link, then light "course" cards — a pastel
 * panel (category chip, title, copy, a large illustration top-right) over a
 * dark footer with a white "Open" pill — that scroll sideways.
 *
 * The track aligns its first card with the page's content column and bleeds
 * to the right edge, so the next card peeks in to show there is more. It
 * scrolls natively (swipe, trackpad, shift-wheel) with snap points per card;
 * the arrow buttons step one card and disable at either end.
 */
/** Each calculator's pastel, after a light "course card" reference. */
const PASTEL: Record<string, string> = {
  loan: 'bg-[#fde2ef]',
  mortgage: 'bg-[#dff1fb]',
  'car-loan': 'bg-[#fbf6c6]',
  investment: 'bg-[#dcf8e3]',
  savings: 'bg-[#e9e3fb]',
  'debt-payoff': 'bg-[#fde6d6]',
}

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
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-x-8 gap-y-4 px-4 sm:px-6 lg:px-8">
        <h2 className="max-w-xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          {c.title}
        </h2>
        <Link
          href="/calculators"
          className="group inline-flex items-center gap-1 pb-2 text-sm font-medium text-primary transition-colors hover:text-foreground/75"
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
          // Aligns the first card with the heading above it: the content column's
          // own gutter, or half the leftover width once the page hits 72rem.
          // One step per breakpoint, matching the heading row's px-4/6/8.
          'px-[max(1rem,calc((100vw-72rem)/2+1rem))] scroll-px-[max(1rem,calc((100vw-72rem)/2+1rem))]',
          'sm:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] sm:scroll-px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]',
          'lg:px-[max(2rem,calc((100vw-72rem)/2+2rem))] lg:scroll-px-[max(2rem,calc((100vw-72rem)/2+2rem))]',
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
                'group relative flex w-[82vw] max-w-[360px] shrink-0 snap-start flex-col overflow-hidden rounded-[1.75rem]',
                'border border-white/[0.1] bg-[#2a2a2a] p-1.5 text-[#111] transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-white/25',
              )}
            >
              {/* Pastel panel: chip, title, text and the illustration top-right. */}
              <div className={cn('relative flex min-h-[15.5rem] flex-col rounded-[1.4rem] p-6', PASTEL[calculator.id])}>
                <CalculatorArt
                  id={calculator.id}
                  className="pointer-events-none absolute -right-4 top-6 w-36 sm:top-1 sm:w-48 transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <span className="w-fit rounded-full bg-black/[0.07] px-2.5 py-1 text-[11px] font-medium">
                  {t.categories[calculator.category].label}
                </span>
                <p className="mt-4 max-w-[9.5rem] text-balance text-2xl font-semibold leading-[1.15] tracking-tight">
                  {name}
                </p>
                <p className="mt-auto pt-6 line-clamp-3 text-[13px] leading-relaxed text-black/60">{card.body}</p>
              </div>

              {/* White footer: a note and the black pill. */}
              <div className="flex items-center justify-end gap-3 px-5 py-3.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors group-hover:bg-white/85">
                  {c.openShort}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Prev / next, aligned with the right edge of the content column. */}
      <div className="mx-auto mt-4 flex max-w-6xl justify-end gap-3 px-4 sm:px-6 lg:px-8">
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
