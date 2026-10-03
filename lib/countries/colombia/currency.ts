import { CURRENCIES } from '@/types/currency'
import type { CurrencyConfig } from '@/types/currency'

export const colombiaCurrency: CurrencyConfig = CURRENCIES.COP

/** COP is quoted without decimals; inputs are stepped in thousands. */
export const colombiaInputStep = 100_000
