import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

// Paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password', '/auth/callback', '/setup', '/api/auth/setup']

// Paths restricted to admin only (redirect others to /)
const ADMIN_ONLY_PATHS = ['/team', '/settings']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public auth paths through without session check
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Create a response to attach updated session cookies to
  let response = NextResponse.next({
    request: { headers: req.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            response = NextResponse.next({ request: { headers: req.headers } })
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  // Refresh session if needed (keeps token alive without user action)
  const { data: { user } } = await supabase.auth.getUser()

  // Not authenticated → redirect to login, preserving the intended destination
  if (!user) {
    const loginUrl = new URL('/login', req.url)
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirectTo', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated but on /login → redirect to home
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Role-based hard blocks
  const role = (user.user_metadata?.role as string) ?? 'viewer'

  if (ADMIN_ONLY_PATHS.some(p => pathname.startsWith(p)) && role !== 'admin') {
    return NextResponse.redirect(new URL('/?blocked=1', req.url))
  }

  return response
}

export const config = {
  // Run on all routes except static assets and API routes that don't need auth
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)',
  ],
}
