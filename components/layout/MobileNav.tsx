'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { CountrySelector } from '@/components/common/CountrySelector'
import { CALCULATOR_LIST } from '@/data/calculators/definitions'
import { useI18n } from '@/lib/i18n/client'
import type { CountryCode } from '@/types/country'

export function MobileNav({ countryCode }: { countryCode: CountryCode }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  const secondary = [
    { href: '/products', label: t.nav.compareRates },
    { href: '/how-it-works', label: t.nav.howItWorks },
    { href: '/dashboard', label: t.nav.dashboard },
  ]

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-2 hover:bg-accent"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full mt-2 rounded-2xl border border-white/10 bg-card p-4 shadow-2xl">
          <CountrySelector value={countryCode} fullWidth className="mb-4" />

          <p className="px-1 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t.nav.calculators}
          </p>
          <div className="grid gap-1">
            {CALCULATOR_LIST.map((calculator) => (
              <Link
                key={calculator.id}
                href={`/calculators/${calculator.slug}`}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm hover:bg-accent"
              >
                {t.calculators[calculator.id].shortTitle}
              </Link>
            ))}
          </div>

          <div className="mt-4 grid gap-1 border-t pt-4">
            {secondary.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm hover:bg-accent"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
