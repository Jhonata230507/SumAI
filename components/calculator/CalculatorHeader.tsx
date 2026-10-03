'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n/client'
import type { CalculatorDefinition } from '@/data/calculators/definitions'
import type { CountryConfig } from '@/types/country'

export interface CalculatorHeaderProps {
  calculator: CalculatorDefinition
  country: CountryConfig
}

export function CalculatorHeader({ calculator, country }: CalculatorHeaderProps) {
  const { t } = useI18n()
  const text = t.calculators[calculator.id]

  return (
    <div>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          {t.calculatorHeader.home}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/calculators" className="hover:text-foreground">
          {t.calculatorHeader.calculators}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{text.shortTitle}</span>
      </nav>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{text.title}</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">{text.description}</p>

      <p className="mt-4 text-xs text-muted-foreground">
        {t.calculatorHeader.showingFigures(
          t.countries[country.code],
          country.currency,
          country.rules.quotesEffectiveAnnualRate,
        )}
      </p>
    </div>
  )
}
