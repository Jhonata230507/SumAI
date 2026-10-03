import 'server-only'

import { cookies } from 'next/headers'
import { resolveCountry } from '@/lib/countries'
import { getDictionary } from './index'

/**
 * Everything a server page needs to render in the visitor's language:
 * the country (currency, rules), its language, and the dictionary.
 */
export async function getRequestContext() {
  const country = resolveCountry((await cookies()).get('country')?.value)
  return { country, language: country.language, t: getDictionary(country.language) }
}
