import type { Metadata } from 'next'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getRequestContext } from '@/lib/i18n/server'
import { Reveal } from '@/components/common/Reveal'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestContext()
  return { title: t.pricing.metaTitle, description: t.pricing.metaDescription }
}

// Placeholder tiers — confirm pricing and limits before launch.
export default async function PricingPage() {
  const { t } = await getRequestContext()

  const tiers = [
    { ...t.pricing.tiers.free, highlight: false },
    { ...t.pricing.tiers.plus, highlight: true },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight">{t.pricing.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t.pricing.subtitle}</p>
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-2">
        {tiers.map((tier, index) => (
          <Reveal key={tier.name} delay={index * 100}>
          <Card className={tier.highlight ? 'border-primary shadow-md' : undefined}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>{tier.name}</CardTitle>
                {tier.highlight && <Badge>{t.pricing.mostFlexible}</Badge>}
              </div>
              <p className="mt-2">
                <span className="text-4xl font-semibold">{tier.price}</span>
                <span className="ml-1 text-sm text-muted-foreground">{tier.cadence}</span>
              </p>
              <p className="text-sm text-muted-foreground">{tier.description}</p>
            </CardHeader>

            <CardContent className="space-y-6">
              <ul className="space-y-2.5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button className="w-full" variant={tier.highlight ? 'default' : 'outline'}>
                {tier.cta}
              </Button>
            </CardContent>
          </Card>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
