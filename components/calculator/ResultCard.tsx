import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

export interface ResultCardProps {
  label: string
  value: string
  /** Secondary line: what the figure assumes, or what it adds up to. */
  detail?: string
  hint?: string
  /** `primary` is the headline answer; only one per calculator. */
  emphasis?: 'primary' | 'default' | 'muted'
  icon?: ReactNode
  className?: string
}

/**
 * Splits "$2,690.33" into "$2,690" and ".33" so the cents can be dimmed, the
 * way the reference renders balances. Only a trailing two-digit group counts as
 * cents, so a grouped COP amount like "$ 15.205.320" is left whole.
 */
function splitCents(value: string): [string, string] {
  const match = value.match(/^(.*?)([.,]\d{2})$/)
  return match ? [match[1], match[2]] : [value, '']
}

export function ResultCard({
  label,
  value,
  detail,
  hint,
  emphasis = 'default',
  icon,
  className,
}: ResultCardProps) {
  const [whole, cents] = splitCents(value)

  return (
    <Card className={cn(emphasis === 'muted' && 'bg-muted', className)}>
      <CardContent className={emphasis === 'primary' ? 'p-6' : 'p-5'}>
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-muted-foreground">{label}</p>
          {hint && (
            <Tooltip content={hint}>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </Tooltip>
          )}
          {icon && <span className="ml-auto text-muted-foreground">{icon}</span>}
        </div>

        <p
          className={cn(
            'mt-1 tabular-nums tracking-tight',
            emphasis === 'primary' ? 'text-5xl font-light' : 'text-2xl font-normal',
          )}
        >
          {whole}
          {cents && <span className="text-muted-foreground">{cents}</span>}
        </p>

        {detail && <p className="mt-1.5 text-xs text-muted-foreground">{detail}</p>}
      </CardContent>
    </Card>
  )
}
