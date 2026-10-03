import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Car, HandCoins, Home, PiggyBank } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getBenchmarks } from '@/lib/countries'
import { getRequestContext } from '@/lib/i18n/server'
import { formatPercent } from '@/lib/utils/format-number'
import { Reveal } from '@/components/common/Reveal'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestContext()
  return { title: t.products.hubMetaTitle, description: t.products.hubMetaDescription }
}

export default async function ProductsPage() {
  const { country, t } = await getRequestContext()
  const benchmarks = getBenchmarks(country.code)
  const text = t.products.categories

  const categories = [
    { href: '/products/mortgages', ...text.mortgage, benchmark: benchmarks.mortgage30Year, icon: Home },
    { href: '/products/car-loans', ...text['car-loan'], benchmark: benchmarks.carLoanNew, icon: Car },
    { href: '/products/personal-loans', ...text['personal-loan'], benchmark: benchmarks.personalLoan, icon: HandCoins },
    { href: '/products/savings', ...text.savings, benchmark: benchmarks.savingsHighYield, icon: PiggyBank },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">{t.products.hubTitle}</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        {t.products.hubIntro(t.countries[country.code])}
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {categories.map((category, index) => {
          const Icon = category.icon
          return (
            <Reveal key={category.href} delay={index * 70}>
            <Link href={category.href} className="group block h-full">
              <Card className="h-full transition-colors group-hover:border-primary/40">
                <CardContent className="flex gap-4 p-6">
                  <Icon className="h-6 w-6 shrink-0 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">{category.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{category.body}</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {t.products.benchmark}{' '}
                      <span className="font-medium text-foreground">
                        {formatPercent(category.benchmark, country.locale)}
                      </span>
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 self-center text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </CardContent>
              </Card>
            </Link>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}
