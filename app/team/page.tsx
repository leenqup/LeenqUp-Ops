'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Eye,
  Edit3,
  Trash2,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Link as LinkIcon,
  Crown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import { getSettings } from '@/lib/storage'
import type { TeamMember, TeamRole } from '@/types'

// ── Role config ───────────────────────────────────────────────

const roleConfig: Record<TeamRole, { label: string; color: string; icon: React.ElementType; description: string }> = {
  admin:  { label: 'Admin',  color: 'bg-coral/10 text-coral border-coral/30',              icon: Crown,   description: 'Full access — invite members, change roles, manage settings' },
  editor: { label: 'Editor', color: 'bg-blue-50 text-blue-700 border-blue-200',            icon: Edit3,   description: 'Create and edit all content — no settings or team management' },
  viewer: { label: 'Viewer', color: 'bg-slate-100 text-slate-600 border-slate-200',        icon: Eye,     description: 'Read-only access across the entire app' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  invited: { label: 'Invited',  color: 'bg-amber-50 text-amber-700' },
  active:  { label: 'Active',   color: 'bg-brand-green/10 text-brand-green' },
  revoked: { label: 'Revoked',  color: 'bg-red-50 text-red-600' },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Component ─────────────────────────────────────────────────

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamRole>('editor')
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ acceptUrl: string; emailSent: boolean } | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const settings = getSettings()
  const currentRole = settings.teamMemberRole ?? 'admin'
  const isAdmin = currentRole === 'admin'

  const loadMembers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/team/invite')
      const data = await res.json()
      setMembers((data.members ?? []).filter((m: TeamMember) => m.status !== 'revoked'))
    } catch {
      // Show empty state if Supabase not reachable
    }
    setLoading(false)
  }

  useEffect(() => { loadMembers() }, [])

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteName.trim()) return
    setInviting(true)
    try {
      const s = getSettings()
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(s.brevoApiKey ? { 'x-brevo-key': s.brevoApiKey } : {}),
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim(),
          role: inviteRole,
          invitedByEmail: s.teamMemberEmail ?? 'admin@leenqup.com',
          inviteBaseUrl: window.location.origin,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setInviteResult({ acceptUrl: data.acceptUrl, emailSent: data.emailSent })
        await loadMembers()
        toast(`Invitation sent to ${inviteEmail}`)
      } else {
        toast(data.error ?? 'Failed to send invite')
      }
    } catch {
      toast('Network error — could not send invite')
    }
    setInviting(false)
  }

  const handleRoleChange = async (memberId: string, newRole: TeamRole) => {
    try {
      await fetch('/api/team/accept', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role: newRole }),
      })
      await loadMembers()
      toast('Role updated')
    } catch {
      toast('Failed to update role')
    }
  }

  const handleRevoke = async (memberId: string, name: string) => {
    if (!confirm(`Revoke access for ${name}?`)) return
    try {
      await fetch('/api/team/accept', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, status: 'revoked' }),
      })
      await loadMembers()
      toast(`${name}'s access has been revoked`)
    } catch {
      toast('Failed to revoke access')
    }
  }

  const handleMarkActive = async (memberId: string, name: string) => {
    try {
      await fetch('/api/team/accept', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, status: 'active' }),
      })
      await loadMembers()
      toast(`${name} marked as active`)
    } catch {
      toast('Failed to update status')
    }
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/team/accept?token=${token}`
    navigator.clipboard.writeText(url)
    toast('Invite link copied')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
            <Users className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy dark:text-white">Team</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {members.length} member{members.length !== 1 ? 's' : ''} · You are <span className="font-medium capitalize">{currentRole}</span>
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => { setShowInviteDialog(true); setInviteResult(null) }} className="bg-coral hover:bg-coral/90 text-white gap-2">
            <UserPlus className="h-4 w-4" />
            Invite member
          </Button>
        )}
      </div>

      {/* Your identity card */}
      {settings.teamMemberEmail && (
        <Card className="mb-6 border-coral/20 bg-coral/5 dark:bg-coral/10">
          <CardContent className="py-4 px-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-coral/20 flex items-center justify-center flex-shrink-0">
                <span className="text-coral font-bold text-sm">
                  {(settings.teamMemberName ?? settings.teamMemberEmail)[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-navy dark:text-white">{settings.teamMemberName ?? settings.teamMemberEmail}</p>
                <p className="text-xs text-slate-500">{settings.teamMemberEmail} · <span className="capitalize font-medium text-coral">{settings.teamMemberRole}</span></p>
              </div>
              <Badge className={`ml-auto ${roleConfig[settings.teamMemberRole ?? 'admin']?.color}`}>
                You
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roles explanation */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(Object.entries(roleConfig) as [TeamRole, typeof roleConfig[TeamRole]][]).map(([role, cfg]) => {
          const Icon = cfg.icon
          return (
            <Card key={role} className={`border ${cfg.color.includes('coral') ? 'border-coral/20' : 'border-gray-100 dark:border-navy-600'}`}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-semibold capitalize">{cfg.label}</span>
                </div>
                <p className="text-xs text-slate-400 leading-snug">{cfg.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Member list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No team members yet</p>
              <p className="text-sm text-slate-400 mt-1">Invite your team using the button above</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-navy-600">
              {members.map(m => {
                const RoleIcon = roleConfig[m.role]?.icon ?? Eye
                const stCfg = statusConfig[m.status] ?? statusConfig.invited
                return (
                  <div key={m.id} className="flex items-center gap-4 py-3">
                    {/* Avatar */}
                    <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-navy-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-slate-500 dark:text-slate-300">
                        {m.name[0]?.toUpperCase() ?? m.email[0]?.toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-navy dark:text-white">{m.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stCfg.color}`}>{stCfg.label}</span>
                      </div>
                      <p className="text-xs text-slate-400">{m.email} · Invited {timeAgo(m.invitedAt)}</p>
                      {m.status === 'invited' && (
                        <p className="text-xs text-amber-500 mt-0.5">Pending — they need to click their invite link to activate</p>
                      )}
                      {m.lastActiveAt && <p className="text-xs text-slate-400">Last active {timeAgo(m.lastActiveAt)}</p>}
                    </div>

                    {/* Role badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${roleConfig[m.role]?.color}`}>
                      <RoleIcon className="h-3 w-3" />
                      <span className="capitalize">{m.role}</span>
                    </div>

                    {/* Admin controls */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Copy invite link (invited only) */}
                        {m.status === 'invited' && (
                          <button
                            onClick={() => copyInviteLink(m.inviteToken)}
                            className="p-1.5 text-slate-400 hover:text-brand-purple transition-colors rounded-lg"
                            title="Copy invite link"
                          >
                            <LinkIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {/* Mark active (invited only) */}
                        {m.status === 'invited' && (
                          <button
                            onClick={() => handleMarkActive(m.id, m.name)}
                            className="p-1.5 text-slate-400 hover:text-brand-green transition-colors rounded-lg"
                            title="Mark as active"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {/* Role selector */}
                        <select
                          value={m.role}
                          onChange={e => handleRoleChange(m.id, e.target.value as TeamRole)}
                          className="text-xs bg-transparent border border-gray-200 dark:border-navy-500 rounded-lg px-2 py-1 text-slate-600 dark:text-slate-300 cursor-pointer"
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button
                          onClick={() => handleRevoke(m.id, m.name)}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg"
                          title="Revoke access"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={o => { setShowInviteDialog(o); if (!o) { setInviteEmail(''); setInviteName(''); setInviteResult(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a team member</DialogTitle>
            <DialogDescription>They'll receive an email with an invite link, or you can copy it manually.</DialogDescription>
          </DialogHeader>

          {!inviteResult ? (
            <div className="space-y-4 py-2">
              <div>
                <Label>Name</Label>
                <Input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Full name" className="mt-1" />
              </div>
              <div>
                <Label>Email address</Label>
                <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} type="email" placeholder="teammate@example.com" className="mt-1" />
              </div>
              <div>
                <Label>Role</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(['admin', 'editor', 'viewer'] as TeamRole[]).map(r => {
                    const Icon = roleConfig[r].icon
                    return (
                      <button
                        key={r}
                        onClick={() => setInviteRole(r)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-colors ${
                          inviteRole === r ? 'border-coral bg-coral/5 text-coral' : 'border-gray-200 dark:border-navy-500 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="capitalize">{r}</span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-1.5">{roleConfig[inviteRole].description}</p>
              </div>
            </div>
          ) : (
            <div className="py-2 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-brand-green/5 rounded-xl border border-brand-green/20">
                <CheckCircle2 className="h-5 w-5 text-brand-green flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-navy dark:text-white">Invitation created</p>
                  <p className="text-xs text-slate-500">{inviteResult.emailSent ? 'Email sent successfully' : 'Email not sent — copy the link below'}</p>
                </div>
              </div>
              <div>
                <Label>Invite link</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={inviteResult.acceptUrl} readOnly className="text-xs" />
                  <Button size="sm" variant="secondary" onClick={() => copyUrl(inviteResult!.acceptUrl)} className="flex-shrink-0 gap-1.5">
                    {copiedUrl ? <CheckCircle2 className="h-3.5 w-3.5 text-brand-green" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedUrl ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">Share this link with your teammate. It's unique to them.</p>
              </div>
            </div>
          )}

          <DialogFooter>
            {!inviteResult ? (
              <>
                <Button variant="secondary" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
                <Button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim() || !inviteName.trim()}
                  className="bg-coral hover:bg-coral/90 text-white gap-2"
                >
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {inviting ? 'Sending…' : 'Send invite'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setShowInviteDialog(false)}>Done</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
