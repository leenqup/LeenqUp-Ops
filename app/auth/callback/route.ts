import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server'

/**
 * Supabase Auth PKCE callback handler.
 * Supabase redirects here after:
 *   - Invite email link click  (?mode=invite)
 *   - Password reset link click (?mode=reset)
 *   - Any OAuth flow (future)
 *
 * Exchanges the one-time code for a session, bootstraps the admin role
 * for the first sign-in with the admin email, then redirects appropriately.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const mode = searchParams.get('mode') // 'reset' | 'invite' | null

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const user = data.user

      // Bootstrap admin role for the designated admin email
      if (
        user.email === process.env.ADMIN_EMAIL &&
        !user.user_metadata?.role
      ) {
        try {
          const admin = createSupabaseAdminClient()
          await admin.auth.admin.updateUserById(user.id, {
            user_metadata: {
              role: 'admin',
              name: user.user_metadata?.name ?? 'Admin',
            },
          })
        } catch {
          // Non-fatal — admin will still be logged in, role just won't be set
          console.error('Failed to bootstrap admin role')
        }
      }

      // After invite or password reset → send to set-password page
      if (mode === 'invite' || mode === 'reset') {
        return NextResponse.redirect(`${origin}/reset-password?mode=${mode}`)
      }

      // Normal sign-in callback → go home
      return NextResponse.redirect(`${origin}/`)
    }
  }

  // Exchange failed or no code — send back to login with error hint
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
