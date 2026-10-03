import type { CountryConfig } from '@/types/country'
import { colombiaTerminology } from './terminology'
import { colombiaRules } from './financial-rules'

export const colombia: CountryConfig = {
  code: 'co',
  name: 'Colombia',
  currency: 'COP',
  language: 'es',
  locale: 'es-CO',
  terminology: colombiaTerminology,
  rules: colombiaRules,
}
