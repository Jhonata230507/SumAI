'use client'

import { cn } from '@/lib/utils/cn'

/** A keyboard-operable segmented control: one option on, as a radio group. */
export function Segmented<V extends string>({
  label,
  value,
  options,
  onChange,
  size = 'md',
  columns,
}: {
  label: string
  value: V
  options: { value: V; label: string }[]
  onChange: (value: V) => void
  size?: 'sm' | 'md'
  /** Medium: a grid-template-columns value, when the options should not share the width equally. */
  columns?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        'rounded-full bg-muted p-0.5 font-medium',
        size === 'sm' ? 'flex text-[11px]' : 'grid p-1 text-xs',
      )}
      // Medium: one equal column per option, unless the caller sets them.
      style={size === 'md' ? { gridTemplateColumns: columns ?? `repeat(${options.length}, minmax(0, 1fr))` } : undefined}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            size === 'sm' ? 'px-2.5 py-0.5' : 'px-3 py-2',
            value === option.value ? 'bg-white text-black' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
