'use client'

import { useState, useEffect, useMemo } from 'react'
import { Copy, Pencil, Trash2, Plus, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toaster'
import { Breadcrumb } from '@/components/breadcrumb'
import { brandVoice } from '@/data/brand'
import { getBrandResponses, upsertBrandResponse, deleteBrandResponse } from '@/lib/storage'
import { generateId } from '@/lib/utils'
import type { BrandResponse, ResponseAudience, ResponseChannel } from '@/types'

// ── Badge maps ────────────────────────────────────────────────────────────────

function audienceVariant(a: ResponseAudience) {
  if (a === 'buyer') return 'default' as const
  if (a === 'seller') return 'navy' as const
  if (a === 'general') return 'secondary' as const
  return 'warning' as const // skeptic
}

function channelVariant(c: ResponseChannel) {
  if (c === 'social-comment') return 'purple' as const
  if (c === 'dm') return 'success' as const
  if (c === 'email') return 'navy' as const
  if (c === 'in-app') return 'default' as const
  return 'secondary' as const // any
}

function audienceLabel(a: ResponseAudience) {
  return a.charAt(0).toUpperCase() + a.slice(1)
}

function channelLabel(c: ResponseChannel) {
  const map: Record<ResponseChannel, string> = {
    'social-comment': 'Social Comment',
    'dm': 'DM',
    'email': 'Email',
    'in-app': 'In-App',
    'any': 'Any',
  }
  return map[c]
}

// ── Empty form ────────────────────────────────────────────────────────────────

type FormState = {
  trigger: string
  response: string
  audience: ResponseAudience
  channel: ResponseChannel
  tags: string
  notes: string
}

const EMPTY_FORM: FormState = {
  trigger: '',
  response: '',
  audience: 'general',
  channel: 'any',
  tags: '',
  notes: '',
}

function formFromResponse(r: BrandResponse): FormState {
  return {
    trigger: r.trigger,
    response: r.response,
    audience: r.audience,
    channel: r.channel,
    tags: r.tags.join(', '),
    notes: r.notes ?? '',
  }
}

// ── Response Form Dialog ──────────────────────────────────────────────────────

interface ResponseDialogProps {
  open: boolean
  mode: 'add' | 'edit'
  initialForm?: FormState
  onClose: () => void
  onSave: (form: FormState) => void
}

function ResponseDialog({ open, mode, initialForm, onClose, onSave }: ResponseDialogProps) {
  const [form, setForm] = useState<FormState>(initialForm ?? EMPTY_FORM)

  useEffect(() => {
    if (open) setForm(initialForm ?? EMPTY_FORM)
  }, [open, initialForm])

  function handleSave() {
    if (!form.trigger.trim()) { toast('Trigger is required', 'error'); return }
    if (!form.response.trim()) { toast('Response text is required', 'error'); return }
    onSave(form)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Response' : 'Edit Response'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Add a new brand response to the library' : 'Update this response'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Trigger Scenario</Label>
            <Input
              value={form.trigger}
              onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
              placeholder="e.g. How does buying on LeenqUp work?"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Response</Label>
            <Textarea
              value={form.response}
              onChange={e => setForm(f => ({ ...f, response: e.target.value }))}
              rows={8}
              placeholder="Write the full response here..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral/50"
                value={form.audience}
                onChange={e => setForm(f => ({ ...f, audience: e.target.value as ResponseAudience }))}
              >
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="general">General</option>
                <option value="skeptic">Skeptic</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral/50"
                value={form.channel}
                onChange={e => setForm(f => ({ ...f, channel: e.target.value as ResponseChannel }))}
              >
                <option value="any">Any</option>
                <option value="social-comment">Social Comment</option>
                <option value="dm">DM</option>
                <option value="email">Email</option>
                <option value="in-app">In-App</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tags <span className="text-slate-400 font-normal">(comma-separated)</span></Label>
            <Input
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="trust, buyer, onboarding"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes <span className="text-slate-400 font-normal">(internal, optional)</span></Label>
            <Textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Usage notes, adaptation guidance..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{mode === 'add' ? 'Add Response' : 'Save Changes'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete Confirm Dialog ─────────────────────────────────────────────────────

interface DeleteDialogProps {
  response: BrandResponse | null
  onClose: () => void
  onConfirm: () => void
}

function DeleteDialog({ response, onClose, onConfirm }: DeleteDialogProps) {
  return (
    <Dialog open={!!response} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Response</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-slate-600">
          Are you sure you want to delete this response?{' '}
          {response?.trigger && (
            <span className="font-medium">"{response.trigger}"</span>
          )}
        </p>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Response Card ─────────────────────────────────────────────────────────────

interface ResponseCardProps {
  response: BrandResponse
  onEdit: (r: BrandResponse) => void
  onDelete: (r: BrandResponse) => void
}

function ResponseCard({ response, onEdit, onDelete }: ResponseCardProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(response.response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast('Response copied to clipboard', 'success')
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
      {/* Trigger */}
      <div className="bg-slate-50 border-b border-gray-100 px-4 py-3">
        <p className="text-sm font-semibold text-slate-800 leading-snug">{response.trigger}</p>
      </div>

      {/* Response body */}
      <div className="px-4 py-4 flex-1">
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-6">
          {response.response}
        </p>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 space-y-2.5">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={audienceVariant(response.audience)}>{audienceLabel(response.audience)}</Badge>
          <Badge variant={channelVariant(response.channel)}>{channelLabel(response.channel)}</Badge>
          {response.tags.map(tag => (
            <span key={tag} className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{tag}</span>
          ))}
        </div>

        {/* Notes */}
        {response.notes && (
          <p className="text-xs text-slate-400 italic">{response.notes}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleCopy} className="flex-1">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(response)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onDelete(response)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Brand Voice Reference Card ────────────────────────────────────────────────

function BrandVoiceCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-navy mb-1">Brand Voice Reference</h2>
        <p className="text-xs text-slate-400">Permanent reference — non-editable</p>
      </div>

      {/* Voice Attributes */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Voice Attributes</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {brandVoice.attributes.map(attr => (
            <Badge key={attr} variant="success">{attr}</Badge>
          ))}
        </div>
      </section>

      {/* Tone Guidance */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Tone Guidance</h3>
        <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
          <p className="text-sm text-amber-900 italic leading-relaxed">{brandVoice.toneGuidance}</p>
        </div>
      </section>

      {/* Approved Trust Language */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Approved Trust Language</h3>
        <div className="flex flex-wrap gap-2">
          {brandVoice.approvedTrustLanguage.map(phrase => (
            <span
              key={phrase}
              className="rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
            >
              {phrase}
            </span>
          ))}
        </div>
      </section>

      {/* Forbidden Language */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Forbidden Language</h3>
        <div className="flex flex-wrap gap-2">
          {brandVoice.forbiddenLanguage.map(term => (
            <span
              key={term}
              className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-500 line-through"
            >
              {term}
            </span>
          ))}
        </div>
      </section>

      {/* Voice Examples */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Voice Examples</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-lg border-2 border-green-200 bg-green-50 px-4 py-3">
            <p className="text-xs font-bold text-green-700 mb-1.5">Good ✓</p>
            <p className="text-sm text-green-900 leading-relaxed">{brandVoice.voiceExamples.good}</p>
          </div>
          <div className="rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3">
            <p className="text-xs font-bold text-red-500 mb-1.5">Avoid ✗</p>
            <p className="text-sm text-red-900 leading-relaxed">{brandVoice.voiceExamples.bad}</p>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const AUDIENCE_OPTS: Array<{ value: ResponseAudience | 'all'; label: string }> = [
  { value: 'all', label: 'All Audiences' },
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'general', label: 'General' },
  { value: 'skeptic', label: 'Skeptic' },
]

const CHANNEL_OPTS: Array<{ value: ResponseChannel | 'all'; label: string }> = [
  { value: 'all', label: 'All Channels' },
  { value: 'social-comment', label: 'Social Comment' },
  { value: 'dm', label: 'DM' },
  { value: 'email', label: 'Email' },
  { value: 'in-app', label: 'In-App' },
  { value: 'any', label: 'Any' },
]

export default function BrandPage() {
  const [responses, setResponses] = useState<BrandResponse[]>([])
  const [audienceFilter, setAudienceFilter] = useState<ResponseAudience | 'all'>('all')
  const [channelFilter, setChannelFilter] = useState<ResponseChannel | 'all'>('all')
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<BrandResponse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BrandResponse | null>(null)

  useEffect(() => {
    setResponses(getBrandResponses())
  }, [])

  const filtered = useMemo(() => {
    return responses.filter(r => {
      if (audienceFilter !== 'all' && r.audience !== audienceFilter) return false
      if (channelFilter !== 'all' && r.channel !== channelFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          r.trigger.toLowerCase().includes(q) ||
          r.response.toLowerCase().includes(q) ||
          r.tags.some(t => t.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [responses, audienceFilter, channelFilter, search])

  function handleAddSave(form: FormState) {
    const now = new Date().toISOString()
    const br: BrandResponse = {
      id: generateId(),
      trigger: form.trigger.trim(),
      response: form.response.trim(),
      audience: form.audience,
      channel: form.channel,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      notes: form.notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    }
    upsertBrandResponse(br)
    setResponses(getBrandResponses())
    toast('Response added', 'success')
  }

  function handleEditSave(form: FormState) {
    if (!editTarget) return
    const updated: BrandResponse = {
      ...editTarget,
      trigger: form.trigger.trim(),
      response: form.response.trim(),
      audience: form.audience,
      channel: form.channel,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      notes: form.notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    }
    upsertBrandResponse(updated)
    setResponses(getBrandResponses())
    setEditTarget(null)
    toast('Response updated', 'success')
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    deleteBrandResponse(deleteTarget.id)
    setResponses(getBrandResponses())
    setDeleteTarget(null)
    toast('Response deleted', 'success')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Breadcrumb />
        <h1 className="text-2xl font-bold text-navy">Brand</h1>
        <p className="text-sm text-slate-500 mt-0.5">Voice reference and response library</p>
      </div>

      {/* Section 1 — Brand Voice Reference */}
      <BrandVoiceCard />

      {/* Section 2 — Response Library */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-navy">Response Library</h2>
            <p className="text-xs text-slate-400 mt-0.5">{filtered.length} of {responses.length} responses</p>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Response
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral/50"
            value={audienceFilter}
            onChange={e => setAudienceFilter(e.target.value as ResponseAudience | 'all')}
          >
            {AUDIENCE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral/50"
            value={channelFilter}
            onChange={e => setChannelFilter(e.target.value as ResponseChannel | 'all')}
          >
            {CHANNEL_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <Input
            className="w-56"
            placeholder="Search triggers, responses, tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Response Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-sm">No responses match your filters.</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add Response
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map(r => (
              <ResponseCard
                key={r.id}
                response={r}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ResponseDialog
        open={addOpen}
        mode="add"
        onClose={() => setAddOpen(false)}
        onSave={handleAddSave}
      />

      <ResponseDialog
        open={!!editTarget}
        mode="edit"
        initialForm={editTarget ? formFromResponse(editTarget) : undefined}
        onClose={() => setEditTarget(null)}
        onSave={handleEditSave}
      />

      <DeleteDialog
        response={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
