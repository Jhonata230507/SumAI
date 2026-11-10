import { cn } from '@/lib/utils/cn'

export interface ChartLegendItem {
  color: string
  label: string
  /** Where the series ends up, shown after the label. */
  value?: string
}

/** A chart's key: small rounded squares, in the chart's header rather than under it. */
export function ChartLegend({ items, className }: { items: ChartLegendItem[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap gap-x-5 gap-y-1 text-xs', className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: item.color }} />
          <span className="text-muted-foreground">{item.label}</span>
          {item.value && <span className="font-medium tabular-nums text-foreground">{item.value}</span>}
        </li>
      ))}
    </ul>
  )
}
