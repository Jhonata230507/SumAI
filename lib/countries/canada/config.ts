import type { CountryConfig } from '@/types/country'
import { canadaTerminology } from './terminology'
import { canadaRules } from './financial-rules'

export const canada: CountryConfig = {
  code: 'ca',
  name: 'Canada',
  currency: 'CAD',
  language: 'en',
  locale: 'en-CA',
  terminology: canadaTerminology,
  rules: canadaRules,
}
