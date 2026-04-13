import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
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

  // Generate invite token
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

  const acceptUrl = `${inviteBaseUrl ?? ''}/team/accept?token=${token}`

  // Send invite email via Brevo if API key provided
  let emailSent = false
  if (brevoApiKey) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': brevoApiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: { email: 'noreply@leenqup.com', name: 'LeenqUp Ops' },
          to: [{ email, name }],
          subject: `${invitedByEmail} invited you to LeenqUp Ops`,
          htmlContent: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #1a2b4b; margin-bottom: 8px;">You've been invited to LeenqUp Ops</h2>
              <p style="color: #64748b; margin-bottom: 24px;">
                <strong>${invitedByEmail}</strong> has invited you to join LeenqUp Ops as <strong>${role}</strong>.
              </p>
              <a href="${acceptUrl}" style="display: inline-block; background: #E5573D; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 24px;">
                Accept Invitation
              </a>
              <p style="color: #94a3b8; font-size: 12px;">
                Or copy this link: ${acceptUrl}
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">
                This link is specific to you. Do not share it.
              </p>
            </div>
          `,
        }),
      })
      emailSent = res.ok
    } catch {
      // Email failure is non-fatal — invite link still works
    }
  }

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
