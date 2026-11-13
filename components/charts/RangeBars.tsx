import { formatPercent } from '@/lib/utils/format-number'
import { cn } from '@/lib/utils/cn'

const BAR_TONE = {
  weaker: 'from-white/[0.05] to-white/[0.16]',
  expected: 'from-[#2a6fd0] to-[#5ea4f2]',
  stronger: 'from-[#147a5b]/70 to-[#4fd1a2]/80',
} as const

/**
 * The three outcomes as bars on a shared baseline, sized to their value, with
 * faint guide lines. The expected outcome leads (blue); the weaker and stronger
 * ones show how far they sit from it.
 */
export function RangeBars({
  items,
  format,
  locale,
}: {
  items: { key: keyof typeof BAR_TONE; label: string; value: number }[]
  format: (value: number) => string
  locale: string
}) {
  const peak = Math.max(...items.map((item) => item.value), 1)
  const expected = items.find((item) => item.key === 'expected')?.value ?? peak
  const delta = (value: number) => {
    const change = value / expected - 1
    return `${change > 0 ? '+' : '−'}${formatPercent(Math.abs(change), locale, 0)}`
  }

  return (
    <dl className="mt-3 flex min-h-24 flex-1 flex-col">
      {/* Bars on a shared baseline, with faint guides at a third and two thirds. */}
      <div className="relative flex flex-1 items-end gap-4 border-b border-white/[0.12] px-2">
        <span aria-hidden className="absolute inset-x-0 top-1/3 border-t border-dashed border-white/[0.05]" />
        <span aria-hidden className="absolute inset-x-0 top-2/3 border-t border-dashed border-white/[0.05]" />
        {items.map((item) => {
          const strong = item.key === 'expected'
          return (
            <div key={item.key} className="relative flex h-full flex-1 flex-col items-center justify-end">
              <dd
                className={cn(
                  'mb-2 tabular-nums',
                  strong ? 'text-lg font-semibold text-foreground' : 'text-sm font-medium text-foreground/75',
                )}
              >
                {format(item.value)}
              </dd>
              <div
                aria-hidden
                className={cn(
                  'w-full max-w-28 rounded-t-xl bg-gradient-to-t shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-[height] duration-500',
                  BAR_TONE[item.key],
                )}
                style={{ height: `${Math.max(0.06, Math.min(1, item.value / peak)) * 80}%` }}
              />
            </div>
          )
        })}
      </div>
      {/* Labels, with how far each outcome sits from the expected one. */}
      <div className="mt-2.5 flex gap-4 px-2">
        {items.map((item) => (
          <dt key={item.key} className="flex flex-1 flex-col items-center text-center">
            <span
              className={cn(
                'text-xs',
                item.key === 'expected' ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {item.label}
            </span>
            {item.key !== 'expected' && (
              <span
                className={cn(
                  'mt-0.5 text-[11px] tabular-nums',
                  item.value < expected ? 'text-muted-foreground/70' : 'text-emerald-400/80',
                )}
              >
                {delta(item.value)}
              </span>
            )}
          </dt>
        ))}
      </div>
    </dl>
  )
}
