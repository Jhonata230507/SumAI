import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard', '/scenarios', '/goals', '/profile']
const SUPPORTED_COUNTRIES = new Set(['co', 'us', 'ca'])

/**
 * Runs on every page request:
 *  1. Resolves a country once, from the geo header, and pins it in a cookie.
 *  2. Refreshes the Supabase session so Server Components see a valid user.
 *  3. Sends signed-out visitors away from the logged-in area.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  if (!request.cookies.get('country')) {
    const geo = request.headers.get('x-vercel-ip-country')?.toLowerCase() ?? ''
    const country = SUPPORTED_COUNTRIES.has(geo) ? geo : 'us'
    response.cookies.set('country', country, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  // Without Supabase configured, the public site still works; the app area does not.
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  )

  if (isProtected && !user) {
    const redirect = request.nextUrl.clone()
    redirect.pathname = '/'
    redirect.searchParams.set('signin', '1')
    redirect.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(redirect)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
