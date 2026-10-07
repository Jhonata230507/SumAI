import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { CALCULATOR_CATEGORIES, calculatorsByCategory } from '@/data/calculators/definitions'
import { getRequestContext } from '@/lib/i18n/server'
import { Reveal } from '@/components/common/Reveal'
import { CalculatorArt } from '@/components/marketing/CalculatorArt'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestContext()
  return { title: t.calculatorIndex.metaTitle, description: t.calculatorIndex.metaDescription }
}

export default async function CalculatorsPage() {
  const { t } = await getRequestContext()

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Reveal>
        <h1 className="text-4xl font-semibold tracking-tight">{t.calculatorIndex.title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t.calculatorIndex.intro}</p>
      </Reveal>

      <div className="mt-12 space-y-12">
        {CALCULATOR_CATEGORIES.map((category) => (
          <Reveal as="section" key={category.id}>
            <h2 className="text-lg font-semibold">{t.categories[category.id].label}</h2>
            <p className="text-sm text-muted-foreground">{t.categories[category.id].description}</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {calculatorsByCategory(category.id).map((calculator) => {
                const text = t.calculators[calculator.id]
                return (
                  <Link key={calculator.id} href={`/calculators/${calculator.slug}`} className="group block h-full">
                    {/* Same card language as the home carousel: lit border and a small lift on hover. */}
                    <Card className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border-white/[0.06] transition-[border-color,transform] duration-300 group-hover:-translate-y-1 group-hover:border-white/25">
                      <CardContent className="flex flex-1 flex-col p-6">
                        <p className="text-lg font-semibold tracking-tight">{text.title}</p>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text.description}</p>

                        <CalculatorArt
                          id={calculator.id}
                          className="mt-auto w-full pt-6 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                        />

                        <span className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
                          {t.calculatorIndex.openCalculator}
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
