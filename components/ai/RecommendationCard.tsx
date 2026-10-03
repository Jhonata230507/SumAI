'use client'

import { Lightbulb } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { useI18n } from '@/lib/i18n/client'

export interface RecommendationCardProps {
  title: string
  body: string
  /** What acting on this is worth, already formatted. */
  impact?: string
  confidence?: 'high' | 'medium' | 'low'
  action?: React.ReactNode
  className?: string
}

/**
 * A single suggestion drawn from the user's own figures.
 *
 * Confidence is shown rather than implied: these come from a model reading a
 * calculation, and a reader deserves to know how firm the ground is.
 */
export function RecommendationCard({
  title,
  body,
  impact,
  confidence = 'medium',
  action,
  className,
}: RecommendationCardProps) {
  const { t } = useI18n()

  return (
    <Card className={cn('border-primary/20', className)}>
      <CardContent className="flex gap-4 p-5">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{title}</p>
            <Badge variant={confidence === 'high' ? 'success' : 'secondary'}>
              {t.ai.confidence[confidence]}
            </Badge>
          </div>

          <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>

          {impact && (
            <p className="mt-2 text-sm font-medium tabular-nums text-emerald-400">{impact}</p>
          )}

          {action && <div className="mt-3">{action}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
