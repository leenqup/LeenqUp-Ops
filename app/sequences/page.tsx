'use client'

import { useEffect, useState } from 'react'
import {
  Plus,
  Download,
  Mail,
  ChevronRight,
  UserPlus,
  X,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import {
  getSequences,
  upsertSequence,
  getSettings,
  initializeStorage,
} from '@/lib/storage'
import { generateId, formatDate } from '@/lib/utils'
import type {
  EmailSequence,
  SequenceAudience,
  SequenceStatus,
  Email,
} from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'navy' | 'purple' | 'outline'

// ─── Badge helpers ─────────────────────────────────────────────────────────────

function statusVariant(status: SequenceStatus): BadgeVariant {
  const map: Record<SequenceStatus, BadgeVariant> = {
    draft: 'secondary',
    ready: 'success',
    active: 'default',
    paused: 'warning',
  }
  return map[status] ?? 'secondary'
}

function audienceVariant(audience: SequenceAudience): BadgeVariant {
  const map: Record<SequenceAudience, BadgeVariant> = {
    buyer: 'default',
    seller: 'navy',
    dormant: 'warning',
    're-engagement': 'purple',
  }
  return map[audience] ?? 'secondary'
}

function formatLabel(str: string): string {
  return str
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_AUDIENCES: SequenceAudience[] = ['buyer', 'seller', 'dormant', 're-engagement']
const ALL_STATUSES: SequenceStatus[] = ['draft', 'ready', 'active', 'paused']

// ─── Email Timeline Card ──────────────────────────────────────────────────────

function EmailTimelineCard({
  email,
  onClick,
}: {
  email: Email
  onClick: () => void
}) {
  const firstLine = email.body.split('\n').find(l => l.trim()) ?? ''

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-44 rounded-xl border border-gray-200 dark:border-navy-500 bg-white dark:bg-navy-600 p-3 text-left hover:border-coral hover:shadow-md transition-all space-y-2 group"
    >
      {/* Circle number */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-coral text-white text-xs font-bold shrink-0">
          {email.position}
        </span>
        <span className="text-[10px] text-slate-400 font-medium">Day {email.delayDays}</span>
      </div>

      {/* Subject */}
      <p className="text-xs font-semibold text-navy dark:text-white leading-snug truncate" title={email.subject}>
        {email.subject}
      </p>

      {/* Preview */}
      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug truncate">
        {firstLine}
      </p>
    </button>
  )
}

// ─── Email Detail / Edit Modal ────────────────────────────────────────────────

function EmailDetailModal({
  email,
  onClose,
  onSave,
  onDelete,
}: {
  email: Email | null
  onClose: () => void
  onSave: (updated: Email) => void
  onDelete: (position: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [delayDays, setDelayDays] = useState(0)
  const [tagsStr, setTagsStr] = useState('')

  useEffect(() => {
    if (email) {
      setSubject(email.subject)
      setBody(email.body)
      setDelayDays(email.delayDays)
      setTagsStr(email.tags.join(', '))
      setEditing(false)
    }
  }, [email])

  if (!email) return null

  function handleSave() {
    if (!subject.trim()) { toast('Subject is required', 'error'); return }
    onSave({
      ...email!,
      subject: subject.trim(),
      body: body.trim(),
      delayDays,
      tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean),
    })
    setEditing(false)
  }

  return (
    <Dialog open={!!email} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-6">
            {editing ? 'Edit Email' : email.subject}
          </DialogTitle>
        </DialogHeader>

        {editing ? (
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Send on Day</Label>
                <Input type="number" min={0} value={delayDays} onChange={e => setDelayDays(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Tags <span className="text-slate-400 font-normal">(comma-sep)</span></Label>
                <Input value={tagsStr} onChange={e => setTagsStr(e.target.value)} placeholder="onboarding, welcome" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email Body</Label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={10}
                className="w-full rounded-lg border border-gray-200 dark:border-navy-500 bg-white dark:bg-navy-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-coral/30 resize-y"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary">Email #{email.position}</Badge>
              <Badge variant="warning">Day {email.delayDays}</Badge>
              {email.tags.map(tag => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-navy-600 border border-gray-100 dark:border-navy-500 p-4">
              <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {email.body}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {editing ? (
            <>
              <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                className="text-red-500 hover:text-red-600 mr-auto"
                onClick={() => { onDelete(email.position); onClose() }}
              >
                Delete
              </Button>
              <Button variant="secondary" onClick={onClose}>Close</Button>
              <Button onClick={() => setEditing(true)}>Edit</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Add Email Dialog ─────────────────────────────────────────────────────────

function AddEmailDialog({
  open,
  nextPosition,
  onClose,
  onAdd,
}: {
  open: boolean
  nextPosition: number
  onClose: () => void
  onAdd: (email: Email) => void
}) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [delayDays, setDelayDays] = useState(0)
  const [tagsStr, setTagsStr] = useState('')

  function handleSubmit() {
    if (!subject.trim()) { toast('Subject is required', 'error'); return }
    onAdd({
      position: nextPosition,
      subject: subject.trim(),
      body: body.trim(),
      delayDays,
      tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean),
    })
    setSubject(''); setBody(''); setDelayDays(0); setTagsStr('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Email #{nextPosition}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Welcome to LeenqUp!" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Send on Day</Label>
              <Input type="number" min={0} value={delayDays} onChange={e => setDelayDays(Number(e.target.value))} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Tags <span className="text-slate-400 font-normal">(comma-sep)</span></Label>
              <Input value={tagsStr} onChange={e => setTagsStr(e.target.value)} placeholder="welcome, onboarding" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email Body</Label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={10}
              placeholder="Write the email body here. Use [name], [email] for personalization."
              className="w-full rounded-lg border border-gray-200 dark:border-navy-500 bg-white dark:bg-navy-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-coral/30 resize-y"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Add Email</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Enroll Form ──────────────────────────────────────────────────────────────

function EnrollForm({
  sequence,
  brevoApiKey,
  onClose,
}: {
  sequence: EmailSequence
  brevoApiKey: string
  onClose: () => void
}) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/brevo/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-brevo-key': brevoApiKey,
        },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          sequenceId: sequence.id,
          listName: sequence.name,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message ?? `HTTP ${res.status}`)
      }
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setErrorMsg(`Brevo error: ${msg}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-brand-green">
        Contact enrolled ✓
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 rounded-xl border border-gray-200 bg-gray-50 dark:bg-navy-600 dark:border-navy-500 px-4 py-4 space-y-3"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
        Enroll contact in &ldquo;{sequence.name}&rdquo;
      </p>
      <div className="space-y-1.5">
        <Label className="text-xs">Email <span className="text-red-400">*</span></Label>
        <Input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="contact@example.com"
          className="h-8 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs">First Name <span className="text-slate-400 font-normal">(optional)</span></Label>
          <Input
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="Jane"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Last Name <span className="text-slate-400 font-normal">(optional)</span></Label>
          <Input
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="Doe"
            className="h-8 text-sm"
          />
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" size="sm" disabled={submitting || !email.trim()}>
          {submitting ? 'Sending…' : 'Send to Brevo'}
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Sequence Card ────────────────────────────────────────────────────────────

function SequenceCard({
  sequence,
  brevoEnabled,
  brevoApiKey,
  enrollingId,
  onEnrollClick,
  onEnrollClose,
  onStatusChange,
  onAddEmail,
  onUpdateEmail,
  onDeleteEmail,
}: {
  sequence: EmailSequence
  brevoEnabled: boolean
  brevoApiKey: string
  enrollingId: string | null
  onEnrollClick: (id: string) => void
  onEnrollClose: () => void
  onStatusChange: (id: string, status: SequenceStatus) => void
  onAddEmail: (sequenceId: string, email: Email) => void
  onUpdateEmail: (sequenceId: string, email: Email) => void
  onDeleteEmail: (sequenceId: string, position: number) => void
}) {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [addEmailOpen, setAddEmailOpen] = useState(false)

  function handleExport() {
    const lines: string[] = [
      `SEQUENCE: ${sequence.name}`,
      `Audience: ${formatLabel(sequence.audience)}`,
      `Trigger: ${sequence.triggerEvent}`,
      `Status: ${sequence.status}`,
      ``,
      ...sequence.emails.flatMap(email => [
        `${'─'.repeat(60)}`,
        `Email #${email.position} — Day ${email.delayDays}`,
        `Subject: ${email.subject}`,
        `Tags: ${email.tags.join(', ')}`,
        ``,
        email.body,
        ``,
      ]),
    ]
    const content = lines.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sequence.name.replace(/\s+/g, '-').toLowerCase()}-sequence.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast(`${sequence.emails.length} emails exported.`)
  }

  const isEnrolling = enrollingId === sequence.id

  return (
    <>
      <Card className="border border-gray-200 dark:border-navy-500 shadow-sm">
        <CardContent className="p-5 space-y-4">
          {/* Card header */}
          <div className="flex flex-wrap items-start gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-navy dark:text-white">{sequence.name}</h2>
              {sequence.triggerEvent && (
                <p className="text-xs text-slate-400 italic mt-0.5">{sequence.triggerEvent}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Badge variant={audienceVariant(sequence.audience)}>{formatLabel(sequence.audience)}</Badge>
              <Badge variant={statusVariant(sequence.status)}>{formatLabel(sequence.status)}</Badge>
            </div>
          </div>

          {/* Timeline */}
          {sequence.emails.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-24 rounded-xl border border-dashed border-gray-200 dark:border-navy-500 gap-2 cursor-pointer hover:border-coral/50 hover:bg-coral/5 transition-colors"
              onClick={() => setAddEmailOpen(true)}
            >
              <p className="text-sm text-slate-400">No emails yet</p>
              <p className="text-xs text-coral font-medium">+ Add First Email</p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-1">
              <div className="flex items-center gap-2 min-w-max">
                {[...sequence.emails]
                  .sort((a, b) => a.position - b.position)
                  .map((email, idx, arr) => (
                    <div key={email.position} className="flex items-center gap-2">
                      <EmailTimelineCard email={email} onClick={() => setSelectedEmail(email)} />
                      {idx < arr.length - 1 && (
                        <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Actions row */}
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-100 dark:border-navy-600">
            <Button
              size="sm"
              variant={brevoEnabled ? (isEnrolling ? 'secondary' : 'default') : 'secondary'}
              disabled={!brevoEnabled}
              onClick={() => isEnrolling ? onEnrollClose() : onEnrollClick(sequence.id)}
              title={brevoEnabled ? 'Enroll a contact in this Brevo sequence' : 'Configure Brevo API key in Settings'}
            >
              {isEnrolling ? (
                <>
                  <X className="h-3 w-3" />
                  Cancel Enroll
                </>
              ) : (
                <>
                  <UserPlus className="h-3 w-3" />
                  Enroll in Brevo
                </>
              )}
            </Button>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Status:</span>
              <Select
                value={sequence.status}
                onValueChange={v => onStatusChange(sequence.id, v as SequenceStatus)}
              >
                <SelectTrigger className="h-7 text-xs w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button size="sm" variant="secondary" onClick={() => setAddEmailOpen(true)}>
              <Plus className="h-3 w-3" />
              Add Email
            </Button>

            <Button size="sm" variant="secondary" onClick={handleExport}>
              <Download className="h-3 w-3" />
              Export
            </Button>

            <span className="ml-auto text-xs text-slate-400">
              {sequence.emails.length} email{sequence.emails.length !== 1 ? 's' : ''} · Updated {formatDate(sequence.updatedAt)}
            </span>
          </div>

          {/* Inline enroll form */}
          {isEnrolling && (
            <EnrollForm
              sequence={sequence}
              brevoApiKey={brevoApiKey}
              onClose={onEnrollClose}
            />
          )}
        </CardContent>
      </Card>

      {/* Email detail / edit modal */}
      <EmailDetailModal
        email={selectedEmail}
        onClose={() => setSelectedEmail(null)}
        onSave={updated => { onUpdateEmail(sequence.id, updated); setSelectedEmail(null) }}
        onDelete={pos => { onDeleteEmail(sequence.id, pos); setSelectedEmail(null) }}
      />

      {/* Add email dialog */}
      <AddEmailDialog
        open={addEmailOpen}
        nextPosition={sequence.emails.length + 1}
        onClose={() => setAddEmailOpen(false)}
        onAdd={email => { onAddEmail(sequence.id, email); setAddEmailOpen(false) }}
      />
    </>
  )
}

// ─── Add Sequence Dialog ──────────────────────────────────────────────────────

function AddSequenceDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onAdd: (seq: EmailSequence) => void
}) {
  const [name, setName] = useState('')
  const [audience, setAudience] = useState<SequenceAudience>('buyer')
  const [triggerEvent, setTriggerEvent] = useState('')

  function handleSubmit() {
    if (!name.trim()) {
      toast('Please enter a sequence name.', 'error')
      return
    }
    const now = new Date().toISOString()
    const seq: EmailSequence = {
      id: generateId(),
      name: name.trim(),
      audience,
      triggerEvent: triggerEvent.trim(),
      emails: [],
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    }
    onAdd(seq)
    setName('')
    setAudience('buyer')
    setTriggerEvent('')
    onOpenChange(false)
    toast(`"${seq.name}" added as draft.`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Email Sequence</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Sequence Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Seller Onboarding Welcome Series"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Audience</Label>
            <Select value={audience} onValueChange={v => setAudience(v as SequenceAudience)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_AUDIENCES.map(a => (
                  <SelectItem key={a} value={a}>{formatLabel(a)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Trigger Event <span className="text-slate-400 font-normal">(optional)</span></Label>
            <Input
              value={triggerEvent}
              onChange={e => setTriggerEvent(e.target.value)}
              placeholder="e.g. New seller signs up, 30-day dormant"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Create Sequence</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SequencesPage() {
  const [sequences, setSequences] = useState<EmailSequence[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [brevoEnabled, setBrevoEnabled] = useState(false)
  const [brevoApiKey, setBrevoApiKey] = useState('')
  const [enrollingId, setEnrollingId] = useState<string | null>(null)

  useEffect(() => {
    initializeStorage()
    setSequences(getSequences())
    const settings = getSettings()
    const key = settings.brevoApiKey?.trim() ?? ''
    setBrevoEnabled(!!key)
    setBrevoApiKey(key)
  }, [])

  function handleAdd(seq: EmailSequence) {
    upsertSequence(seq)
    setSequences(getSequences())
  }

  function handleStatusChange(id: string, status: SequenceStatus) {
    const seq = sequences.find(s => s.id === id)
    if (!seq) return
    const updated = { ...seq, status, updatedAt: new Date().toISOString() }
    upsertSequence(updated)
    setSequences(getSequences())
    toast(`Sequence set to ${formatLabel(status)}.`)
  }

  function handleAddEmail(sequenceId: string, email: Email) {
    const seq = sequences.find(s => s.id === sequenceId)
    if (!seq) return
    const updated: EmailSequence = {
      ...seq,
      emails: [...seq.emails, email],
      updatedAt: new Date().toISOString(),
    }
    upsertSequence(updated)
    setSequences(getSequences())
    toast(`Email #${email.position} added to "${seq.name}"`)
  }

  function handleUpdateEmail(sequenceId: string, email: Email) {
    const seq = sequences.find(s => s.id === sequenceId)
    if (!seq) return
    const updated: EmailSequence = {
      ...seq,
      emails: seq.emails.map(e => e.position === email.position ? email : e),
      updatedAt: new Date().toISOString(),
    }
    upsertSequence(updated)
    setSequences(getSequences())
    toast('Email updated')
  }

  function handleDeleteEmail(sequenceId: string, position: number) {
    const seq = sequences.find(s => s.id === sequenceId)
    if (!seq) return
    // Remove email, then resequence positions
    const remaining = seq.emails
      .filter(e => e.position !== position)
      .map((e, i) => ({ ...e, position: i + 1 }))
    const updated: EmailSequence = {
      ...seq,
      emails: remaining,
      updatedAt: new Date().toISOString(),
    }
    upsertSequence(updated)
    setSequences(getSequences())
    toast('Email removed')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-700">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-navy dark:text-white">Email Sequences</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {sequences.length} sequence{sequences.length !== 1 ? 's' : ''}
              {!brevoEnabled && (
                <span className="ml-2 text-amber-500 text-xs">(Set Brevo API key in Settings to enable sending)</span>
              )}
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Sequence
          </Button>
        </div>

        {/* Sequences list */}
        {sequences.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <Mail className="h-10 w-10 mx-auto opacity-30" />
            <p className="text-sm">No sequences yet. Create your first one.</p>
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Sequence
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sequences.map(seq => (
              <SequenceCard
                key={seq.id}
                sequence={seq}
                brevoEnabled={brevoEnabled}
                brevoApiKey={brevoApiKey}
                enrollingId={enrollingId}
                onEnrollClick={id => setEnrollingId(id)}
                onEnrollClose={() => setEnrollingId(null)}
                onStatusChange={handleStatusChange}
                onAddEmail={handleAddEmail}
                onUpdateEmail={handleUpdateEmail}
                onDeleteEmail={handleDeleteEmail}
              />
            ))}
          </div>
        )}
      </div>

      <AddSequenceDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={handleAdd}
      />
    </div>
  )
}
