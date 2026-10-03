'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowRight,
  Banknote,
  Car,
  ChevronDown,
  Home,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { CALCULATOR_CATEGORIES, calculatorsByCategory } from '@/data/calculators/definitions'
import { cn } from '@/lib/utils/cn'
import { useI18n } from '@/lib/i18n/client'
import type { Dictionary } from '@/lib/i18n'

const ICONS: Record<string, LucideIcon> = {
  banknote: Banknote,
  home: Home,
  car: Car,
  'trending-up': TrendingUp,
  'piggy-bank': PiggyBank,
  'trending-down': TrendingDown,
}

/** How long the panel stays open after the pointer leaves, so a diagonal move to it doesn't close it. */
const CLOSE_DELAY = 140

/**
 * "Calculators" in the top bar: a link to /calculators that also opens a
 * panel of every calculator, grouped by category, on hover or keyboard focus.
 *
 * Clicking the label itself still navigates to the calculators page, so the
 * menu is a shortcut, never a dead end.
 */
export function CalculatorsMenu() {
  const { t } = useI18n()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const active = pathname === '/calculators' || pathname.startsWith('/calculators/')

  function show() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }

  function scheduleHide() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY)
  }

  // Close on route change and on Escape.
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Three columns: borrowing, then growing and planning stacked together.
  const [borrowing, growing, planning] = CALCULATOR_CATEGORIES

  return (
    // Not positioned: the panel anchors to the top bar (the nearest positioned
    // ancestor), so it centres under the whole bar instead of under this label.
    <div
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
      onFocus={show}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) scheduleHide()
      }}
    >
      <Link
        href="/calculators"
        aria-haspopup="true"
        aria-expanded={open}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex items-center gap-1 rounded-lg px-3 py-1.5 transition-colors',
          active || open ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
          active && 'bg-white/[0.08]',
        )}
      >
        {t.nav.calculators}
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </Link>

      {/* pt-3 bridges the gap between the label and the panel so hover isn't lost crossing it. */}
      <div
        className={cn(
          'absolute left-1/2 top-full z-50 w-max -translate-x-1/2 pt-3 transition-[opacity,transform] duration-200 ease-out',
          open ? 'visible opacity-100' : 'invisible -mt-1 opacity-0',
        )}
      >
        <div className="flex w-[690px] overflow-hidden rounded-2xl border border-white/[0.08] bg-card shadow-[0_24px_60px_-16px_rgba(0,0,0,0.85)]">
          <MenuColumn t={t} groups={[borrowing]} onNavigate={() => setOpen(false)} />
          <MenuColumn t={t} groups={[growing, planning]} onNavigate={() => setOpen(false)} />

          {/* Featured column, like the "What's new" panel in the reference. */}
          <Link
            href="/compare"
            onClick={() => setOpen(false)}
            className="group flex w-[250px] shrink-0 flex-col bg-gradient-to-br from-white/[0.06] to-transparent p-5"
          >
            <p className="text-sm font-semibold text-foreground">{t.nav.menu.featuredTitle}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t.nav.menu.featuredBody}</p>
            <span className="mt-auto inline-flex items-center gap-1 pt-6 text-xs font-medium text-primary">
              {t.nav.menu.featuredCta}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  )

}

/** One column of the panel: one or more labelled category groups. */
function MenuColumn({
  t,
  groups,
  onNavigate,
}: {
  t: Dictionary
  groups: (typeof CALCULATOR_CATEGORIES)[number][]
  onNavigate: () => void
}) {
  return (
    <div className="w-[220px] shrink-0 space-y-5 border-r border-white/[0.06] p-5">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {t.categories[group.id].label}
          </p>
          <ul className="space-y-1">
            {calculatorsByCategory(group.id).map((calculator) => {
              const Icon = ICONS[calculator.icon] ?? Banknote
              const text = t.calculators[calculator.id]
              return (
                <li key={calculator.id}>
                  <Link
                    href={`/calculators/${calculator.slug}`}
                    onClick={onNavigate}
                    className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-muted text-muted-foreground transition-colors group-hover:text-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-foreground">{text.shortTitle}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
