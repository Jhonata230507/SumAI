import type { CountryConfig } from '@/types/country'
import { usaTerminology } from './terminology'
import { usaRules } from './financial-rules'

export const usa: CountryConfig = {
  code: 'us',
  name: 'United States',
  currency: 'USD',
  language: 'en',
  locale: 'en-US',
  terminology: usaTerminology,
  rules: usaRules,
}
