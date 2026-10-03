/**
 * Shared chart tokens.
 *
 * The three series hues are a validated categorical set: every pair clears the
 * colour-vision and normal-vision separation floors in both light and dark mode.
 * Do not add a fourth series hue without re-validating the set — and note that
 * aqua sits below 3:1 against the light surface, so every chart using it must
 * also carry a legend or direct labels rather than relying on colour alone.
 */

export const SERIES = {
  light: {
    primary: '#2a78d6', // blue — balance, principal, the main line
    secondary: '#eb6834', // orange — interest, the cost side
    tertiary: '#1baf7a', // aqua — contributions, growth
  },
  dark: {
    primary: '#3987e5',
    secondary: '#d95926',
    tertiary: '#199e70',
  },
} as const

export const CHART_INK = {
  light: { primary: '#0b0b0b', secondary: '#52514e', grid: '#e5e5e2', surface: '#fcfcfb' },
  dark: { primary: '#ffffff', secondary: '#c3c2b7', grid: '#2b2b38', surface: '#16161e' },
} as const

/** Recharts needs concrete values, so the palette is resolved at render time. */
export function seriesColors(mode: 'light' | 'dark' = 'dark') {
  return SERIES[mode]
}

export function chartInk(mode: 'light' | 'dark' = 'light') {
  return CHART_INK[mode]
}

/** Axis and grid styling shared by every chart, kept deliberately recessive. */
export const AXIS_PROPS = {
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 12, fill: '#8d8d8d' },
} as const

export const GRID_PROPS = {
  strokeDasharray: '3 3',
  stroke: CHART_INK.dark.grid,
  vertical: false,
} as const

export const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: '1px solid #2b2b38',
  background: '#282834',
  color: '#f4f4f4',
  fontSize: 12,
  padding: '8px 12px',
} as const
