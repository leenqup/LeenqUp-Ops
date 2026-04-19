'use client'

import { useState, useEffect } from 'react'
import { Plus, ChevronDown, ChevronUp, Copy, Pencil, CheckCircle2, Circle, X, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toaster'
import { getCampaigns, upsertCampaign, getPosts, initializeStorage } from '@/lib/storage'
import { generateId } from '@/lib/utils'
import type { Campaign, CampaignPhase, CampaignStatus, Post } from '@/types'

// ── helpers ──────────────────────────────────────────────────────────────────

function phaseBadgeVariant(phase: CampaignPhase) {
  if (phase === 'pre-launch') return 'warning' as const
  if (phase === 'launch-day') return 'default' as const
  return 'success' as const
}

function phaseLabel(phase: CampaignPhase) {
  if (phase === 'pre-launch') return 'Pre-Launch'
  if (phase === 'launch-day') return 'Launch Day'
  return 'Post-Launch 30'
}

function statusBadgeVariant(status: CampaignStatus) {
  if (status === 'draft') return 'secondary' as const
  if (status === 'ready') return 'success' as const
  if (status === 'active') return 'default' as const
  return 'navy' as const
}

function statusLabel(status: CampaignStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

// ── Add Campaign Dialog ───────────────────────────────────────────────────────

interface AddDialogProps {
  open: boolean
  onClose: () => void
  onSave: (c: Campaign) => void
}

const EMPTY_FORM = {
  name: '',
  phase: 'pre-launch' as CampaignPhase,
  description: '',
  deploymentSchedule: '',
  posts: '',
  emails: '',
  whatsappBroadcast: '',
}

function AddCampaignDialog({ open, onClose, onSave }: AddDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM)

  function handleSave() {
    if (!form.name.trim()) { toast('Campaign name is required', 'error'); return }
    const now = new Date().toISOString()
    const campaign: Campaign = {
      id: generateId(),
      name: form.name.trim(),
      phase: form.phase,
      description: form.description.trim(),
      assets: {
        posts: form.posts.split(',').map(s => s.trim()).filter(Boolean),
        emails: form.emails.split(',').map(s => s.trim()).filter(Boolean),
        whatsappBroadcast: form.whatsappBroadcast.trim(),
      },
      deploymentSchedule: form.deploymentSchedule.trim(),
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    }
    onSave(campaign)
    setForm(EMPTY_FORM)
    onClose()
    toast('Campaign created', 'success')
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Campaign</DialogTitle>
          <DialogDescription>Create a new campaign bundle</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Campaign Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Launch Week Seller Push" />
          </div>
          <div className="space-y-1.5">
            <Label>Phase</Label>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral/50"
              value={form.phase}
              onChange={e => setForm(f => ({ ...f, phase: e.target.value as CampaignPhase }))}
            >
              <option value="pre-launch">Pre-Launch</option>
              <option value="launch-day">Launch Day</option>
              <option value="post-launch-30">Post-Launch 30</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Campaign objective and summary..." />
          </div>
          <div className="space-y-1.5">
            <Label>Linked Post IDs <span className="text-slate-400 font-normal">(comma-separated)</span></Label>
            <Input value={form.posts} onChange={e => setForm(f => ({ ...f, posts: e.target.value }))} placeholder="post_001, post_002" />
          </div>
          <div className="space-y-1.5">
            <Label>Linked Email Sequence IDs <span className="text-slate-400 font-normal">(comma-separated)</span></Label>
            <Input value={form.emails} onChange={e => setForm(f => ({ ...f, emails: e.target.value }))} placeholder="seq_001, seq_002" />
          </div>
          <div className="space-y-1.5">
            <Label>Broadcast Message</Label>
            <Textarea value={form.whatsappBroadcast} onChange={e => setForm(f => ({ ...f, whatsappBroadcast: e.target.value }))} rows={4} placeholder="Write the broadcast message..." />
          </div>
          <div className="space-y-1.5">
            <Label>Deployment Schedule</Label>
            <Textarea value={form.deploymentSchedule} onChange={e => setForm(f => ({ ...f, deploymentSchedule: e.target.value }))} rows={3} placeholder="Day 1: Post A at 9am, Email B at 10am..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Create Campaign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Confirm Activate Dialog ───────────────────────────────────────────────────

interface ConfirmActivateProps {
  campaign: Campaign | null
  onClose: () => void
  onConfirm: () => void
}

function ConfirmActivateDialog({ campaign, onClose, onConfirm }: ConfirmActivateProps) {
  return (
    <Dialog open={!!campaign} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Activate Campaign</DialogTitle>
          <DialogDescription>
            Marking this campaign as active will lock it from further edits.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-slate-600">
          Are you sure you want to activate <span className="font-semibold">{campaign?.name}</span>? This action cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm}>Activate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Edit Campaign Dialog ──────────────────────────────────────────────────────

interface EditDialogProps {
  campaign: Campaign | null
  onClose: () => void
  onSave: (c: Campaign) => void
}

function EditCampaignDialog({ campaign, onClose, onSave }: EditDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [deploymentSchedule, setDeploymentSchedule] = useState('')
  const [status, setStatus] = useState<CampaignStatus>('draft')

  useEffect(() => {
    if (campaign) {
      setName(campaign.name)
      setDescription(campaign.description)
      setDeploymentSchedule(campaign.deploymentSchedule)
      setStatus(campaign.status)
    }
  }, [campaign])

  function handleSave() {
    if (!campaign) return
    if (!name.trim()) { toast('Name is required', 'error'); return }
    const updated: Campaign = {
      ...campaign,
      name: name.trim(),
      description: description.trim(),
      deploymentSchedule: deploymentSchedule.trim(),
      status,
      updatedAt: new Date().toISOString(),
    }
    onSave(updated)
    onClose()
    toast('Campaign updated', 'success')
  }

  return (
    <Dialog open={!!campaign} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Campaign</DialogTitle>
          <DialogDescription>Update campaign details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Campaign Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Deployment Schedule</Label>
            <Textarea value={deploymentSchedule} onChange={e => setDeploymentSchedule(e.target.value)} rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral/50"
              value={status}
              onChange={e => setStatus(e.target.value as CampaignStatus)}
            >
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="active">Active</option>
              <option value="complete">Complete</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Mark as Posted inline form ────────────────────────────────────────────────

interface MarkPostedFormProps {
  postId: string
  onConfirm: (postId: string, url: string) => void
  onCancel: () => void
}

function MarkPostedForm({ postId, onConfirm, onCancel }: MarkPostedFormProps) {
  const [url, setUrl] = useState('')
  return (
    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 space-y-2">
      <p className="text-xs text-slate-500">Optional: paste the URL where this post was published</p>
      <Input
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="https://instagram.com/p/..."
        className="h-8 text-sm"
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => onConfirm(postId, url)}>Confirm Posted</Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Slide-Over Detail Panel ───────────────────────────────────────────────────

interface SlideOverProps {
  campaign: Campaign | null
  allPosts: Post[]
  onClose: () => void
  onEdit: (c: Campaign) => void
  onCampaignUpdate: (c: Campaign) => void
}

function SlideOver({ campaign, allPosts, onClose, onEdit, onCampaignUpdate }: SlideOverProps) {
  const [copied, setCopied] = useState(false)
  const [markingPostId, setMarkingPostId] = useState<string | null>(null)

  function copyBroadcast() {
    if (!campaign) return
    navigator.clipboard.writeText(campaign.whatsappBroadcast ?? campaign.assets.whatsappBroadcast ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast('Broadcast copied to clipboard', 'success')
  }

  function handleMarkPosted(postId: string, url: string) {
    if (!campaign) return
    const post = allPosts.find(p => p.id === postId)
    const newEntry = {
      postId,
      platform: post?.platform ?? 'unknown',
      postedAt: new Date().toISOString(),
      url: url.trim() || undefined,
    }
    const updated: Campaign = {
      ...campaign,
      executedPosts: [...(campaign.executedPosts ?? []), newEntry],
      updatedAt: new Date().toISOString(),
    }
    upsertCampaign(updated)
    onCampaignUpdate(updated)
    setMarkingPostId(null)
    toast('Post marked as deployed', 'success')
  }

  if (!campaign) return null

  const canEdit = campaign.status === 'draft' || campaign.status === 'ready'
  const executedPosts = campaign.executedPosts ?? []

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={phaseBadgeVariant(campaign.phase)}>{phaseLabel(campaign.phase)}</Badge>
              <Badge variant={statusBadgeVariant(campaign.status)}>{statusLabel(campaign.status)}</Badge>
            </div>
            <h2 className="text-xl font-bold text-navy">{campaign.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button variant="secondary" size="sm" onClick={() => onEdit(campaign)}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Description */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Description</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{campaign.description || '—'}</p>
          </section>

          {/* Posts */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Posts</h3>
            {campaign.assets.posts.length > 0 ? (
              <ul className="space-y-1">
                {campaign.assets.posts.map(id => (
                  <li key={id} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{id}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No posts linked</p>
            )}
            <p className="mt-2 text-xs text-slate-400 italic">View in Posts library</p>
          </section>

          {/* Email Sequences */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email Sequences</h3>
            {campaign.assets.emails.length > 0 ? (
              <ul className="space-y-1">
                {campaign.assets.emails.map(id => (
                  <li key={id} className="text-sm text-slate-700">
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{id}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No sequences linked</p>
            )}
          </section>

          {/* Execution Log */}
          {campaign.assets.posts.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Execution Log</h3>
              <div className="space-y-2">
                {campaign.assets.posts.map(postId => {
                  const post = allPosts.find(p => p.id === postId)
                  const executed = executedPosts.find(e => e.postId === postId)
                  const isMarkingThis = markingPostId === postId

                  return (
                    <div key={postId} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 space-y-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {post ? (
                            <p className="text-sm font-medium text-navy truncate">{post.title}</p>
                          ) : null}
                          <p className="text-xs text-slate-400 font-mono">{postId}</p>
                          {post && (
                            <p className="text-xs text-slate-400 capitalize mt-0.5">{post.platform}</p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {executed ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-green">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Posted {new Date(executed.postedAt).toLocaleDateString()}
                              </span>
                              {executed.url && (
                                <a
                                  href={executed.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 text-xs text-coral hover:underline"
                                >
                                  View post
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7 text-xs"
                              onClick={() => setMarkingPostId(isMarkingThis ? null : postId)}
                            >
                              {isMarkingThis ? 'Cancel' : 'Mark as Posted'}
                            </Button>
                          )}
                        </div>
                      </div>
                      {isMarkingThis && !executed && (
                        <MarkPostedForm
                          postId={postId}
                          onConfirm={handleMarkPosted}
                          onCancel={() => setMarkingPostId(null)}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Broadcast Message */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Broadcast Message</h3>
              {campaign.assets.whatsappBroadcast && (
                <Button variant="ghost" size="sm" onClick={copyBroadcast}>
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              )}
            </div>
            {campaign.assets.whatsappBroadcast ? (
              <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {campaign.assets.whatsappBroadcast}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Not written yet</p>
            )}
          </section>

          {/* Deployment Schedule */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Deployment Schedule</h3>
            {campaign.deploymentSchedule ? (
              <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {campaign.deploymentSchedule}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No schedule set</p>
            )}
          </section>

          {/* Metadata */}
          <section className="text-xs text-slate-400 space-y-1 border-t border-gray-100 pt-4">
            <p>Created: {new Date(campaign.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(campaign.updatedAt).toLocaleString()}</p>
            <p>ID: <span className="font-mono">{campaign.id}</span></p>
          </section>
        </div>
      </div>
    </>
  )
}

// ── Campaign Card ─────────────────────────────────────────────────────────────

interface CampaignCardProps {
  campaign: Campaign
  onViewDetails: (c: Campaign) => void
  onActivate: (c: Campaign) => void
}

function CampaignCard({ campaign, onViewDetails, onActivate }: CampaignCardProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const locked = campaign.status === 'active' || campaign.status === 'complete'
  const broadcast = campaign.whatsappBroadcast ?? campaign.assets.whatsappBroadcast ?? ''
  const hasBroadcast = !!broadcast.trim()

  const executedCount = campaign.executedPosts?.length ?? 0
  const totalPosts = campaign.assets.posts.length
  const hasExecutions = executedCount > 0

  return (
    <Card className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={phaseBadgeVariant(campaign.phase)}>{phaseLabel(campaign.phase)}</Badge>
            <Badge variant={statusBadgeVariant(campaign.status)}>{statusLabel(campaign.status)}</Badge>
            {locked && (
              <span className="text-xs text-slate-400 italic">locked</span>
            )}
          </div>
          <h3 className="text-lg font-bold text-navy leading-tight">{campaign.name}</h3>
        </div>
      </div>

      {/* Description */}
      {campaign.description && (
        <p className="text-sm text-slate-600 leading-relaxed">{campaign.description}</p>
      )}

      {/* Assets Checklist */}
      <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Assets</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            {campaign.assets.posts.length > 0
              ? <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />
              : <Circle className="h-4 w-4 text-slate-300 shrink-0" />}
            <span>
              Posts:{' '}
              {hasExecutions && totalPosts > 0 ? (
                <span className={executedCount === totalPosts ? 'font-medium text-brand-green' : 'font-medium text-amber-600'}>
                  {executedCount}/{totalPosts} deployed
                </span>
              ) : (
                <span className="font-medium">{campaign.assets.posts.length} linked</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            {campaign.assets.emails.length > 0
              ? <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />
              : <Circle className="h-4 w-4 text-slate-300 shrink-0" />}
            <span>Email sequences: <span className="font-medium">{campaign.assets.emails.length} linked</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            {hasBroadcast
              ? <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />
              : <Circle className="h-4 w-4 text-slate-300 shrink-0" />}
            <span>
              Broadcast message:{' '}
              {hasBroadcast
                ? <span className="font-medium text-brand-green">written ✓</span>
                : <span className="font-medium text-slate-400">not yet written ✗</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Deployment Schedule — collapsible */}
      <div>
        <button
          onClick={() => setScheduleOpen(v => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
        >
          {scheduleOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          Deployment Schedule
        </button>
        {scheduleOpen && (
          <div className="mt-2 rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {campaign.deploymentSchedule || <span className="text-slate-400 italic">No schedule set</span>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button variant="secondary" size="sm" onClick={() => onViewDetails(campaign)}>
          View Details
        </Button>
        <Button
          size="sm"
          disabled={locked}
          onClick={() => onActivate(campaign)}
        >
          Mark Active
        </Button>
      </div>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null)
  const [activateCandidate, setActivateCandidate] = useState<Campaign | null>(null)
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null)

  useEffect(() => {
    initializeStorage()
    setCampaigns(getCampaigns())
    setAllPosts(getPosts())
  }, [])

  function saveCampaign(c: Campaign) {
    upsertCampaign(c)
    setCampaigns(getCampaigns())
  }

  function handleActivateConfirm() {
    if (!activateCandidate) return
    const updated: Campaign = { ...activateCandidate, status: 'active', updatedAt: new Date().toISOString() }
    saveCampaign(updated)
    setActivateCandidate(null)
    // Refresh detail panel if open
    if (detailCampaign?.id === updated.id) setDetailCampaign(updated)
    toast(`"${updated.name}" is now active`, 'success')
  }

  function handleEditSave(c: Campaign) {
    saveCampaign(c)
    if (detailCampaign?.id === c.id) setDetailCampaign(c)
    setEditCampaign(null)
  }

  function handleCampaignUpdate(c: Campaign) {
    upsertCampaign(c)
    setCampaigns(getCampaigns())
    // Keep detail panel in sync
    setDetailCampaign(c)
  }

  const byPhase = (phase: CampaignPhase) => campaigns.filter(c => c.phase === phase)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Campaigns</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and deploy campaign bundles by phase</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Campaign
        </Button>
      </div>

      {/* Phase Tabs */}
      <Tabs defaultValue="pre-launch">
        <TabsList>
          <TabsTrigger value="pre-launch">
            Pre-Launch
            {byPhase('pre-launch').length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 text-xs font-medium leading-none">
                {byPhase('pre-launch').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="launch-day">
            Launch Day
            {byPhase('launch-day').length > 0 && (
              <span className="ml-1.5 rounded-full bg-coral/10 text-coral-700 px-1.5 py-0.5 text-xs font-medium leading-none">
                {byPhase('launch-day').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="post-launch-30">
            Post-Launch 30
            {byPhase('post-launch-30').length > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-green-light text-brand-green px-1.5 py-0.5 text-xs font-medium leading-none">
                {byPhase('post-launch-30').length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {(['pre-launch', 'launch-day', 'post-launch-30'] as CampaignPhase[]).map(phase => (
          <TabsContent key={phase} value={phase}>
            {byPhase(phase).length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <p className="text-sm">No campaigns in this phase yet.</p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => setAddOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Add Campaign
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {byPhase(phase).map(c => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    onViewDetails={setDetailCampaign}
                    onActivate={setActivateCandidate}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialogs */}
      <AddCampaignDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={saveCampaign}
      />

      <ConfirmActivateDialog
        campaign={activateCandidate}
        onClose={() => setActivateCandidate(null)}
        onConfirm={handleActivateConfirm}
      />

      <EditCampaignDialog
        campaign={editCampaign}
        onClose={() => setEditCampaign(null)}
        onSave={handleEditSave}
      />

      {/* Slide-Over */}
      <SlideOver
        campaign={detailCampaign}
        allPosts={allPosts}
        onClose={() => setDetailCampaign(null)}
        onEdit={c => {
          setDetailCampaign(null)
          setEditCampaign(c)
        }}
        onCampaignUpdate={handleCampaignUpdate}
      />
    </div>
  )
}
