'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { CALCULATOR_LIST } from '@/data/calculators/definitions'
import { useI18n } from '@/lib/i18n/client'

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
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="flex items-center gap-2 font-semibold tracking-tight">
            <Image src="/logos/sumai-mark.png" alt="" width={16} height={24} className="h-6 w-auto" />
            SumAI
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{t.footer.tagline}</p>
        </div>

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
      </div>

      <div className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs leading-relaxed text-muted-foreground">
          <p>{t.footer.disclaimer}</p>
          <p className="mt-3">© {new Date().getFullYear()} SumAI</p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-muted-foreground hover:text-foreground">
        {children}
      </Link>
    </li>
  )
}
