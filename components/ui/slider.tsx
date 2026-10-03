'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number
  onChange: (value: number) => void
}

/**
 * Range input paired with the numeric fields in calculator forms. Dragging is
 * how people explore a range; typing is how they enter a known figure. Both
 * write to the same state.
 */
export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onChange, ...props }, ref) => (
    <input
      ref={ref}
      type="range"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className={cn(
        'h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
      {...props}
    />
  ),
)
Slider.displayName = 'Slider'
