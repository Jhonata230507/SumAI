'use client'

import { useEffect, useId, useRef, useState, useTransition, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown } from 'lucide-react'
import { COUNTRY_LIST } from '@/lib/countries'
import { useI18n } from '@/lib/i18n/client'
import { cn } from '@/lib/utils/cn'
import { Flag } from './Flag'
import type { CountryCode } from '@/types/country'

export interface CountrySelectorProps {
  value: CountryCode
  onChange?: (code: CountryCode) => void
  className?: string
  /** Stretch to the container width (mobile menu) instead of fitting the content. */
  fullWidth?: boolean
}

/**
 * Compact market picker: flag plus currency code (COP, USD, CAD).
 *
 * A custom listbox rather than a native <select>, because native options
 * cannot show images. Keyboard support follows the listbox pattern: arrows to
 * move, Enter or Space to choose, Escape to close. Each option still carries
 * the full country name for screen readers.
 *
 * Switching country changes currency, lending rules and the interface language
 * (Colombia is Spanish), so the choice is saved in a cookie and the route is
 * refreshed to re-render every server component.
 */
export function CountrySelector({ value, onChange, className, fullWidth = false }: CountrySelectorProps) {
  const router = useRouter()
  const { t } = useI18n()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listboxId = useId()

  const current = COUNTRY_LIST.find((c) => c.code === value) ?? COUNTRY_LIST[0]

  // Close when clicking anywhere else.
  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  function choose(code: CountryCode) {
    setOpen(false)
    buttonRef.current?.focus()
    if (code === value) return
    document.cookie = `country=${code}; path=/; max-age=31536000; samesite=lax`
    onChange?.(code)
    startTransition(() => router.refresh())
  }

  function openMenu() {
    setHighlighted(Math.max(0, COUNTRY_LIST.findIndex((c) => c.code === value)))
    setOpen(true)
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault()
        openMenu()
      }
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlighted((i) => (i + 1) % COUNTRY_LIST.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted((i) => (i - 1 + COUNTRY_LIST.length) % COUNTRY_LIST.length)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      choose(COUNTRY_LIST[highlighted].code)
    } else if (event.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', fullWidth && 'w-full', className)}>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-label={t.countries.label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={pending}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={cn(
          'flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-muted pl-2.5 pr-2 text-sm font-medium transition-colors',
          'hover:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:opacity-60',
          fullWidth && 'w-full',
        )}
      >
        <Flag code={current.code} />
        <span className="tabular-nums">{current.currency}</span>
        <span className="sr-only">{t.countries[current.code]}</span>
        <ChevronDown
          aria-hidden
          className={cn('ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t.countries.label}
          className={cn(
            'absolute right-0 top-full z-50 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-white/[0.08] bg-card p-1 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)]',
            fullWidth && 'left-0',
          )}
        >
          {COUNTRY_LIST.map((country, index) => {
            const selected = country.code === value
            return (
              <li
                key={country.code}
                role="option"
                aria-selected={selected}
                aria-label={`${t.countries[country.code]} (${country.currency})`}
                onPointerEnter={() => setHighlighted(index)}
                onClick={() => choose(country.code)}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm',
                  index === highlighted ? 'bg-white/[0.06] text-foreground' : 'text-muted-foreground',
                )}
              >
                <Flag code={country.code} />
                <span className="font-medium tabular-nums">{country.currency}</span>
                {selected && <Check className="ml-auto h-3.5 w-3.5 text-primary" aria-hidden />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
