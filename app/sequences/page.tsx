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

// ─── Email Detail Modal ───────────────────────────────────────────────────────

function EmailDetailModal({
  email,
  onClose,
}: {
  email: Email | null
  onClose: () => void
}) {
  if (!email) return null

  return (
    <Dialog open={!!email} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-6">{email.subject}</DialogTitle>
        </DialogHeader>
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
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Close</Button>
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
}: {
  sequence: EmailSequence
  brevoEnabled: boolean
  brevoApiKey: string
  enrollingId: string | null
  onEnrollClick: (id: string) => void
  onEnrollClose: () => void
  onStatusChange: (id: string, status: SequenceStatus) => void
}) {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)

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
            <div className="flex items-center justify-center h-20 rounded-xl border border-dashed border-gray-200 dark:border-navy-500">
              <p className="text-sm text-slate-400">No emails in this sequence yet.</p>
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

      {/* Email detail modal */}
      <EmailDetailModal email={selectedEmail} onClose={() => setSelectedEmail(null)} />
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
