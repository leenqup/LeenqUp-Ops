import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

/**
 * One-time admin account setup endpoint.
 * Uses the service role key to create the admin user directly — no email sent,
 * no rate limits, no verification step.
 *
 * GET  — returns { setupNeeded: boolean } (true if no admin user exists yet)
 * POST — creates the admin user with { email, password }
 */

export async function GET() {
  if (!ADMIN_EMAIL) {
    return NextResponse.json({ error: 'ADMIN_EMAIL env var not set on this deployment.' }, { status: 500 })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY env var not set.' }, { status: 500 })
  }

  try {
    const admin = createSupabaseAdminClient()
    const { data, error } = await admin.auth.admin.listUsers()
    if (error) throw error

    const adminExists = data.users.some(u => u.email === ADMIN_EMAIL)
    return NextResponse.json({ setupNeeded: !adminExists, adminEmail: ADMIN_EMAIL })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!ADMIN_EMAIL) {
    return NextResponse.json({ error: 'ADMIN_EMAIL env var not set.' }, { status: 500 })
  }

  const { email, password } = await req.json() as { email: string; password: string }

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password are required' }, { status: 400 })
  }

  if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json(
      { error: `Setup is only available for the designated admin email (${ADMIN_EMAIL}).` },
      { status: 403 },
    )
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  try {
    const admin = createSupabaseAdminClient()

    // Check if already exists
    const { data: existing } = await admin.auth.admin.listUsers()
    if (existing.users.some(u => u.email === email)) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Go back and sign in.' },
        { status: 409 },
      )
    }

    // Create admin user — email_confirm: true skips verification entirely
    const { error } = await admin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { role: 'admin', name: 'Admin' },
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create account'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
