'use client'

import { useEffect, useState, useCallback } from 'react'
import Papa from 'papaparse'
import {
  Plus,
  Search,
  X,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Link2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RoleGate } from '@/components/role-gate'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import { Breadcrumb } from '@/components/breadcrumb'
import {
  getScripts,
  upsertScript,
  getMerchants,
  upsertMerchant,
  initializeStorage,
} from '@/lib/storage'
import { generateId, formatDate, cn } from '@/lib/utils'
import type {
  Script,
  ScriptChannel,
  ScriptType,
  ScriptPersona,
  ScriptStage,
  Merchant,
} from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'navy' | 'purple' | 'outline'

// ─── Badge helpers ─────────────────────────────────────────────────────────────

function channelVariant(channel: ScriptChannel): BadgeVariant {
  const map: Record<ScriptChannel, BadgeVariant> = {
    'whatsapp': 'success',
    'instagram-dm': 'purple',
    'facebook-messenger': 'navy',
    'email': 'secondary',
    'sms': 'warning',
  }
  return map[channel] ?? 'secondary'
}

function typeVariant(type: ScriptType): BadgeVariant {
  const map: Record<ScriptType, BadgeVariant> = {
    'cold-outreach': 'default',
    'warm-intro': 'success',
    'follow-up': 'warning',
    'objection-handling': 'danger',
    'close': 'navy',
  }
  return map[type] ?? 'default'
}

function stageVariant(stage: ScriptStage): BadgeVariant {
  const map: Record<ScriptStage, BadgeVariant> = {
    'first-contact': 'secondary',
    'second-touch': 'warning',
    'third-touch': 'default',
    'objection': 'danger',
    'close': 'navy',
  }
  return map[stage] ?? 'secondary'
}

function formatLabel(str: string): string {
  return str
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_CHANNELS: ScriptChannel[] = ['whatsapp', 'instagram-dm', 'facebook-messenger', 'email', 'sms']
const ALL_TYPES: ScriptType[] = ['cold-outreach', 'warm-intro', 'follow-up', 'objection-handling', 'close']
const ALL_PERSONAS: ScriptPersona[] = [
  'fashion-seller', 'food-vendor', 'beauty-business', 'service-provider',
  'event-organizer', 'hospitality', 'general-merchant', 'diaspora-buyer', 'local-buyer',
]
const ALL_STAGES: ScriptStage[] = ['first-contact', 'second-touch', 'third-touch', 'objection', 'close']

const EMPTY_FORM: Omit<Script, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  body: '',
  channel: 'whatsapp',
  type: 'cold-outreach',
  persona: 'general-merchant',
  stage: 'first-contact',
  tags: [],
  notes: '',
}

// ─── Script Card ──────────────────────────────────────────────────────────────

function ScriptCard({
  script,
  onOpenDetail,
}: {
  script: Script
  onOpenDetail: (s: Script) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    await navigator.clipboard.writeText(script.body)
    setCopied(true)
    toast('Script body copied to clipboard.')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border border-gray-200 dark:border-navy-500 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div
          className="flex flex-wrap items-start gap-2 cursor-pointer"
          onClick={() => onOpenDetail(script)}
        >
          <span className="flex-1 font-semibold text-navy dark:text-white text-sm leading-snug min-w-0">
            {script.title}
          </span>
          <div className="flex flex-wrap gap-1.5 shrink-0">
            <Badge variant={channelVariant(script.channel)}>{formatLabel(script.channel)}</Badge>
            <Badge variant={typeVariant(script.type)}>{formatLabel(script.type)}</Badge>
            <Badge variant="outline">{formatLabel(script.persona)}</Badge>
          </div>
        </div>

        {/* Stage badge */}
        <div>
          <Badge variant={stageVariant(script.stage)} className="text-[10px] px-2 py-px">
            {formatLabel(script.stage)}
          </Badge>
        </div>

        {/* Body */}
        <div className="relative">
          <p
            className={cn(
              'text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed',
              !expanded && 'line-clamp-4',
            )}
          >
            {script.body}
          </p>
          <button
            onClick={() => setExpanded(v => !v)}
            className="mt-1 text-xs text-coral font-medium flex items-center gap-0.5 hover:underline"
          >
            {expanded ? (
              <><ChevronUp className="h-3 w-3" /> Collapse</>
            ) : (
              <><ChevronDown className="h-3 w-3" /> Expand</>
            )}
          </button>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-navy-600">
          <span className="text-xs text-slate-400">{formatDate(script.updatedAt)}</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onOpenDetail(script)}
            >
              <Link2 className="h-3 w-3" />
              Link to Merchant
            </Button>
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              Copy
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Slide-over Panel ─────────────────────────────────────────────────────────

function SlideOver({
  script,
  onClose,
  onSave,
}: {
  script: Script | null
  onClose: () => void
  onSave: (s: Script) => void
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Script | null>(null)
  const [copied, setCopied] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [merchantSearch, setMerchantSearch] = useState('')

  useEffect(() => {
    if (script) {
      setForm({ ...script })
      setEditing(false)
    }
  }, [script])

  useEffect(() => {
    if (linkOpen) {
      setMerchants(getMerchants())
      setMerchantSearch('')
    }
  }, [linkOpen])

  if (!script || !form) return null

  async function handleCopy() {
    await navigator.clipboard.writeText(script!.body)
    setCopied(true)
    toast('Full script body copied.')
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSave() {
    if (!form) return
    const updated = { ...form, updatedAt: new Date().toISOString() }
    onSave(updated)
    setEditing(false)
    toast('Script updated.')
  }

  function linkMerchant(merchant: Merchant) {
    upsertMerchant({ ...merchant, assignedScript: script!.id })
    setLinkOpen(false)
    toast(`Script linked to ${merchant.name}.`)
  }

  const filtered = merchants.filter(m =>
    m.name.toLowerCase().includes(merchantSearch.toLowerCase()) ||
    m.category.toLowerCase().includes(merchantSearch.toLowerCase())
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[520px] max-w-full bg-white dark:bg-navy-500 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-navy-600">
          {editing ? (
            <input
              className="flex-1 text-base font-semibold bg-transparent border-b border-coral outline-none text-navy dark:text-white"
              value={form.title}
              onChange={e => setForm(f => f ? { ...f, title: e.target.value } : f)}
            />
          ) : (
            <h2 className="text-base font-semibold text-navy dark:text-white truncate">{form.title}</h2>
          )}
          <div className="flex items-center gap-2 ml-3 shrink-0">
            <RoleGate roles={['admin', 'editor']}>
              {editing ? (
                <>
                  <Button size="sm" onClick={handleSave}>Save</Button>
                  <Button size="sm" variant="secondary" onClick={() => { setForm({ ...script }); setEditing(false) }}>Cancel</Button>
                </>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
              )}
            </RoleGate>
            <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-navy-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-navy-600 flex flex-wrap gap-2">
          {editing ? (
            <>
              <Select value={form.channel} onValueChange={v => setForm(f => f ? { ...f, channel: v as ScriptChannel } : f)}>
                <SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger>
                <SelectContent>{ALL_CHANNELS.map(c => <SelectItem key={c} value={c}>{formatLabel(c)}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.type} onValueChange={v => setForm(f => f ? { ...f, type: v as ScriptType } : f)}>
                <SelectTrigger className="h-7 text-xs w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{ALL_TYPES.map(t => <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.persona} onValueChange={v => setForm(f => f ? { ...f, persona: v as ScriptPersona } : f)}>
                <SelectTrigger className="h-7 text-xs w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{ALL_PERSONAS.map(p => <SelectItem key={p} value={p}>{formatLabel(p)}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.stage} onValueChange={v => setForm(f => f ? { ...f, stage: v as ScriptStage } : f)}>
                <SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger>
                <SelectContent>{ALL_STAGES.map(s => <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>)}</SelectContent>
              </Select>
            </>
          ) : (
            <>
              <Badge variant={channelVariant(form.channel)}>{formatLabel(form.channel)}</Badge>
              <Badge variant={typeVariant(form.type)}>{formatLabel(form.type)}</Badge>
              <Badge variant="outline">{formatLabel(form.persona)}</Badge>
              <Badge variant={stageVariant(form.stage)}>{formatLabel(form.stage)}</Badge>
            </>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {editing ? (
            <Textarea
              className="min-h-[300px] text-sm font-mono leading-relaxed"
              value={form.body}
              onChange={e => setForm(f => f ? { ...f, body: e.target.value } : f)}
            />
          ) : (
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {form.body}
            </p>
          )}

          {editing && (
            <div className="space-y-2">
              <Label className="text-xs">Notes</Label>
              <Textarea
                className="min-h-[80px] text-sm"
                value={form.notes ?? ''}
                onChange={e => setForm(f => f ? { ...f, notes: e.target.value } : f)}
                placeholder="Internal notes…"
              />
            </div>
          )}

          {!editing && form.notes && (
            <div className="rounded-lg bg-amber-50 dark:bg-navy-600 border border-amber-100 dark:border-navy-500 p-3">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">Notes</p>
              <p className="text-xs text-amber-900 dark:text-amber-100">{form.notes}</p>
            </div>
          )}

          <p className="text-xs text-slate-400">
            Created {formatDate(form.createdAt)} · Updated {formatDate(form.updatedAt)}
          </p>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-navy-600 flex gap-2">
          <RoleGate roles={['admin', 'editor']}>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setLinkOpen(true)}
            >
              <Link2 className="h-4 w-4" />
              Link to Merchant
            </Button>
          </RoleGate>
          <Button
            variant="secondary"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copy
          </Button>
        </div>
      </div>

      {/* Link to merchant dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link to Merchant</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Search merchants…"
            value={merchantSearch}
            onChange={e => setMerchantSearch(e.target.value)}
            className="mb-2"
          />
          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {filtered.length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center">No merchants found.</p>
            )}
            {filtered.map(m => (
              <button
                key={m.id}
                onClick={() => linkMerchant(m)}
                className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-navy-600 border border-gray-100 dark:border-navy-500 group"
              >
                <div>
                  <p className="text-sm font-medium text-navy dark:text-white">{m.name}</p>
                  <p className="text-xs text-slate-400">{m.category} · {m.city}</p>
                </div>
                {m.assignedScript === script.id && (
                  <Badge variant="success" className="text-[10px]">Linked</Badge>
                )}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setLinkOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Add Script Dialog ────────────────────────────────────────────────────────

function AddScriptDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onAdd: (s: Script) => void
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [tagsInput, setTagsInput] = useState('')

  function handleSubmit() {
    if (!form.title.trim() || !form.body.trim()) {
      toast('Title and body are required.', 'error')
      return
    }
    const now = new Date().toISOString()
    const script: Script = {
      ...form,
      id: generateId(),
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: now,
      updatedAt: now,
    }
    onAdd(script)
    setForm({ ...EMPTY_FORM })
    setTagsInput('')
    onOpenChange(false)
    toast(`"${script.title}" saved.`)
  }

  function field<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Script</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={form.title} onChange={e => field('title', e.target.value)} placeholder="e.g. Cold DM for Fashion Sellers" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <Select value={form.channel} onValueChange={v => field('channel', v as ScriptChannel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ALL_CHANNELS.map(c => <SelectItem key={c} value={c}>{formatLabel(c)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => field('type', v as ScriptType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ALL_TYPES.map(t => <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Persona</Label>
              <Select value={form.persona} onValueChange={v => field('persona', v as ScriptPersona)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ALL_PERSONAS.map(p => <SelectItem key={p} value={p}>{formatLabel(p)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select value={form.stage} onValueChange={v => field('stage', v as ScriptStage)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ALL_STAGES.map(s => <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Script Body</Label>
            <Textarea
              value={form.body}
              onChange={e => field('body', e.target.value)}
              className="min-h-[160px] text-sm font-mono"
              placeholder="Write the full script here…"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Tags <span className="text-slate-400 font-normal">(comma separated)</span></Label>
            <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="e.g. diaspora, high-priority" />
          </div>

          <div className="space-y-1.5">
            <Label>Notes <span className="text-slate-400 font-normal">(optional)</span></Label>
            <Textarea value={form.notes ?? ''} onChange={e => field('notes', e.target.value)} className="min-h-[70px] text-sm" placeholder="Internal notes…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Add Script</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [filterChannel, setFilterChannel] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPersona, setFilterPersona] = useState<string>('all')
  const [filterStage, setFilterStage] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [selected, setSelected] = useState<Script | null>(null)

  useEffect(() => {
    initializeStorage()
    setScripts(getScripts())
  }, [])

  const filtered = scripts.filter(s => {
    if (filterChannel !== 'all' && s.channel !== filterChannel) return false
    if (filterType !== 'all' && s.type !== filterType) return false
    if (filterPersona !== 'all' && s.persona !== filterPersona) return false
    if (filterStage !== 'all' && s.stage !== filterStage) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        s.title.toLowerCase().includes(q) ||
        s.body.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    return true
  })

  function handleAdd(script: Script) {
    upsertScript(script)
    setScripts(getScripts())
  }

  function handleSave(script: Script) {
    upsertScript(script)
    setScripts(getScripts())
    // Update selected to reflect changes
    setSelected(script)
  }

  function exportCSV() {
    const data = filtered.map(s => ({
      id: s.id,
      title: s.title,
      channel: s.channel,
      type: s.type,
      persona: s.persona,
      stage: s.stage,
      tags: s.tags.join(', '),
      body: s.body,
      notes: s.notes ?? '',
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }))
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'scripts.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast(`${data.length} scripts exported.`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-700">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <Breadcrumb />
            <h1 className="text-2xl font-bold text-navy dark:text-white">Script Library</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {filtered.length} of {scripts.length} scripts
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <RoleGate roles={['admin', 'editor']}>
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Script
              </Button>
            </RoleGate>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              className="pl-9"
              placeholder="Search scripts…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterChannel} onValueChange={setFilterChannel}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Channel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              {ALL_CHANNELS.map(c => <SelectItem key={c} value={c}>{formatLabel(c)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {ALL_TYPES.map(t => <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPersona} onValueChange={setFilterPersona}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Persona" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Personas</SelectItem>
              {ALL_PERSONAS.map(p => <SelectItem key={p} value={p}>{formatLabel(p)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {ALL_STAGES.map(s => <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Script list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm">No scripts match your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(script => (
              <ScriptCard
                key={script.id}
                script={script}
                onOpenDetail={setSelected}
              />
            ))}
          </div>
        )}
      </div>

      {/* Slide-over */}
      <SlideOver
        script={selected}
        onClose={() => setSelected(null)}
        onSave={handleSave}
      />

      {/* Add dialog */}
      <AddScriptDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={handleAdd}
      />
    </div>
  )
}
