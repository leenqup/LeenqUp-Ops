import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import type { TeamMember, TeamRole } from '@/types'

const TEAM_KEY = 'leenqup_team_members'

async function getTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('kv_store')
    .select('value')
    .eq('key', TEAM_KEY)
    .single()
  if (error || !data) return []
  return (data.value as TeamMember[]) ?? []
}

async function saveTeamMembers(members: TeamMember[]): Promise<void> {
  await supabase
    .from('kv_store')
    .upsert({ key: TEAM_KEY, value: members }, { onConflict: 'key' })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, name, role, invitedByEmail, inviteBaseUrl } = body as {
    email: string
    name: string
    role: TeamRole
    invitedByEmail: string
    inviteBaseUrl: string  // e.g. https://ops.leenqup.com
  }
  const brevoApiKey = req.headers.get('x-brevo-key')

  if (!email || !name || !role || !invitedByEmail) {
    return NextResponse.json({ error: 'email, name, role, and invitedByEmail are required' }, { status: 400 })
  }
  if (!['admin', 'editor', 'viewer'].includes(role)) {
    return NextResponse.json({ error: 'role must be admin, editor, or viewer' }, { status: 400 })
  }

  // Check for existing invite
  const members = await getTeamMembers()
  if (members.find(m => m.email === email && m.status !== 'revoked')) {
    return NextResponse.json({ error: `${email} already has an active invite or account` }, { status: 409 })
  }

  const token = Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  const member: TeamMember = {
    id: `tm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    email,
    name,
    role,
    status: 'invited',
    inviteToken: token,
    invitedAt: new Date().toISOString(),
    invitedByEmail,
  }

  members.push(member)
  await saveTeamMembers(members)

  // Send invite via Supabase Auth (handles email automatically)
  // The invite link routes through /auth/callback?mode=invite → /reset-password
  let emailSent = false
  try {
    const adminClient = createSupabaseAdminClient()
    const callbackUrl = `${inviteBaseUrl ?? ''}/auth/callback?mode=invite`
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: callbackUrl,
      data: { role, name },
    })
    emailSent = !inviteError
    if (inviteError) {
      console.error('Supabase invite error:', inviteError.message)
    }
  } catch (err) {
    // Invite email failure is non-fatal — link still stored in kv_store
    console.error('Invite send failed:', err)
  }

  const acceptUrl = `${inviteBaseUrl ?? ''}/team/accept?token=${token}`

  return NextResponse.json({
    success: true,
    memberId: member.id,
    inviteToken: token,
    acceptUrl,
    emailSent,
  })
}

export async function GET() {
  const members = await getTeamMembers()
  return NextResponse.json({ members })
}
