'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { CALCULATOR_LIST } from '@/data/calculators/definitions'
import { useI18n } from '@/lib/i18n/client'

/**
 * Footer, after a "brand sign-off" reference: link columns on the left, the
 * logo and tagline on the right, then a soft glow rising from the bottom edge
 * with a pill call to action floating over a giant, cropped "SumAI".
 */
export function Footer() {
  const { t } = useI18n()

  const productLinks = [
    { href: '/products/mortgages', label: t.footer.mortgages },
    { href: '/products/car-loans', label: t.footer.carLoans },
    { href: '/products/personal-loans', label: t.footer.personalLoans },
    { href: '/products/savings', label: t.footer.savingsAccounts },
  ]

  const companyLinks = [
    { href: '/about', label: t.footer.about },
    { href: '/how-it-works', label: t.nav.howItWorks },
    { href: '/pricing', label: t.nav.pricing },
  ]

  return (
    <footer className="relative mt-24 overflow-hidden">
      {/* Links and brand. */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-4 pt-16 sm:px-6 lg:grid-cols-[1fr_1fr_1fr_1.2fr] lg:px-8">
        <FooterColumn title={t.footer.calculators}>
          {CALCULATOR_LIST.map((calculator) => (
            <FooterLink key={calculator.id} href={`/calculators/${calculator.slug}`}>
              {t.calculators[calculator.id].shortTitle}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title={t.footer.compare}>
          {productLinks.map((link) => (
            <FooterLink key={link.href} href={link.href}>
              {link.label}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title={t.footer.company}>
          {companyLinks.map((link) => (
            <FooterLink key={link.href} href={link.href}>
              {link.label}
            </FooterLink>
          ))}
        </FooterColumn>

        <div className="order-first col-span-2 lg:order-none lg:col-span-1 lg:text-right">
          <p className="flex items-center gap-2 text-xl font-semibold tracking-tight lg:justify-end">
            <Image
              src="/logos/sumai-mark.png"
              alt=""
              width={16}
              height={24}
              className="h-6 w-auto brightness-0 invert"
            />
            SumAI
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground lg:ml-auto lg:max-w-[16rem]">
            {t.footer.tagline}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-12 text-center text-xs leading-relaxed text-muted-foreground/80 sm:px-6 lg:px-8">
        <p className="mx-auto max-w-3xl">{t.footer.disclaimer}</p>
        <p className="mt-3">© {new Date().getFullYear()} SumAI</p>
      </div>

      {/* Sign-off: a glow from the bottom, the CTA pill, and the cropped wordmark. */}
      <div className="relative mt-10 h-56 sm:h-72">
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-full bg-[radial-gradient(70%_100%_at_50%_100%,rgba(255,255,255,0.14),rgba(255,255,255,0.04)_45%,transparent_75%)]"
        />
        <p
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-[0.22em] select-none text-center text-[clamp(6rem,22vw,18rem)] font-bold leading-none tracking-tighter text-white/[0.07]"
        >
          SumAI
        </p>

        <div className="absolute inset-x-0 top-6 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-[#1f1f1f]/80 p-1.5 pl-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur-md">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
              <Image src="/logos/sumai-mark.png" alt="" width={12} height={18} className="h-4 w-auto brightness-0 invert" />
            </span>
            <p className="hidden text-sm font-medium sm:block">{t.footer.ctaLine}</p>
            <Link
              href="/calculators"
              className="group inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-white/85"
            >
              {t.footer.ctaButton}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <ul className="mt-4 space-y-3">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
        {children}
      </Link>
    </li>
  )
}
