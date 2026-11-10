/**
 * Shared chart tokens.
 *
 * A dashboard palette on dark panels: purple, orange and cyan, saturated enough
 * to read at a glance against the near-black chart surface. Every chart using
 * them also carries a legend or direct labels, so identity never rests on
 * colour alone. Do not add a fourth series hue without checking it against
 * these three.
 */

export const SERIES = {
  light: {
    primary: '#5b52e0', // purple — balance, principal, the main line
    secondary: '#f59e0b', // orange — interest, the cost side
    tertiary: '#0ea5c6', // cyan — contributions, growth
  },
  dark: {
    primary: '#6159e6',
    secondary: '#ffa31a',
    tertiary: '#3fcae6',
  },
} as const

export const CHART_INK = {
  light: { primary: '#0b0b0b', secondary: '#52514e', grid: '#e5e5e2', surface: '#fcfcfb' },
  dark: { primary: '#ffffff', secondary: '#9aa1ad', grid: '#2c2c2c', surface: '#1b1b1b' },
} as const

/** Recharts needs concrete values, so the palette is resolved at render time. */
export function seriesColors(mode: 'light' | 'dark' = 'dark') {
  return SERIES[mode]
}

export function chartInk(mode: 'light' | 'dark' = 'light') {
  return CHART_INK[mode]
}

/** The panel every chart sits in: the same surface and border as the other cards. */
export const CHART_PANEL = 'rounded-2xl border bg-card p-5 sm:p-6'

/** Axis and grid styling shared by every chart, kept deliberately recessive. */
export const AXIS_PROPS = {
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 11, fill: '#7d8490' },
} as const

export const GRID_PROPS = {
  strokeDasharray: '4 4',
  stroke: CHART_INK.dark.grid,
  vertical: false,
} as const

export const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.08)',
  background: '#242424',
  color: '#f4f4f4',
  fontSize: 12,
  padding: '8px 12px',
  boxShadow: '0 12px 32px -12px rgba(0,0,0,0.8)',
} as const
