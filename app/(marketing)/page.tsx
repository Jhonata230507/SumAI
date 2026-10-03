import Link from 'next/link'
import { ArrowRight, Banknote, Car, Home, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CALCULATOR_LIST } from '@/data/calculators/definitions'
import { getRequestContext } from '@/lib/i18n/server'
import { HeroShowcase } from '@/components/marketing/HeroShowcase'
import { Reveal } from '@/components/common/Reveal'

const ICONS = {
  banknote: Banknote,
  home: Home,
  car: Car,
  'trending-up': TrendingUp,
  'piggy-bank': PiggyBank,
  'trending-down': TrendingDown,
} as const

export default async function HomePage() {
  const { country, t } = await getRequestContext()

  return (
    <>
      {/* Hero — always dark, regardless of theme, like the reference design. */}
      <section className="relative overflow-hidden px-4 pb-20 pt-10 text-center sm:pt-12">
        <Reveal>
          <h1 className="mx-auto max-w-4xl text-balance text-4xl font-light tracking-tight sm:text-6xl">
            <span className="text-neutral-400">{t.home.titleLead}</span>{' '}
            <span className="font-normal text-white">{t.home.titleEmphasis}</span>
            <span className="text-neutral-400">.</span>
          </h1>
        </Reveal>
        <Reveal delay={100}>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-neutral-400 sm:text-lg">
            {t.home.subtitle}
          </p>
        </Reveal>

        <Reveal delay={200}>
          <HeroShowcase country={country} t={t} />
        </Reveal>

        <Reveal delay={300} className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-6 sm:mt-2">
          <ButtonLink
            size="lg"
            href="/calculators"
            className="px-7"
          >
            {t.home.browse}
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <Link href="/how-it-works" className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground">
            {t.nav.howItWorks}
          </Link>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CALCULATOR_LIST.map((calculator, index) => {
            const Icon = ICONS[calculator.icon as keyof typeof ICONS] ?? Banknote
            const text = t.calculators[calculator.id]

            return (
              <Reveal key={calculator.id} delay={index * 70}>
                <Link href={`/calculators/${calculator.slug}`} className="group block h-full">
                  <Card className="h-full transition-colors group-hover:border-primary/40">
                    <CardContent className="p-6">
                      <Icon className="h-6 w-6 text-primary" />
                      <p className="mt-4 font-medium">{text.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{text.tagline}</p>
                    </CardContent>
                  </Card>
                </Link>
              </Reveal>
            )
          })}
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-3">
          {t.home.principles.map((principle, index) => (
            <Reveal key={principle.title} delay={index * 90}>
              <h2 className="font-semibold">{principle.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{principle.body}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  )
}
