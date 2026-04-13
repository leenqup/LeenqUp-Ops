import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { TeamMember } from '@/types'

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

/** GET /api/team/accept?token=... — validate a token and return the member details */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token is required' }, { status: 400 })

  const members = await getTeamMembers()
  const member = members.find(m => m.inviteToken === token)

  if (!member) return NextResponse.json({ error: 'Invalid or expired invite token' }, { status: 404 })
  if (member.status === 'revoked') return NextResponse.json({ error: 'This invitation has been revoked' }, { status: 403 })

  return NextResponse.json({ valid: true, member: { id: member.id, email: member.email, name: member.name, role: member.role } })
}

/** POST /api/team/accept — accept an invite (marks as active) */
export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'token is required' }, { status: 400 })

  const members = await getTeamMembers()
  const idx = members.findIndex(m => m.inviteToken === token)
  if (idx === -1) return NextResponse.json({ error: 'Invalid or expired invite token' }, { status: 404 })
  if (members[idx].status === 'revoked') return NextResponse.json({ error: 'This invitation has been revoked' }, { status: 403 })

  members[idx] = {
    ...members[idx],
    status: 'active',
    acceptedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  }
  await saveTeamMembers(members)

  return NextResponse.json({
    success: true,
    member: {
      id: members[idx].id,
      email: members[idx].email,
      name: members[idx].name,
      role: members[idx].role,
    },
  })
}

/** PATCH /api/team/accept — update role or revoke */
export async function PATCH(req: NextRequest) {
  const { memberId, role, status } = await req.json()
  if (!memberId) return NextResponse.json({ error: 'memberId is required' }, { status: 400 })

  const members = await getTeamMembers()
  const idx = members.findIndex(m => m.id === memberId)
  if (idx === -1) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  if (role) members[idx] = { ...members[idx], role }
  if (status) members[idx] = { ...members[idx], status }

  await saveTeamMembers(members)
  return NextResponse.json({ success: true, member: members[idx] })
}
