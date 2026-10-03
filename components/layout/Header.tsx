'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { ButtonLink } from '@/components/ui/button'
import { CountrySelector } from '@/components/common/CountrySelector'
import { cn } from '@/lib/utils/cn'
import { useI18n } from '@/lib/i18n/client'
import { MobileNav } from './MobileNav'
import { CalculatorsMenu } from './CalculatorsMenu'
import type { CountryCode } from '@/types/country'

export interface HeaderProps {
  countryCode: CountryCode
  signedIn?: boolean
}

/**
 * Floating top bar: a rounded, blurred panel inset from the page edges. Once
 * the page scrolls, it firms up — more opaque, a visible border and a shadow —
 * so it stays legible over content passing underneath.
 */
export function Header({ countryCode, signedIn = false }: HeaderProps) {
  const { t } = useI18n()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const nav = [
    { href: '/products', label: t.nav.compareRates },
    { href: '/how-it-works', label: t.nav.howItWorks },
  ]

  return (
    <header className="sticky top-3 z-40 px-3 sm:top-4 sm:px-4">
      <div
        className={cn(
          'relative mx-auto flex h-14 max-w-6xl items-center gap-6 rounded-2xl border pl-4 pr-2 backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300',
          scrolled
            ? 'border-white/10 bg-card/80 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]'
            : 'border-white/[0.06] bg-card/40',
        )}
      >
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Image src="/logos/sumai-mark.png" alt="" width={19} height={28} priority className="h-7 w-auto" />
          <span>SumAI</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex">
          <CalculatorsMenu />
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-lg px-3 py-1.5 transition-colors',
                  active
                    ? 'bg-white/[0.08] text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <CountrySelector value={countryCode} />
          </div>

          <ButtonLink variant={signedIn ? 'outline' : 'default'} size="sm" href="/dashboard" className="h-9 px-4">
            {signedIn ? t.nav.dashboard : t.common.signIn}
          </ButtonLink>

          <MobileNav countryCode={countryCode} />
        </div>
      </div>
    </header>
  )
}
