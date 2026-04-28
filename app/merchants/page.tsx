'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import {
  Search,
  X,
  Plus,
  Download,
  Upload,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Copy,
  Trash2,
  Pencil,
  Check,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  ClipboardList,
  Clock,
  ChevronRight,
  AlertTriangle,
  Star,
  LayoutList,
  Table2,
  Package,
  Truck,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart2,
  MapPin,
  Store,
  CheckSquare,
  Columns3,
  SlidersHorizontal,
  UserCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import { Breadcrumb } from '@/components/breadcrumb'
import { RoleGate } from '@/components/role-gate'
import { useAuth } from '@/components/auth-provider'
import {
  getMerchants,
  saveMerchants,
  upsertMerchant,
  deleteMerchant,
  getScripts,
  logCRMActivity,
  getDeals,
  upsertDeal,
  getCardsForBoard,
  getProjectBoards,
  getPriceBenchmarks,
  upsertPriceBenchmark,
  deletePriceBenchmark,
  getCategoryTrends,
  upsertCategoryTrend,
  deleteCategoryTrend,
  getDemandSignals,
  upsertDemandSignal,
  deleteDemandSignal,
  initializeStorage,
  getSavedViews,
  upsertSavedView,
  deleteSavedView,
  getHiddenColumns,
  setHiddenColumns,
} from '@/lib/storage'
import { supabase, mapMerchantRow } from '@/lib/supabase'
import { computeMerchantHealth } from '@/lib/merchant-health'
import { generateId, cn, formatDate } from '@/lib/utils'
import type {
  Merchant,
  MerchantSegment,
  OutreachStatus,
  Priority,
  DigitalPresence,
  OperatingStatus,
  OutreachLog,
  Script,
  MaturityLevel,
  MerchantTier,
  PriceBenchmark,
  CategoryTrend,
  DiasporaDemandSignal,
  TrendDirection,
  Deal,
  DealStage,
  SavedView,
  FilterSnapshot,
  ColId,
} from '@/types'

// ─── Types & Helpers ──────────────────────────────────────────────────────────

type SortKey = keyof Pick<Merchant, 'name' | 'segment' | 'category' | 'city' | 'country' | 'digitalPresence' | 'outreachStatus' | 'priority' | 'lastContactDate'>
type SortDir = 'asc' | 'desc'

const OUTREACH_STATUSES: OutreachStatus[] = ['not-contacted', 'contacted', 'responded', 'interested', 'signed-up', 'declined', 'not-a-fit']
const PRIORITIES: Priority[] = ['high', 'medium', 'low']
const DIGITAL_PRESENCES: DigitalPresence[] = ['yes', 'partial', 'none']
const OPERATING_STATUSES: OperatingStatus[] = ['active', 'appears-active', 'unclear']
const SEGMENTS: MerchantSegment[] = [
  'liberia',
  'us-diaspora',
  'us-diaspora-minneapolis',
  'us-diaspora-atlanta',
  'us-diaspora-nyc',
  'us-diaspora-dc',
  'us-diaspora-philadelphia',
  'us-diaspora-providence',
  'us-diaspora-boston',
  'us-diaspora-charlotte',
  'us-diaspora-houston',
  'us-diaspora-columbus',
  'us-diaspora-newark',
]
const MATURITY_LEVELS: MaturityLevel[] = ['new-emerging', 'established', 'well-known']
const TIERS: MerchantTier[] = [1, 2, 3]

// ─── Pipeline Stage Groups ────────────────────────────────────────────────────
const FORWARD_STAGES: OutreachStatus[] = ['not-contacted', 'contacted', 'responded', 'interested', 'signed-up']
const EXIT_STAGES: OutreachStatus[] = ['declined', 'not-a-fit']

// ─── Column Definitions ───────────────────────────────────────────────────────
const ALL_COLUMNS: { id: ColId; label: string }[] = [
  { id: 'name', label: 'Name' },
  { id: 'segment', label: 'Segment' },
  { id: 'category', label: 'Category' },
  { id: 'city', label: 'City' },
  { id: 'country', label: 'Country' },
  { id: 'digital', label: 'Digital' },
  { id: 'status', label: 'Status' },
  { id: 'priority', label: 'Priority' },
  { id: 'lastContact', label: 'Last Contact' },
  { id: 'assignedTo', label: 'Assigned To' },
  { id: 'completeness', label: 'Completeness' },
  { id: 'health', label: 'Health' },
  { id: 'actions', label: 'Actions' },
]
const ALWAYS_VISIBLE: ColId[] = ['name', 'actions']

const SAVE_VIEW_EMOJIS = ['🏪', '🔥', '⭐', '📋', '🎯', '🚀', '💡', '📊']

const TIER_LABELS: Record<MerchantTier, string> = {
  1: 'Tier 1 — Highest Priority',
  2: 'Tier 2 — Medium Priority',
  3: 'Tier 3 — Lower Priority',
}

const TIER_COLORS: Record<MerchantTier, string> = {
  1: 'bg-coral/10 border-coral/30 text-coral',
  2: 'bg-brand-purple/10 border-brand-purple/30 text-brand-purple',
  3: 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-navy-500 dark:border-navy-400 dark:text-slate-300',
}

const outreachVariant = (s: OutreachStatus) => {
  const map: Record<OutreachStatus, 'secondary' | 'warning' | 'navy' | 'purple' | 'success' | 'danger'> = {
    'not-contacted': 'secondary',
    'contacted': 'warning',
    'responded': 'navy',
    'interested': 'purple',
    'signed-up': 'success',
    'declined': 'danger',
    'not-a-fit': 'secondary',
  }
  return map[s]
}

const outreachFunnelColor = (s: OutreachStatus) => {
  const map: Record<OutreachStatus, string> = {
    'not-contacted': 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    'contacted': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    'responded': 'bg-navy/10 text-navy dark:bg-navy/30 dark:text-blue-300',
    'interested': 'bg-brand-purple-light text-brand-purple dark:bg-purple-900/30 dark:text-purple-300',
    'signed-up': 'bg-brand-green-light text-brand-green dark:bg-green-900/30 dark:text-green-300',
    'declined': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    'not-a-fit': 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  }
  return map[s]
}

const priorityVariant = (p: Priority): 'default' | 'warning' | 'secondary' => {
  if (p === 'high') return 'default'
  if (p === 'medium') return 'warning'
  return 'secondary'
}

const digitalPresenceVariant = (d: DigitalPresence): 'success' | 'warning' | 'secondary' => {
  if (d === 'yes') return 'success'
  if (d === 'partial') return 'warning'
  return 'secondary'
}

const labelOf = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

// ─── Profile Completeness ─────────────────────────────────────────────────────

function getMerchantCompleteness(m: Merchant): number {
  const fields = [
    !!m.name,
    !!m.category,
    !!m.city,
    !!(m.whatsapp || m.phone),
    !!(m.instagram || m.facebook),
    !!m.email,
    !!m.notes,
    !!m.assignedScript,
    m.tags.length > 0,
    !!(m.outreachStatus && m.outreachStatus !== 'not-contacted'),
  ]
  return Math.round((fields.filter(Boolean).length / fields.length) * 100)
}

function isDueForFollowUp(m: Merchant): boolean {
  if (m.outreachStatus !== 'contacted' && m.outreachStatus !== 'responded') return false
  if (!m.lastContactDate) return false
  const last = new Date(m.lastContactDate)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays > 3
}

function daysSinceContact(m: Merchant): number {
  if (!m.lastContactDate) return 0
  const last = new Date(m.lastContactDate)
  const now = new Date()
  return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
}

function CompletenessBar({ pct, className }: { pct: number; className?: string }) {
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-navy-400 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn(
        'text-[10px] font-semibold tabular-nums',
        pct >= 80 ? 'text-green-600 dark:text-green-400' : pct >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400',
      )}>
        {pct}%
      </span>
    </div>
  )
}

// ─── Empty Merchant Template ──────────────────────────────────────────────────

function emptyMerchant(): Merchant {
  return {
    id: generateId(),
    name: '',
    segment: 'liberia',
    category: '',
    subcategory: '',
    city: '',
    country: 'Liberia',
    operatingStatus: 'active',
    digitalPresence: 'none',
    instagram: '',
    facebook: '',
    whatsapp: '',
    website: '',
    phone: '',
    email: '',
    notes: '',
    outreachStatus: 'not-contacted',
    lastContactDate: '',
    contactChannel: '',
    assignedScript: '',
    outreachLog: [],
    tags: [],
    priority: 'medium',
    createdAt: new Date().toISOString(),
  }
}

// ─── Pipeline Funnel ──────────────────────────────────────────────────────────

function PipelineFunnel({
  merchants,
  activeStage,
  onStageClick,
}: {
  merchants: Merchant[]
  activeStage: string
  onStageClick: (stage: OutreachStatus | null) => void
}) {
  const counts = OUTREACH_STATUSES.reduce((acc, s) => {
    acc[s] = merchants.filter(m => m.outreachStatus === s).length
    return acc
  }, {} as Record<OutreachStatus, number>)

  const stageLabel: Record<OutreachStatus, string> = {
    'not-contacted': 'Not Contacted',
    'contacted': 'Contacted',
    'responded': 'Responded',
    'interested': 'Interested',
    'signed-up': 'Signed Up',
    'declined': 'Declined',
    'not-a-fit': 'Not a Fit',
  }

  return (
    <div className="flex items-stretch gap-0 mb-6 flex-wrap">
      {/* Forward funnel — chevron chain */}
      <div className="flex items-stretch flex-1 min-w-0 gap-0">
        {FORWARD_STAGES.map((stage, i) => {
          const isActive = activeStage === stage
          return (
            <button
              key={stage}
              onClick={() => onStageClick(isActive ? null : stage)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-3 px-2 text-center transition-all border-y border-l first:rounded-l-xl first:border-l last:border-r',
                isActive
                  ? 'bg-coral text-white border-coral shadow-sm'
                  : cn('bg-white dark:bg-navy-600 border-slate-200 dark:border-navy-500 hover:bg-slate-50 dark:hover:bg-navy-500', outreachFunnelColor(stage)),
              )}
            >
              <span className={cn('text-xl font-bold leading-none', isActive ? 'text-white' : '')}>{counts[stage]}</span>
              <span className={cn('text-[10px] font-medium mt-1 leading-tight hidden sm:block', isActive ? 'text-white/90' : '')}>
                {stageLabel[stage]}
              </span>
              {i < FORWARD_STAGES.length - 1 && (
                <ChevronRight className={cn('absolute right-0 h-4 w-4 translate-x-1/2 z-10 hidden sm:block',
                  isActive ? 'text-coral' : 'text-slate-300 dark:text-navy-400'
                )} />
              )}
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div className="w-px bg-slate-200 dark:bg-navy-500 mx-2 hidden sm:block" />

      {/* Exit stages */}
      <div className="flex items-stretch gap-1">
        {EXIT_STAGES.map(stage => {
          const isActive = activeStage === stage
          return (
            <button
              key={stage}
              onClick={() => onStageClick(isActive ? null : stage)}
              className={cn(
                'flex flex-col items-center justify-center py-3 px-3 rounded-xl border transition-all',
                isActive
                  ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                  : 'bg-slate-50 dark:bg-navy-700 border-slate-200 dark:border-navy-500 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-500',
              )}
            >
              <span className="text-xl font-bold leading-none">{counts[stage]}</span>
              <span className="text-[10px] font-medium mt-1 leading-tight hidden sm:block">{stageLabel[stage]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Add / Edit Merchant Dialog ───────────────────────────────────────────────

interface MerchantFormDialogProps {
  open: boolean
  onClose: () => void
  initial?: Merchant
  onSave: (m: Merchant) => void
}

function MerchantFormDialog({ open, onClose, initial, onSave }: MerchantFormDialogProps) {
  const [form, setForm] = useState<Merchant>(initial ?? emptyMerchant())

  useEffect(() => {
    setForm(initial ?? emptyMerchant())
  }, [initial, open])

  const set = (field: keyof Merchant, val: unknown) =>
    setForm(prev => ({ ...prev, [field]: val }))

  const handleSave = () => {
    if (!form.name.trim()) { toast('Name is required', 'error'); return }
    if (!form.category.trim()) { toast('Category is required', 'error'); return }
    if (!form.city.trim()) { toast('City is required', 'error'); return }
    onSave(form)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Merchant' : 'Add Merchant'}</DialogTitle>
          <DialogDescription>Fill in the merchant details below.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2">
            <Label>Name *</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Business name" className="mt-1" />
          </div>
          <div>
            <Label>Segment *</Label>
            <Select value={form.segment} onValueChange={v => set('segment', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEGMENTS.map(s => <SelectItem key={s} value={s}>{labelOf(s)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Category *</Label>
            <Input value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Fashion" className="mt-1" />
          </div>
          <div>
            <Label>Subcategory</Label>
            <Input value={form.subcategory ?? ''} onChange={e => set('subcategory', e.target.value)} placeholder="Optional" className="mt-1" />
          </div>
          <div>
            <Label>City *</Label>
            <Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Monrovia" className="mt-1" />
          </div>
          <div>
            <Label>Country</Label>
            <Input value={form.country} onChange={e => set('country', e.target.value)} placeholder="e.g. Liberia" className="mt-1" />
          </div>
          <div>
            <Label>Operating Status</Label>
            <Select value={form.operatingStatus} onValueChange={v => set('operatingStatus', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {OPERATING_STATUSES.map(s => <SelectItem key={s} value={s}>{labelOf(s)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Digital Presence</Label>
            <Select value={form.digitalPresence} onValueChange={v => set('digitalPresence', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DIGITAL_PRESENCES.map(d => <SelectItem key={d} value={d}>{labelOf(d)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Outreach Status</Label>
            <Select value={form.outreachStatus} onValueChange={v => set('outreachStatus', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {OUTREACH_STATUSES.map(s => <SelectItem key={s} value={s}>{labelOf(s)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={v => set('priority', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map(p => <SelectItem key={p} value={p}>{labelOf(p)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Instagram</Label>
            <Input value={form.instagram ?? ''} onChange={e => set('instagram', e.target.value)} placeholder="@handle or URL" className="mt-1" />
          </div>
          <div>
            <Label>Facebook</Label>
            <Input value={form.facebook ?? ''} onChange={e => set('facebook', e.target.value)} placeholder="@handle or URL" className="mt-1" />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input value={form.whatsapp ?? ''} onChange={e => set('whatsapp', e.target.value)} placeholder="+1234567890" className="mt-1" />
          </div>
          <div>
            <Label>Website</Label>
            <Input value={form.website ?? ''} onChange={e => set('website', e.target.value)} placeholder="https://..." className="mt-1" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="+1234567890" className="mt-1" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="email@example.com" className="mt-1" />
          </div>
          <div>
            <Label>Assigned To</Label>
            <Input value={form.assignedTo ?? ''} onChange={e => set('assignedTo', e.target.value)} placeholder="team@example.com" className="mt-1" />
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes..." className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{initial ? 'Save Changes' : 'Add Merchant'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Import CSV Dialog ────────────────────────────────────────────────────────

function ImportDialog({ open, onClose, onImport }: { open: boolean; onClose: () => void; onImport: (merchants: Merchant[]) => void }) {
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [parsed, setParsed] = useState<Record<string, string>[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setParsed(result.data)
        setPreview(result.data.slice(0, 5))
      },
    })
  }

  const handleImport = () => {
    const merchants: Merchant[] = parsed.map(row => ({
      id: generateId(),
      name: row.name ?? '',
      segment: (row.segment as MerchantSegment) ?? 'liberia',
      category: row.category ?? '',
      subcategory: row.subcategory ?? '',
      city: row.city ?? '',
      country: row.country ?? 'Liberia',
      operatingStatus: (row.operatingStatus as OperatingStatus) ?? 'active',
      digitalPresence: (row.digitalPresence as DigitalPresence) ?? 'none',
      instagram: row.instagram ?? '',
      facebook: row.facebook ?? '',
      whatsapp: row.whatsapp ?? '',
      website: row.website ?? '',
      phone: row.phone ?? '',
      email: row.email ?? '',
      notes: row.notes ?? '',
      outreachStatus: (row.outreachStatus as OutreachStatus) ?? 'not-contacted',
      lastContactDate: row.lastContactDate ?? '',
      contactChannel: row.contactChannel ?? '',
      assignedScript: row.assignedScript ?? '',
      outreachLog: [],
      tags: row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      priority: (row.priority as Priority) ?? 'medium',
      createdAt: new Date().toISOString(),
    }))
    onImport(merchants)
    onClose()
    setParsed([])
    setPreview([])
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Merchants from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns: <code className="bg-gray-100 dark:bg-navy-500 px-1 rounded text-xs">name, segment, category, city, country, outreachStatus, priority</code> (all other fields optional).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-coral/10 file:text-coral hover:file:bg-coral/20 cursor-pointer" />
          {preview.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-navy-500">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-navy-600">
                  <tr>
                    {Object.keys(preview[0]).map(col => (
                      <th key={col} className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-navy-500">
                  {preview.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-navy-600/50">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-3 py-2 text-slate-700 dark:text-slate-300 max-w-[120px] truncate">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.length > 5 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 px-3 py-2 border-t border-gray-100 dark:border-navy-500">
                  Showing 5 of {parsed.length} rows
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport} disabled={parsed.length === 0}>
            Import {parsed.length > 0 ? `${parsed.length} merchant${parsed.length !== 1 ? 's' : ''}` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Merchant Detail Slide-Over ───────────────────────────────────────────────

interface SlideOverProps {
  merchant: Merchant | null
  scripts: Script[]
  currentUserEmail?: string
  allAssignees?: string[]
  onClose: () => void
  onUpdate: (m: Merchant) => void
  onDelete: (id: string) => void
}

function MerchantSlideOver({ merchant, scripts, currentUserEmail, allAssignees = [], onClose, onUpdate, onDelete }: SlideOverProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Merchant | null>(null)
  const [logNote, setLogNote] = useState('')
  const [logChannel, setLogChannel] = useState('')
  const [showLogForm, setShowLogForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copied, setCopied] = useState(false)
  const [linkedTaskCount, setLinkedTaskCount] = useState(0)

  useEffect(() => {
    if (!merchant) return
    // Count all project cards linked to this merchant across all boards
    const boards = getProjectBoards()
    let total = 0
    boards.forEach(b => {
      const cards = getCardsForBoard(b.id)
      total += cards.filter(c => c.linkedMerchantId === merchant.id && c.status !== 'done').length
    })
    setLinkedTaskCount(total)
  }, [merchant?.id])

  useEffect(() => {
    if (merchant) {
      setForm({ ...merchant })
      setEditing(false)
      setConfirmDelete(false)
      setShowLogForm(false)
    }
  }, [merchant])

  if (!merchant || !form) return null

  const set = (field: keyof Merchant, val: unknown) =>
    setForm(prev => prev ? { ...prev, [field]: val } : prev)

  const completeness = getMerchantCompleteness(merchant)
  const due = isDueForFollowUp(merchant)
  const daysSince = daysSinceContact(merchant)

  const missing: string[] = []
  if (!merchant.whatsapp && !merchant.phone) missing.push('Phone/WhatsApp')
  if (!merchant.instagram && !merchant.facebook) missing.push('Social media')
  if (!merchant.email) missing.push('Email')
  if (!merchant.notes) missing.push('Notes')
  if (!merchant.assignedScript) missing.push('Assigned script')

  const handleSave = () => {
    if (!form) return
    onUpdate(form)
    setEditing(false)
    toast('Merchant saved')
  }

  const handleStatusChange = (status: OutreachStatus) => {
    const updated = { ...form, outreachStatus: status }
    setForm(updated)
    onUpdate(updated)

    // Integration hook: signed-up → auto-close any linked open deal
    if (status === 'signed-up') {
      const allDeals = getDeals()
      const linked = allDeals.find(d => d.merchantId === form!.id && d.stage !== 'closed-won' && d.stage !== 'closed-lost')
      if (linked) {
        const now = new Date().toISOString()
        upsertDeal({
          ...linked,
          stage: 'closed-won',
          probability: 100,
          weightedValue: linked.dealValueUSD,
          updatedAt: now,
          activities: [
            ...linked.activities,
            {
              id: `act-${Date.now()}`,
              type: 'stage-change',
              note: `Auto-closed: merchant signed up on LeenqUp`,
              by: 'System',
              createdAt: now,
              oldStage: linked.stage,
              newStage: 'closed-won' as DealStage,
            },
          ],
        })
        logCRMActivity({ merchantId: form!.id, dealId: linked.id, type: 'signed-up', description: `${form!.name} signed up — deal auto-closed as Won`, by: 'System' })
        toast(`Deal closed as Won for ${form!.name}!`)
      } else {
        toast(`Status updated to Signed Up`)
      }
    } else if (status === 'interested') {
      // Integration hook: interested → prompt to create a deal
      toast(`${form!.name} is interested — create a deal in CRM Pipeline`)
      logCRMActivity({ merchantId: form!.id, type: 'stage-change', description: `Status changed to Interested`, by: 'You' })
    } else {
      toast(`Status updated to ${labelOf(status)}`)
    }
  }

  const handleNotesBlur = () => {
    onUpdate(form)
  }

  const handleAddLog = () => {
    if (!logNote.trim()) { toast('Note is required', 'error'); return }
    const entry: OutreachLog = {
      date: new Date().toISOString(),
      channel: logChannel,
      note: logNote,
    }
    const updated = { ...form, outreachLog: [...(form.outreachLog ?? []), entry] }
    setForm(updated)
    onUpdate(updated)
    // Mirror to CRM global activity feed
    logCRMActivity({
      merchantId: form.id,
      type: 'outreach',
      description: `[${logChannel || 'General'}] ${logNote}`,
      by: 'You',
    })
    setLogNote('')
    setLogChannel('')
    setShowLogForm(false)
    toast('Log entry added')
  }

  const handleMarkContactedToday = () => {
    const today = new Date().toISOString().slice(0, 10)
    const updated = { ...form, lastContactDate: today }
    setForm(updated)
    onUpdate(updated)
    toast('Marked as contacted today')
  }

  const handleCopyContact = () => {
    const parts = [
      merchant.whatsapp && `WhatsApp: ${merchant.whatsapp}`,
      merchant.email && `Email: ${merchant.email}`,
      merchant.instagram && `Instagram: ${merchant.instagram}`,
    ].filter(Boolean).join('\n')
    navigator.clipboard.writeText(parts).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast('Contact info copied')
    })
  }

  const handleExportRecord = () => {
    const blob = new Blob([JSON.stringify(merchant, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `merchant-${merchant.name.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = () => {
    onDelete(merchant.id)
    onClose()
    toast('Merchant deleted')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[560px] bg-white dark:bg-navy-600 shadow-2xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-navy-500">
          <div className="flex-1 min-w-0 pr-3">
            <h2 className="text-xl font-bold text-navy dark:text-white">{merchant.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={outreachVariant(merchant.outreachStatus)}>{labelOf(merchant.outreachStatus)}</Badge>
              <Badge variant={priorityVariant(merchant.priority)}>{labelOf(merchant.priority)} priority</Badge>
              {due && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <AlertTriangle className="h-2.5 w-2.5" /> Due for follow-up
                </Badge>
              )}
            </div>
            {/* Profile completeness */}
            <div className="mt-3">
              <p className="text-xs text-slate-400 mb-1">
                Profile {completeness}% complete
                {missing.length > 0 && (
                  <span className="text-slate-400"> — missing: {missing.join(', ')}</span>
                )}
              </p>
              <CompletenessBar pct={completeness} />
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-navy-500 transition-colors shrink-0">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Seller Dashboard CTA */}
          {merchant.outreachStatus === 'signed-up' && (
            <button
              onClick={() => { onClose(); router.push(`/merchants/${merchant.id}`) }}
              className="w-full flex items-center justify-between bg-brand-green/10 border border-brand-green/30 rounded-lg px-4 py-3 hover:bg-brand-green/20 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-brand-green" />
                <span className="text-sm font-medium text-brand-green">View Seller Dashboard</span>
              </div>
              <ChevronRight className="h-4 w-4 text-brand-green opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Linked Tasks */}
          {linkedTaskCount > 0 && (
            <button
              onClick={() => { onClose(); router.push('/projects') }}
              className="w-full flex items-center justify-between bg-brand-purple/5 border border-brand-purple/20 rounded-lg px-4 py-3 hover:bg-brand-purple/10 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-brand-purple" />
                <span className="text-sm font-medium text-brand-purple">
                  {linkedTaskCount} open task{linkedTaskCount !== 1 ? 's' : ''} in Projects
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-brand-purple opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Follow-up alert box */}
          {due && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-4 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Follow-up due — last contacted {daysSince} day{daysSince !== 1 ? 's' : ''} ago
                </p>
              </div>
              <RoleGate roles={['admin', 'editor']}>
                <Button size="sm" variant="secondary" onClick={handleMarkContactedToday} className="shrink-0">
                  Mark as Contacted Today
                </Button>
              </RoleGate>
            </div>
          )}

          {/* Core Fields */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Details</h3>
              <RoleGate roles={['admin', 'editor']}>
                {!editing ? (
                  <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => { setEditing(false); setForm({ ...merchant }) }}>Cancel</Button>
                    <Button size="sm" onClick={handleSave}><Check className="h-3.5 w-3.5" /> Save</Button>
                  </div>
                )}
              </RoleGate>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {editing ? (
                <>
                  <div>
                    <Label className="text-xs text-slate-500">Name</Label>
                    <Input value={form.name} onChange={e => set('name', e.target.value)} className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Segment</Label>
                    <Select value={form.segment} onValueChange={v => set('segment', v)}>
                      <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{SEGMENTS.map(s => <SelectItem key={s} value={s}>{labelOf(s)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Category</Label>
                    <Input value={form.category} onChange={e => set('category', e.target.value)} className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">City</Label>
                    <Input value={form.city} onChange={e => set('city', e.target.value)} className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Country</Label>
                    <Input value={form.country} onChange={e => set('country', e.target.value)} className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Operating Status</Label>
                    <Select value={form.operatingStatus} onValueChange={v => set('operatingStatus', v)}>
                      <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{OPERATING_STATUSES.map(s => <SelectItem key={s} value={s}>{labelOf(s)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Digital Presence</Label>
                    <Select value={form.digitalPresence} onValueChange={v => set('digitalPresence', v)}>
                      <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{DIGITAL_PRESENCES.map(d => <SelectItem key={d} value={d}>{labelOf(d)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Priority</Label>
                    <Select value={form.priority} onValueChange={v => set('priority', v)}>
                      <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{labelOf(p)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-slate-500">Assigned To</Label>
                    <Input
                      value={form.assignedTo ?? ''}
                      onChange={e => set('assignedTo', e.target.value)}
                      placeholder="email@example.com"
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  <FieldRow label="Segment" value={labelOf(merchant.segment)} />
                  <FieldRow label="Category" value={merchant.category} />
                  <FieldRow label="City" value={merchant.city} />
                  <FieldRow label="Country" value={merchant.country} />
                  <FieldRow label="Operating Status" value={labelOf(merchant.operatingStatus)} />
                  <FieldRow label="Digital Presence" value={<Badge variant={digitalPresenceVariant(merchant.digitalPresence)}>{labelOf(merchant.digitalPresence)}</Badge>} />
                  <FieldRow label="Assigned To" value={
                    merchant.assignedTo
                      ? <span className="flex items-center gap-1"><UserCircle className="h-3.5 w-3.5 text-slate-400" />{merchant.assignedTo.split('@')[0]}</span>
                      : '—'
                  } />
                </>
              )}
            </div>
          </section>

          {/* Contact Info */}
          <section>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Contact</h3>
            {editing ? (
              <div className="grid grid-cols-2 gap-3">
                {(['instagram', 'facebook', 'whatsapp', 'website', 'phone', 'email'] as const).map(field => (
                  <div key={field}>
                    <Label className="text-xs text-slate-500 capitalize">{field}</Label>
                    <Input value={(form[field] as string) ?? ''} onChange={e => set(field, e.target.value)} className="mt-1 h-8 text-sm" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {merchant.instagram && (
                  <ContactLink icon={<ExternalLink className="h-4 w-4" />} label="Instagram" href={merchant.instagram.startsWith('http') ? merchant.instagram : `https://instagram.com/${merchant.instagram.replace('@', '')}`} display={merchant.instagram} />
                )}
                {merchant.facebook && (
                  <ContactLink icon={<ExternalLink className="h-4 w-4" />} label="Facebook" href={merchant.facebook.startsWith('http') ? merchant.facebook : `https://facebook.com/${merchant.facebook}`} display={merchant.facebook} />
                )}
                {merchant.whatsapp && (
                  <ContactLink icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" href={`https://wa.me/${merchant.whatsapp.replace(/\D/g, '')}`} display={merchant.whatsapp} />
                )}
                {merchant.website && (
                  <ContactLink icon={<Globe className="h-4 w-4" />} label="Website" href={merchant.website} display={merchant.website} />
                )}
                {merchant.phone && (
                  <ContactLink icon={<Phone className="h-4 w-4" />} label="Phone" href={`tel:${merchant.phone}`} display={merchant.phone} />
                )}
                {merchant.email && (
                  <ContactLink icon={<Mail className="h-4 w-4" />} label="Email" href={`mailto:${merchant.email}`} display={merchant.email} />
                )}
                {!merchant.instagram && !merchant.facebook && !merchant.whatsapp && !merchant.website && !merchant.phone && !merchant.email && (
                  <p className="text-sm text-slate-400">No contact info recorded.</p>
                )}
                {/* WhatsApp Deep Link CTA */}
                {(merchant.whatsapp || merchant.phone) && (() => {
                  const rawPhone = (merchant.whatsapp || merchant.phone || '').replace(/\D/g, '')
                  const assignedScript = scripts.find(s => s.id === merchant.assignedScript)
                  const bestScript = assignedScript ?? scripts.find(s =>
                    s.channel === 'whatsapp' && (
                      s.persona === 'general-merchant' ||
                      (merchant.category?.toLowerCase().includes('food') && s.persona === 'food-vendor') ||
                      (merchant.category?.toLowerCase().includes('fashion') && s.persona === 'fashion-seller') ||
                      (merchant.category?.toLowerCase().includes('beauty') && s.persona === 'beauty-business')
                    )
                  ) ?? scripts.find(s => s.channel === 'whatsapp')
                  const messageText = bestScript
                    ? bestScript.body.replace(/\[merchant name\]/gi, merchant.name).replace(/\[name\]/gi, merchant.name)
                    : `Hi ${merchant.name}, I'm reaching out from LeenqUp marketplace. We'd love to have you join as a seller!`
                  const waUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(messageText)}`
                  return (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 w-full flex items-center justify-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 text-[#128C7E] dark:text-[#25D366] rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[#25D366]/20 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Send WhatsApp Message
                      {bestScript && <span className="text-xs opacity-70 ml-1">· {bestScript.title.slice(0, 28)}{bestScript.title.length > 28 ? '…' : ''}</span>}
                    </a>
                  )
                })()}
              </div>
            )}
          </section>

          {/* Notes */}
          <section>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Notes</h3>
            <Textarea
              value={form.notes ?? ''}
              onChange={e => set('notes', e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add notes about this merchant..."
              className="text-sm min-h-[80px]"
            />
          </section>

          {/* Outreach */}
          <section>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Outreach</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-slate-500">Current Status</Label>
                <Select value={form.outreachStatus} onValueChange={v => handleStatusChange(v as OutreachStatus)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OUTREACH_STATUSES.map(s => <SelectItem key={s} value={s}>{labelOf(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-500">Last Contact Date</Label>
                  {editing ? (
                    <Input type="date" value={form.lastContactDate ?? ''} onChange={e => set('lastContactDate', e.target.value)} className="mt-1 h-8 text-sm" />
                  ) : (
                    <p className="mt-1 text-sm text-navy dark:text-white">{merchant.lastContactDate ? formatDate(merchant.lastContactDate) : '—'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Contact Channel</Label>
                  {editing ? (
                    <Input value={form.contactChannel ?? ''} onChange={e => set('contactChannel', e.target.value)} placeholder="e.g. WhatsApp" className="mt-1 h-8 text-sm" />
                  ) : (
                    <p className="mt-1 text-sm text-navy dark:text-white">{merchant.contactChannel || '—'}</p>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Assigned Script</Label>
                <Select
                  value={form.assignedScript ?? ''}
                  onValueChange={v => {
                    const val = v === '__none__' ? '' : v
                    set('assignedScript', val)
                    const updated = { ...form, assignedScript: val }
                    onUpdate(updated)
                  }}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select a script..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {scripts.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.assignedScript && form.assignedScript !== '__none__' && (
                  <a href="/scripts" className="inline-flex items-center gap-1 text-xs text-coral mt-1 hover:underline">
                    View script <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Assigned To — quick-assign without entering Edit mode */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-slate-500">Assigned To</Label>
                  {currentUserEmail && form.assignedTo !== currentUserEmail && (
                    <button
                      onClick={() => {
                        const updated = { ...form, assignedTo: currentUserEmail }
                        setForm(updated)
                        onUpdate(updated)
                        toast('Assigned to you')
                      }}
                      className="text-xs text-coral hover:underline"
                    >
                      Assign to Me
                    </button>
                  )}
                </div>
                <Select
                  value={form.assignedTo || '__none__'}
                  onValueChange={v => {
                    const val = v === '__none__' ? '' : v
                    const updated = { ...form, assignedTo: val }
                    setForm(updated)
                    onUpdate(updated)
                  }}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {currentUserEmail && (
                      <SelectItem value={currentUserEmail}>
                        Me ({currentUserEmail.split('@')[0]})
                      </SelectItem>
                    )}
                    {allAssignees
                      .filter(e => e !== currentUserEmail)
                      .map(email => (
                        <SelectItem key={email} value={email}>
                          {email.split('@')[0]}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Intelligence Data */}
          {(merchant.tier != null || merchant.maturityLevel || merchant.isLibdeliveryPartner || merchant.shipsToLiberia || merchant.tripAdvisorRating != null || merchant.ownershipSignal || merchant.currentMarketplacePlatform || merchant.intelligenceId || merchant.county || merchant.address || merchant.trueliberiaUrl) && (
            <section>
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Intelligence</h3>
              <div className="rounded-lg border border-gray-100 dark:border-navy-500 p-4 space-y-3 bg-gray-50 dark:bg-navy-500/30">
                <div className="flex flex-wrap gap-2">
                  {merchant.tier != null && (
                    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border', TIER_COLORS[merchant.tier])}>
                      Tier {merchant.tier}
                    </span>
                  )}
                  {merchant.maturityLevel && (
                    <span className="inline-flex items-center text-xs font-semibold bg-navy/10 text-navy dark:bg-white/10 dark:text-white px-2.5 py-1 rounded-full">
                      {labelOf(merchant.maturityLevel)}
                    </span>
                  )}
                  {merchant.isLibdeliveryPartner && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2.5 py-1 rounded-full">
                      <Package className="h-3 w-3" /> LIBdelivery Partner
                    </span>
                  )}
                  {merchant.shipsToLiberia && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2.5 py-1 rounded-full">
                      <Truck className="h-3 w-3" /> Ships to Liberia
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {merchant.intelligenceId && <FieldRow label="Research ID" value={merchant.intelligenceId} />}
                  {merchant.tripAdvisorRating != null && (
                    <FieldRow label="TripAdvisor" value={
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {merchant.tripAdvisorRating.toFixed(1)}
                        {merchant.tripAdvisorReviews != null && <span className="text-slate-400 text-xs">({merchant.tripAdvisorReviews} reviews)</span>}
                      </span>
                    } />
                  )}
                  {merchant.currentMarketplacePlatform && <FieldRow label="Current Platform" value={merchant.currentMarketplacePlatform} />}
                  {merchant.ownershipSignal && <FieldRow label="Ownership Signal" value={<span className="text-xs leading-snug">{merchant.ownershipSignal}</span>} />}
                  {merchant.yelpUrl && (
                    <FieldRow label="Yelp" value={
                      <a href={merchant.yelpUrl} target="_blank" rel="noopener noreferrer" className="text-coral hover:underline text-xs flex items-center gap-1">
                        View on Yelp <ExternalLink className="h-3 w-3" />
                      </a>
                    } />
                  )}
                  {merchant.county && <FieldRow label="County" value={merchant.county} />}
                  {merchant.address && <FieldRow label="Address" value={<span className="text-xs leading-snug">{merchant.address}</span>} />}
                  {merchant.trueliberiaUrl && (
                    <FieldRow label="TrueLiberia" value={
                      <a href={merchant.trueliberiaUrl} target="_blank" rel="noopener noreferrer" className="text-coral hover:underline text-xs flex items-center gap-1">
                        View listing <ExternalLink className="h-3 w-3" />
                      </a>
                    } />
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Outreach Log */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Outreach Log</h3>
              <RoleGate roles={['admin', 'editor']}>
                <Button size="sm" variant="secondary" onClick={() => setShowLogForm(v => !v)}>
                  <Plus className="h-3.5 w-3.5" /> Add Entry
                </Button>
              </RoleGate>
            </div>

            {showLogForm && (
              <div className="rounded-lg border border-gray-200 dark:border-navy-500 p-3 mb-3 space-y-2 bg-gray-50 dark:bg-navy-500/50">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-slate-500">Channel</Label>
                    <Input value={logChannel} onChange={e => setLogChannel(e.target.value)} placeholder="e.g. WhatsApp" className="mt-1 h-8 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Note</Label>
                  <Textarea value={logNote} onChange={e => setLogNote(e.target.value)} placeholder="What happened in this interaction?" className="mt-1 text-sm min-h-[60px]" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="secondary" onClick={() => setShowLogForm(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleAddLog}>Save Entry</Button>
                </div>
              </div>
            )}

            {(form.outreachLog ?? []).length === 0 ? (
              <p className="text-sm text-slate-400">No log entries yet.</p>
            ) : (
              <div className="space-y-3">
                {[...(form.outreachLog ?? [])].reverse().map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-coral mt-1.5 shrink-0" />
                      {i < (form.outreachLog ?? []).length - 1 && <div className="w-0.5 bg-gray-200 dark:bg-navy-500 flex-1 mt-1" />}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-navy dark:text-white">{entry.channel || 'General'}</span>
                        <span className="text-xs text-slate-400">{formatDate(entry.date)}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{entry.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-navy-500 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={handleCopyContact}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy Contact'}
          </Button>
          <Button size="sm" variant="secondary" onClick={handleExportRecord}>
            <Download className="h-3.5 w-3.5" /> Export JSON
          </Button>
          <RoleGate roles={['admin', 'editor']}>
            {confirmDelete ? (
              <div className="flex gap-2 ml-auto">
                <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                <Button size="sm" variant="destructive" onClick={handleDelete}>Confirm Delete</Button>
              </div>
            ) : (
              <Button size="sm" variant="destructive" className="ml-auto" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            )}
          </RoleGate>
        </div>
      </div>
    </>
  )
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <div className="text-sm font-medium text-navy dark:text-white mt-0.5">{value || '—'}</div>
    </div>
  )
}

function ContactLink({ icon, label, href, display }: { icon: React.ReactNode; label: string; href: string; display: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-coral hover:underline"
    >
      <span className="text-slate-400">{icon}</span>
      <span className="text-slate-500 dark:text-slate-400 w-20 shrink-0">{label}</span>
      <span className="truncate">{display}</span>
      <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
    </a>
  )
}

// ─── Tier View ────────────────────────────────────────────────────────────────

function TierView({ merchants, onSelect }: { merchants: Merchant[]; onSelect: (m: Merchant) => void }) {
  const tiered = TIERS.map(t => ({
    tier: t,
    merchants: merchants.filter(m => m.tier === t),
  }))
  const untiered = merchants.filter(m => !m.tier)

  return (
    <div className="space-y-6">
      {tiered.map(({ tier, merchants: group }) => (
        <div key={tier}>
          <div className={cn(
            'flex items-center gap-3 mb-3 px-4 py-2 rounded-lg border font-semibold text-sm',
            TIER_COLORS[tier],
          )}>
            <span className="tabular-nums font-bold text-base">{group.length}</span>
            <span>{TIER_LABELS[tier]}</span>
          </div>
          {group.length === 0 ? (
            <p className="text-xs text-slate-400 pl-4">No merchants in this tier.</p>
          ) : (
            <div className="space-y-1.5">
              {group.map(m => {
                const due = isDueForFollowUp(m)
                return (
                  <div
                    key={m.id}
                    onClick={() => onSelect(m)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg border bg-white dark:bg-navy-600 cursor-pointer hover:shadow-sm transition-shadow',
                      due ? 'border-l-4 border-l-amber-400 border-amber-200 dark:border-amber-700' : 'border-gray-100 dark:border-navy-500',
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-navy dark:text-white text-sm truncate">{m.name}</span>
                        {m.isLibdeliveryPartner && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-1.5 py-0.5 rounded-full">
                            <Package className="h-2.5 w-2.5" /> LIBdelivery
                          </span>
                        )}
                        {m.shipsToLiberia && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                            <Truck className="h-2.5 w-2.5" /> Ships to LR
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {m.category} · {m.city}{m.maturityLevel ? ` · ${labelOf(m.maturityLevel)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {m.tripAdvisorRating != null && (
                        <span className="flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{m.tripAdvisorRating.toFixed(1)}
                        </span>
                      )}
                      <Badge variant={outreachVariant(m.outreachStatus)} className="text-[10px]">{labelOf(m.outreachStatus)}</Badge>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
      {untiered.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3 px-4 py-2 rounded-lg border border-dashed border-slate-200 dark:border-navy-500 text-sm text-slate-500 dark:text-slate-400">
            <span className="tabular-nums font-bold text-base">{untiered.length}</span>
            <span>Untiered — assign a tier to prioritize</span>
          </div>
          <div className="space-y-1.5">
            {untiered.map(m => (
              <div
                key={m.id}
                onClick={() => onSelect(m)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-100 dark:border-navy-500 bg-white dark:bg-navy-600 cursor-pointer hover:shadow-sm transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-navy dark:text-white text-sm truncate">{m.name}</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{m.category} · {m.city}</p>
                </div>
                <Badge variant={outreachVariant(m.outreachStatus)} className="text-[10px]">{labelOf(m.outreachStatus)}</Badge>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Bulk Outreach Tool ───────────────────────────────────────────────────────

interface BulkOutreachProps {
  merchants: Merchant[]
  scripts: Script[]
  onClose: () => void
}

function BulkOutreachTool({ merchants, scripts, onClose }: BulkOutreachProps) {
  const [selectedScriptId, setSelectedScriptId] = useState<string>(scripts[0]?.id ?? '')
  const [generated, setGenerated] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const waScripts = scripts.filter(s => s.channel === 'whatsapp')

  // Use the pre-filtered merchant list from the main page — only include those with phone/WA
  const filtered = merchants.filter(m => !!(m.whatsapp || m.phone))

  const selectedScript = scripts.find(s => s.id === selectedScriptId)

  const buildMessage = (m: Merchant): string => {
    if (!selectedScript) return `Hi ${m.name}, I'm from LeenqUp marketplace. We'd love to have you join as a seller!`
    return selectedScript.body
      .replace(/\[merchant name\]/gi, m.name)
      .replace(/\[name\]/gi, m.name)
      .replace(/\[city\]/gi, m.city)
      .replace(/\[category\]/gi, m.category)
  }

  const buildWaUrl = (m: Merchant): string => {
    const phone = (m.whatsapp || m.phone || '').replace(/\D/g, '')
    return `https://wa.me/${phone}?text=${encodeURIComponent(buildMessage(m))}`
  }

  const handleCopyMessage = async (m: Merchant) => {
    await navigator.clipboard.writeText(buildMessage(m))
    setCopiedId(m.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleExportHTML = () => {
    const rows = filtered.map(m => {
      const url = buildWaUrl(m)
      const msg = buildMessage(m)
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-weight:600">${m.name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#666">${m.category} · ${m.city}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#666">${labelOf(m.outreachStatus)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee">
            <a href="${url}" target="_blank" style="display:inline-block;background:#25D366;color:white;padding:6px 14px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">
              Open in WhatsApp
            </a>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:12px;color:#888;max-width:300px">${msg.slice(0, 120)}…</td>
        </tr>`
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>LeenqUp Bulk Outreach — ${new Date().toLocaleDateString()}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; background: #f8f9fa; }
    h1 { color: #1E2A4A; font-size: 20px; margin-bottom: 4px; }
    p { color: #666; margin-bottom: 20px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    th { background: #1E2A4A; color: white; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; }
    tr:hover td { background: #f0f4ff; }
    .progress { display: inline-block; background: #eee; border-radius: 4px; padding: 2px 8px; font-size: 12px; }
  </style>
</head>
<body>
  <h1>🚀 LeenqUp Bulk Outreach Campaign</h1>
  <p>Generated ${new Date().toLocaleString()} · ${filtered.length} merchants · Script: <strong>${selectedScript?.title ?? 'Custom'}</strong></p>
  <table>
    <thead>
      <tr>
        <th>Merchant</th>
        <th>Category / City</th>
        <th>Status</th>
        <th>Action</th>
        <th>Message Preview</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="margin-top:16px;font-size:12px;color:#aaa">After each conversation, update the merchant status in LeenqUp Ops.</p>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leenqup-outreach-${new Date().toISOString().slice(0, 10)}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast(`Exported ${filtered.length} merchant outreach links`)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-end">
      <div className="h-full w-full max-w-[640px] bg-white dark:bg-navy-600 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-navy-500">
          <div>
            <h2 className="text-lg font-bold text-navy dark:text-white">Bulk WhatsApp Outreach</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Using your active page filters · {merchants.length} merchant{merchants.length !== 1 ? 's' : ''} in scope
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-500 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Script Picker */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-500 space-y-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">WhatsApp Script Template</label>
            <Select value={selectedScriptId} onValueChange={setSelectedScriptId}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select a script…" /></SelectTrigger>
              <SelectContent>
                {waScripts.length === 0
                  ? <SelectItem value="__none__" disabled>No WhatsApp scripts found</SelectItem>
                  : waScripts.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)
                }
                {scripts.filter(s => s.channel !== 'whatsapp').map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.title} ({s.channel})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedScript && (
              <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 italic">{selectedScript.body.slice(0, 100)}…</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold text-navy dark:text-white">
              {filtered.length} merchant{filtered.length !== 1 ? 's' : ''} with WhatsApp/phone
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={handleExportHTML} disabled={filtered.length === 0} className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export HTML
              </Button>
              <Button size="sm" onClick={() => setGenerated(true)} disabled={filtered.length === 0} className="gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" />
                Generate Links
              </Button>
            </div>
          </div>
        </div>

        {/* Merchant list */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400 italic">
              None of the currently filtered merchants have a phone or WhatsApp number. Adjust your page filters to include merchants with contact info.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((m, idx) => {
                const waUrl = buildWaUrl(m)
                const msg = buildMessage(m)
                return (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-navy-500 hover:border-[#25D366]/40 transition-all bg-white dark:bg-navy-600">
                    <span className="text-xs font-mono text-slate-400 w-6 shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy dark:text-white truncate">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.category} · {m.city}</p>
                    </div>
                    <Badge variant={outreachVariant(m.outreachStatus)} className="text-[10px] shrink-0">
                      {labelOf(m.outreachStatus)}
                    </Badge>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCopyMessage(m)}
                        title="Copy personalized message"
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-navy-500 text-slate-500 dark:text-slate-300 hover:text-navy dark:hover:text-white transition-colors"
                      >
                        {copiedId === m.id ? <Check className="h-3.5 w-3.5 text-brand-green" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open in WhatsApp"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/10 text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/20 transition-colors text-xs font-semibold"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MerchantsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [scripts, setScripts] = useState<Script[]>([])
  const [search, setSearch] = useState('')
  const [filterSegment, setFilterSegment] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterDigital, setFilterDigital] = useState('all')
  const [filterTier, setFilterTier] = useState('all')
  const [filterLibdelivery, setFilterLibdelivery] = useState('all')
  const [filterShipsToLiberia, setFilterShipsToLiberia] = useState('all')
  const [filterCounty, setFilterCounty] = useState('all')
  const [filterSource, setFilterSource] = useState('all')
  const [filterCountry, setFilterCountry] = useState('all')
  const [filterContactMethod, setFilterContactMethod] = useState('all')
  const [filterHealth, setFilterHealth] = useState<'all' | 'healthy' | 'at-risk' | 'critical'>('all')
  const [filterAssignedTo, setFilterAssignedTo] = useState('')
  // Advanced filter panel toggle
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  // Saved views
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [activeViewId, setActiveViewId] = useState<string>('view_all')
  const [showSaveViewDialog, setShowSaveViewDialog] = useState(false)
  const [saveViewName, setSaveViewName] = useState('')
  const [saveViewEmoji, setSaveViewEmoji] = useState('🏪')
  // Column customization
  const [hiddenCols, setHiddenColsState] = useState<ColId[]>([])
  const [showColMenu, setShowColMenu] = useState(false)
  const colMenuRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<'table' | 'tier'>('table')
  // Virtual pagination — how many filtered rows to display (load more on scroll)
  const [displayCount, setDisplayCount] = useState(50)
  const loaderRef = useRef<HTMLDivElement>(null)
  const [mainTab, setMainTab] = useState<'directory' | 'intel' | 'demand'>('directory')

  // Market Intelligence state
  const [benchmarks, setBenchmarks] = useState<PriceBenchmark[]>([])
  const [trends, setTrends] = useState<CategoryTrend[]>([])
  const [demandSignals, setDemandSignals] = useState<DiasporaDemandSignal[]>([])

  // Intel dialogs
  const [showBenchmarkDialog, setShowBenchmarkDialog] = useState(false)
  const [showTrendDialog, setShowTrendDialog] = useState(false)
  const [showSignalDialog, setShowSignalDialog] = useState(false)

  // Benchmark form
  const [bmCategory, setBmCategory] = useState('')
  const [bmProduct, setBmProduct] = useState('')
  const [bmOurPrice, setBmOurPrice] = useState('')
  const [bmCompetitor, setBmCompetitor] = useState('')
  const [bmCompPrice, setBmCompPrice] = useState('')
  const [bmCurrency, setBmCurrency] = useState<'USD' | 'LRD'>('USD')
  const [bmNotes, setBmNotes] = useState('')

  // Trend form
  const [trCategory, setTrCategory] = useState('')
  const [trDirection, setTrDirection] = useState<TrendDirection>('stable')
  const [trSignal, setTrSignal] = useState('')
  const [trCities, setTrCities] = useState('')
  const [trConfidence, setTrConfidence] = useState<'high' | 'medium' | 'low'>('medium')

  // Signal form
  const [sgCity, setSgCity] = useState('')
  const [sgCategory, setSgCategory] = useState('')
  const [sgLevel, setSgLevel] = useState<'high' | 'medium' | 'low'>('medium')
  const [sgSource, setSgSource] = useState('')
  const [sgNotes, setSgNotes] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showBulkOutreach, setShowBulkOutreach] = useState(false)

  useEffect(() => {
    initializeStorage()
    setMerchants(getMerchants())
    setScripts(getScripts())
    setBenchmarks(getPriceBenchmarks())
    setTrends(getCategoryTrends())
    setDemandSignals(getDemandSignals())
    setSavedViews(getSavedViews())
    setHiddenColsState(getHiddenColumns())

    // Supabase Realtime — reflect changes made by other team members instantly
    const channel = supabase
      .channel('merchants-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'merchants' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMerchants(prev => {
              const exists = prev.some(m => m.id === (payload.new as { id: string }).id)
              if (exists) return prev
              return [mapMerchantRow(payload.new as Record<string, unknown>), ...prev]
            })
          } else if (payload.eventType === 'UPDATE') {
            setMerchants(prev =>
              prev.map(m =>
                m.id === (payload.new as { id: string }).id
                  ? mapMerchantRow(payload.new as Record<string, unknown>)
                  : m
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setMerchants(prev =>
              prev.filter(m => m.id !== (payload.old as { id: string }).id)
            )
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // IntersectionObserver — attach/re-attach whenever the sentinel div appears
  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setDisplayCount(n => n + 50)
      },
      { rootMargin: '200px', threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [displayCount]) // re-run after each page load so sentinel re-attaches

  const categories = useMemo(
    () => Array.from(new Set(merchants.map(m => m.category).filter(Boolean))).sort(),
    [merchants]
  )
  const counties = useMemo(
    () => Array.from(new Set(merchants.map(m => m.county).filter(Boolean))).sort() as string[],
    [merchants]
  )
  const countries = useMemo(
    () => Array.from(new Set(merchants.map(m => m.country).filter(Boolean))).sort() as string[],
    [merchants]
  )

  // All unique emails that have been assigned to at least one merchant
  const assignees = useMemo(
    () => Array.from(new Set(merchants.map(m => m.assignedTo).filter(Boolean))).sort() as string[],
    [merchants]
  )

  const allFiltered = useMemo(() =>
    merchants
      .filter(m => {
        if (search) {
          const q = search.toLowerCase()
          if (!m.name.toLowerCase().includes(q) && !m.city?.toLowerCase().includes(q) && !m.category?.toLowerCase().includes(q)) return false
        }
        if (filterSegment !== 'all' && m.segment !== filterSegment) return false
        if (filterCategory !== 'all' && m.category !== filterCategory) return false
        if (filterStatus !== 'all' && m.outreachStatus !== filterStatus) return false
        if (filterPriority !== 'all' && m.priority !== filterPriority) return false
        if (filterDigital !== 'all' && m.digitalPresence !== filterDigital) return false
        if (filterTier !== 'all' && String(m.tier) !== filterTier) return false
        if (filterLibdelivery === 'yes' && !m.isLibdeliveryPartner) return false
        if (filterLibdelivery === 'no' && m.isLibdeliveryPartner) return false
        if (filterShipsToLiberia === 'yes' && !m.shipsToLiberia) return false
        if (filterShipsToLiberia === 'no' && m.shipsToLiberia) return false
        if (filterCounty !== 'all' && m.county !== filterCounty) return false
        if (filterCountry !== 'all' && m.country !== filterCountry) return false
        if (filterSource === 'trueliberia' && !m.tags?.includes('trueliberia-import')) return false
        if (filterSource === 'research' && m.tags?.includes('trueliberia-import')) return false
        if (filterContactMethod === 'has_email' && !m.email) return false
        if (filterContactMethod === 'has_phone' && !m.phone) return false
        if (filterContactMethod === 'has_whatsapp' && !m.whatsapp) return false
        if (filterHealth !== 'all') {
          const score = computeMerchantHealth(m).total
          if (filterHealth === 'healthy' && score < 70) return false
          if (filterHealth === 'at-risk' && (score < 30 || score >= 70)) return false
          if (filterHealth === 'critical' && score >= 30) return false
        }
        if (filterAssignedTo && m.assignedTo !== filterAssignedTo) return false
        return true
      })
      .sort((a, b) => {
        const av = (a[sortKey] ?? '') as string
        const bv = (b[sortKey] ?? '') as string
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      }),
    [merchants, search, filterSegment, filterCategory, filterStatus, filterPriority, filterDigital,
      filterTier, filterLibdelivery, filterShipsToLiberia, filterCounty, filterCountry, filterSource,
      filterContactMethod, filterHealth, filterAssignedTo, sortKey, sortDir]
  )

  // Paginated slice — what's actually rendered in the table
  const filtered = useMemo(() => allFiltered.slice(0, displayCount), [allFiltered, displayCount])

  // Reset pagination when filters change
  useEffect(() => { setDisplayCount(50) }, [
    search, filterSegment, filterCategory, filterStatus, filterPriority, filterDigital,
    filterTier, filterLibdelivery, filterShipsToLiberia, filterCounty, filterCountry,
    filterSource, filterContactMethod, filterHealth, filterAssignedTo, sortKey, sortDir,
  ])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const handleUpdateMerchant = useCallback((m: Merchant) => {
    upsertMerchant(m)
    setMerchants(getMerchants())
    if (selectedMerchant?.id === m.id) setSelectedMerchant(m)
  }, [selectedMerchant])

  const handleDeleteMerchant = useCallback((id: string) => {
    deleteMerchant(id)
    setMerchants(getMerchants())
    setSelectedMerchant(null)
  }, [])

  const handleAddMerchant = (m: Merchant) => {
    upsertMerchant(m)
    setMerchants(getMerchants())
    toast('Merchant added')
  }

  const handleImport = (newMerchants: Merchant[]) => {
    newMerchants.forEach(m => upsertMerchant(m))
    setMerchants(getMerchants())
    toast(`Imported ${newMerchants.length} merchant${newMerchants.length !== 1 ? 's' : ''}`)
  }

  const handleExportCSV = () => {
    const csv = Papa.unparse(filtered.map(m => ({
      id: m.id,
      name: m.name,
      segment: m.segment,
      category: m.category,
      subcategory: m.subcategory ?? '',
      city: m.city,
      country: m.country,
      operatingStatus: m.operatingStatus,
      digitalPresence: m.digitalPresence,
      instagram: m.instagram ?? '',
      facebook: m.facebook ?? '',
      whatsapp: m.whatsapp ?? '',
      website: m.website ?? '',
      phone: m.phone ?? '',
      email: m.email ?? '',
      outreachStatus: m.outreachStatus,
      lastContactDate: m.lastContactDate ?? '',
      contactChannel: m.contactChannel ?? '',
      notes: m.notes ?? '',
      priority: m.priority,
      tags: (m.tags ?? []).join(','),
      createdAt: m.createdAt,
    })))
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `merchants-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setSearch('')
    setFilterSegment('all')
    setFilterCategory('all')
    setFilterStatus('all')
    setFilterPriority('all')
    setFilterDigital('all')
    setFilterTier('all')
    setFilterLibdelivery('all')
    setFilterShipsToLiberia('all')
    setFilterCounty('all')
    setFilterSource('all')
    setFilterCountry('all')
    setFilterContactMethod('all')
    setFilterHealth('all')
    setFilterAssignedTo('')
    setActiveViewId('view_all')
  }

  // Close column menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) {
        setShowColMenu(false)
      }
    }
    if (showColMenu) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showColMenu])

  // ─── Saved Views Helpers ───────────────────────────────────────────────────
  const captureFilters = (): FilterSnapshot => ({
    search,
    filterSegment,
    filterCategory,
    filterStatus,
    filterPriority,
    filterDigital,
    filterTier,
    filterLibdelivery,
    filterShipsToLiberia,
    filterCounty,
    filterSource,
    filterCountry,
    filterContactMethod,
    filterHealth,
    filterAssignedTo,
  })

  const applyView = (view: SavedView) => {
    const f = view.filters
    setSearch(f.search ?? '')
    setFilterSegment(f.filterSegment ?? 'all')
    setFilterCategory(f.filterCategory ?? 'all')
    setFilterStatus(f.filterStatus ?? 'all')
    setFilterPriority(f.filterPriority ?? 'all')
    setFilterDigital(f.filterDigital ?? 'all')
    setFilterTier(f.filterTier ?? 'all')
    setFilterLibdelivery(f.filterLibdelivery ?? 'all')
    setFilterShipsToLiberia(f.filterShipsToLiberia ?? 'all')
    setFilterCounty(f.filterCounty ?? 'all')
    setFilterSource(f.filterSource ?? 'all')
    setFilterCountry(f.filterCountry ?? 'all')
    setFilterContactMethod(f.filterContactMethod ?? 'all')
    setFilterHealth((f.filterHealth as typeof filterHealth) ?? 'all')
    setFilterAssignedTo(f.filterAssignedTo ?? '')
    setActiveViewId(view.id)
  }

  const handleSaveView = () => {
    if (!saveViewName.trim()) return
    const view: SavedView = {
      id: `view_${Date.now()}`,
      name: saveViewName.trim(),
      emoji: saveViewEmoji,
      filters: captureFilters(),
      createdAt: new Date().toISOString(),
    }
    upsertSavedView(view)
    setSavedViews(getSavedViews())
    setActiveViewId(view.id)
    setShowSaveViewDialog(false)
    setSaveViewName('')
    setSaveViewEmoji('🏪')
  }

  const handleDeleteView = (id: string) => {
    deleteSavedView(id)
    setSavedViews(getSavedViews())
    if (activeViewId === id) setActiveViewId('view_all')
  }

  // ─── Column Customization Helpers ─────────────────────────────────────────
  const toggleColumn = (id: ColId) => {
    if (ALWAYS_VISIBLE.includes(id)) return
    const next = hiddenCols.includes(id)
      ? hiddenCols.filter(c => c !== id)
      : [...hiddenCols, id]
    setHiddenColsState(next)
    setHiddenColumns(next)
  }

  const visibleCols = useMemo(
    () => ALL_COLUMNS.filter(c => ALWAYS_VISIBLE.includes(c.id) || !hiddenCols.includes(c.id)),
    [hiddenCols]
  )

  // ─── Advanced Filter Count ─────────────────────────────────────────────────
  const advancedFilterCount = useMemo(() => {
    let n = 0
    if (filterSegment !== 'all') n++
    if (filterPriority !== 'all') n++
    if (filterDigital !== 'all') n++
    if (filterLibdelivery !== 'all') n++
    if (filterShipsToLiberia !== 'all') n++
    if (filterCounty !== 'all') n++
    if (filterCountry !== 'all') n++
    if (filterSource !== 'all') n++
    if (filterContactMethod !== 'all') n++
    if (filterHealth !== 'all') n++
    if (filterAssignedTo) n++
    return n
  }, [filterSegment, filterPriority, filterDigital, filterLibdelivery, filterShipsToLiberia,
    filterCounty, filterCountry, filterSource, filterContactMethod, filterHealth, filterAssignedTo])

  // WhatsApp CSV export — downloads name + phone for the currently filtered list
  const handleWhatsAppCSV = () => {
    const rows = allFiltered
      .filter(m => m.phone || m.whatsapp)
      .map(m => ({ name: m.name, phone: m.whatsapp || m.phone || '' }))
    if (rows.length === 0) { toast('No merchants with phone/WhatsApp in current filter'); return }
    const csv = Papa.unparse(rows)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `whatsapp-contacts-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast(`Exported ${rows.length} WhatsApp contacts`)
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown className="h-3 w-3 opacity-30" />
    return sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-coral" /> : <ChevronDown className="h-3.5 w-3.5 text-coral" />
  }

  function saveBenchmark() {
    const bm: PriceBenchmark = {
      id: `bm-${Date.now()}`,
      category: bmCategory,
      productName: bmProduct,
      ourPrice: bmOurPrice ? Number(bmOurPrice) : undefined,
      competitorName: bmCompetitor,
      competitorPrice: Number(bmCompPrice) || 0,
      currency: bmCurrency,
      notes: bmNotes || undefined,
      recordedAt: new Date().toISOString(),
    }
    upsertPriceBenchmark(bm)
    setBenchmarks(getPriceBenchmarks())
    setShowBenchmarkDialog(false)
    setBmCategory(''); setBmProduct(''); setBmOurPrice(''); setBmCompetitor(''); setBmCompPrice(''); setBmNotes('')
  }

  function saveTrend() {
    const trend: CategoryTrend = {
      id: `tr-${Date.now()}`,
      category: trCategory,
      direction: trDirection,
      signal: trSignal,
      diasporaCities: trCities.split(',').map(s => s.trim()).filter(Boolean),
      confidenceLevel: trConfidence,
      recordedAt: new Date().toISOString(),
    }
    upsertCategoryTrend(trend)
    setTrends(getCategoryTrends())
    setShowTrendDialog(false)
    setTrCategory(''); setTrSignal(''); setTrCities('')
  }

  function saveSignal() {
    const sig: DiasporaDemandSignal = {
      id: `sig-${Date.now()}`,
      city: sgCity,
      category: sgCategory,
      demandLevel: sgLevel,
      signalSource: sgSource,
      notes: sgNotes || undefined,
      recordedAt: new Date().toISOString(),
    }
    upsertDemandSignal(sig)
    setDemandSignals(getDemandSignals())
    setShowSignalDialog(false)
    setSgCity(''); setSgCategory(''); setSgSource(''); setSgNotes('')
  }

  // Demand map data
  const DIASPORA_CITIES = ['Minneapolis', 'Atlanta', 'New York', 'Providence', 'Philadelphia', 'Washington DC', 'Boston', 'Charlotte', 'Houston', 'Columbus', 'Newark']
  const PRODUCT_CATEGORIES = ['Food & Catering', 'Fashion', 'Beauty & Hair', 'Groceries', 'Health', 'Crafts', 'Hospitality', 'Services']

  function getDemandLevel(city: string, category: string): 'high' | 'medium' | 'low' | null {
    const signal = demandSignals.find(s => s.city.toLowerCase().includes(city.split(' ')[0].toLowerCase()) && s.category.toLowerCase().includes(category.split(' ')[0].toLowerCase()))
    return signal?.demandLevel ?? null
  }

  const demandCellColor = (level: 'high' | 'medium' | 'low' | null) => {
    if (level === 'high') return 'bg-brand-green/20 text-brand-green border-brand-green/30'
    if (level === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200'
    if (level === 'low') return 'bg-slate-50 text-slate-400 border-slate-200'
    return 'bg-white dark:bg-navy-700 border-slate-100 dark:border-navy-600'
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumb />
          <h1 className="text-2xl font-bold text-navy dark:text-white">Merchants</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {merchants.length} total · {allFiltered.length} matching
            {allFiltered.length > displayCount && ` · ${displayCount} shown`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RoleGate roles={['admin', 'editor']}>
            {allFiltered.some(m => m.phone || m.whatsapp) && (
              <Button variant="secondary" onClick={handleWhatsAppCSV} className="gap-1.5">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-[#25D366]">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967c-.273-.099-.471-.148-.67.15c-.197.297-.767.966-.94 1.164c-.173.199-.347.223-.644.075c-.297-.15-1.255-.463-2.39-1.475c-.883-.788-1.48-1.761-1.653-2.059c-.173-.297-.018-.458.13-.606c.134-.133.298-.347.446-.52c.149-.174.198-.298.298-.497c.099-.198.05-.371-.025-.52c-.075-.149-.669-1.612-.916-2.207c-.242-.579-.487-.5-.669-.51c-.173-.008-.371-.01-.57-.01c-.198 0-.52.074-.792.372c-.272.297-1.04 1.016-1.04 2.479c0 1.462 1.065 2.875 1.213 3.074c.149.198 2.096 3.2 5.077 4.487c.709.306 1.262.489 1.694.625c.712.227 1.36.195 1.871.118c.571-.085 1.758-.719 2.006-1.413c.248-.694.248-1.289.173-1.413c-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214l-3.741.982l.998-3.648l-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884c2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp CSV
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => setShowBulkOutreach(true)}
              className="gap-1.5"
            >
              <MessageCircle className="h-4 w-4" />
              Bulk Outreach
            </Button>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4" /> Add Merchant
            </Button>
          </RoleGate>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-navy-700 p-1 rounded-lg mb-6 w-fit">
        {([
          { id: 'directory', label: 'Directory' },
          { id: 'intel', label: 'Market Intel' },
          { id: 'demand', label: 'Demand Map' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setMainTab(tab.id)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
              mainTab === tab.id
                ? 'bg-white dark:bg-navy-600 text-navy dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-navy dark:hover:text-white'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Market Intel Tab */}
      {mainTab === 'intel' && (
        <div className="space-y-6">
          {/* Price Benchmarks */}
          <div className="bg-white dark:bg-navy-600 rounded-xl border border-slate-200 dark:border-navy-500">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-navy-500">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-brand-purple" />
                <h3 className="font-semibold text-navy-500 dark:text-white">Price Benchmarks</h3>
                <Badge variant="secondary" className="text-[10px]">{benchmarks.length}</Badge>
              </div>
              <RoleGate roles={['admin', 'editor']}>
                <Button size="sm" onClick={() => setShowBenchmarkDialog(true)} className="bg-coral hover:bg-coral/90 text-white gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add Benchmark
                </Button>
              </RoleGate>
            </div>
            {benchmarks.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No benchmarks logged yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-navy-500">
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Our Price</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Competitor</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Their Price</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-navy-500">
                    {benchmarks.map(bm => (
                      <tr key={bm.id} className="hover:bg-slate-50 dark:hover:bg-navy-700">
                        <td className="py-2.5 px-4 font-medium text-navy-500 dark:text-white">{bm.productName}</td>
                        <td className="py-2.5 px-4 text-slate-500">{bm.category}</td>
                        <td className="py-2.5 px-4">{bm.ourPrice != null ? `${bm.ourPrice} ${bm.currency}` : '—'}</td>
                        <td className="py-2.5 px-4 text-slate-500">{bm.competitorName}</td>
                        <td className="py-2.5 px-4 font-medium">{bm.competitorPrice} {bm.currency}</td>
                        <td className="py-2.5 px-4 text-slate-500 max-w-[200px]"><span className="truncate block">{bm.notes ?? '—'}</span></td>
                        <td className="py-2 px-2">
                          <RoleGate roles={['admin', 'editor']}>
                            <button onClick={() => { deletePriceBenchmark(bm.id); setBenchmarks(getPriceBenchmarks()) }} className="text-slate-300 hover:text-red-500">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </RoleGate>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Category Trends */}
          <div className="bg-white dark:bg-navy-600 rounded-xl border border-slate-200 dark:border-navy-500">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-navy-500">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand-green" />
                <h3 className="font-semibold text-navy-500 dark:text-white">Category Trends</h3>
                <Badge variant="secondary" className="text-[10px]">{trends.length}</Badge>
              </div>
              <RoleGate roles={['admin', 'editor']}>
                <Button size="sm" onClick={() => setShowTrendDialog(true)} className="bg-coral hover:bg-coral/90 text-white gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Log Trend
                </Button>
              </RoleGate>
            </div>
            {trends.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No trends logged yet.</p>
            ) : (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {trends.map(trend => (
                  <div key={trend.id} className="bg-slate-50 dark:bg-navy-700 rounded-lg p-3 relative">
                    <RoleGate roles={['admin', 'editor']}>
                      <button
                        onClick={() => { deleteCategoryTrend(trend.id); setTrends(getCategoryTrends()) }}
                        className="absolute top-2 right-2 text-slate-300 hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </RoleGate>
                    <div className="flex items-center gap-2 mb-1">
                      {trend.direction === 'rising' && <TrendingUp className="h-4 w-4 text-brand-green" />}
                      {trend.direction === 'declining' && <TrendingDown className="h-4 w-4 text-red-500" />}
                      {trend.direction === 'stable' && <Minus className="h-4 w-4 text-amber-500" />}
                      <span className="font-semibold text-sm text-navy-500 dark:text-white">{trend.category}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{trend.signal}</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      <Badge
                        variant={trend.direction === 'rising' ? 'success' : trend.direction === 'declining' ? 'danger' : 'warning'}
                        className="text-[10px] capitalize"
                      >
                        {trend.direction}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] capitalize">{trend.confidenceLevel} confidence</Badge>
                    </div>
                    {trend.diasporaCities.length > 0 && (
                      <p className="text-[10px] text-slate-400 mt-1.5">{trend.diasporaCities.join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Demand Map Tab */}
      {mainTab === 'demand' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-coral" />
              <h2 className="text-lg font-semibold text-navy-500 dark:text-white">Diaspora Demand Map</h2>
              <p className="text-sm text-slate-500">— US diaspora cities × Liberian product categories</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-3 h-3 rounded bg-brand-green/30 inline-block" /> High
                <span className="w-3 h-3 rounded bg-amber-100 inline-block ml-2" /> Medium
                <span className="w-3 h-3 rounded bg-slate-100 inline-block ml-2" /> Low
                <span className="w-3 h-3 rounded bg-white border border-slate-200 inline-block ml-2" /> Unknown
              </div>
              <RoleGate roles={['admin', 'editor']}>
                <Button size="sm" onClick={() => setShowSignalDialog(true)} className="bg-coral hover:bg-coral/90 text-white gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Log Signal
                </Button>
              </RoleGate>
            </div>
          </div>

          <div className="bg-white dark:bg-navy-600 rounded-xl border border-slate-200 dark:border-navy-500 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-500">
                  <th className="py-3 px-3 text-left font-semibold text-slate-500 sticky left-0 bg-white dark:bg-navy-600 min-w-[120px]">City</th>
                  {PRODUCT_CATEGORIES.map(cat => (
                    <th key={cat} className="py-3 px-2 text-center font-semibold text-slate-500 whitespace-nowrap min-w-[100px]">{cat}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-500">
                {DIASPORA_CITIES.map(city => (
                  <tr key={city}>
                    <td className="py-2.5 px-3 font-medium text-navy-500 dark:text-white sticky left-0 bg-white dark:bg-navy-600">{city}</td>
                    {PRODUCT_CATEGORIES.map(cat => {
                      const level = getDemandLevel(city, cat)
                      return (
                        <td key={cat} className="py-1.5 px-1.5 text-center">
                          <span className={cn('inline-block w-full py-1 rounded border text-[10px] font-medium', demandCellColor(level))}>
                            {level ? level.charAt(0).toUpperCase() + level.slice(1) : '—'}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Logged signals list */}
          {demandSignals.length > 0 && (
            <div className="bg-white dark:bg-navy-600 rounded-xl border border-slate-200 dark:border-navy-500">
              <div className="p-4 border-b border-slate-100 dark:border-navy-500">
                <h3 className="font-semibold text-navy-500 dark:text-white text-sm">Raw Signals ({demandSignals.length})</h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-navy-500">
                {demandSignals.map(sig => (
                  <div key={sig.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-navy-500 dark:text-white">{sig.city} — {sig.category}</span>
                        <Badge
                          variant={sig.demandLevel === 'high' ? 'success' : sig.demandLevel === 'medium' ? 'warning' : 'secondary'}
                          className="text-[10px] capitalize"
                        >
                          {sig.demandLevel}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Source: {sig.signalSource}</p>
                      {sig.notes && <p className="text-xs text-slate-400 mt-0.5">{sig.notes}</p>}
                    </div>
                    <button onClick={() => { deleteDemandSignal(sig.id); setDemandSignals(getDemandSignals()) }} className="text-slate-300 hover:text-red-500 flex-shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hide directory content when on other tabs */}
      {mainTab !== 'directory' && (
        <>
          {/* Benchmark Dialog */}
          <Dialog open={showBenchmarkDialog} onOpenChange={setShowBenchmarkDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Add Price Benchmark</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label>Product Name</Label>
                    <Input value={bmProduct} onChange={e => setBmProduct(e.target.value)} placeholder="e.g. Pepper Soup" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Input value={bmCategory} onChange={e => setBmCategory(e.target.value)} placeholder="Food" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Currency</Label>
                    <Select value={bmCurrency} onValueChange={v => setBmCurrency(v as 'USD' | 'LRD')}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="LRD">LRD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Our Price (optional)</Label>
                    <Input type="number" value={bmOurPrice} onChange={e => setBmOurPrice(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Competitor Name</Label>
                    <Input value={bmCompetitor} onChange={e => setBmCompetitor(e.target.value)} placeholder="LIBdelivery" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Competitor Price</Label>
                    <Input type="number" value={bmCompPrice} onChange={e => setBmCompPrice(e.target.value)} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Notes</Label>
                    <Textarea value={bmNotes} onChange={e => setBmNotes(e.target.value)} rows={2} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setShowBenchmarkDialog(false)}>Cancel</Button>
                <Button onClick={saveBenchmark} disabled={!bmProduct.trim()} className="bg-coral hover:bg-coral/90 text-white">Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Trend Dialog */}
          <Dialog open={showTrendDialog} onOpenChange={setShowTrendDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Log Category Trend</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label>Category</Label>
                    <Input value={trCategory} onChange={e => setTrCategory(e.target.value)} placeholder="Fashion" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Direction</Label>
                    <Select value={trDirection} onValueChange={v => setTrDirection(v as TrendDirection)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rising">Rising</SelectItem>
                        <SelectItem value="stable">Stable</SelectItem>
                        <SelectItem value="declining">Declining</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Confidence</Label>
                    <Select value={trConfidence} onValueChange={v => setTrConfidence(v as 'high' | 'medium' | 'low')}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Signal / Evidence</Label>
                    <Textarea value={trSignal} onChange={e => setTrSignal(e.target.value)} rows={2} placeholder="What's driving this trend?" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Diaspora Cities (comma-separated)</Label>
                    <Input value={trCities} onChange={e => setTrCities(e.target.value)} placeholder="Minneapolis, Atlanta, NYC" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setShowTrendDialog(false)}>Cancel</Button>
                <Button onClick={saveTrend} disabled={!trCategory.trim()} className="bg-coral hover:bg-coral/90 text-white">Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Demand Signal Dialog */}
          <Dialog open={showSignalDialog} onOpenChange={setShowSignalDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Log Demand Signal</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>City</Label>
                    <Input value={sgCity} onChange={e => setSgCity(e.target.value)} placeholder="Minneapolis" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Input value={sgCategory} onChange={e => setSgCategory(e.target.value)} placeholder="Food & Catering" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Demand Level</Label>
                    <Select value={sgLevel} onValueChange={v => setSgLevel(v as 'high' | 'medium' | 'low')}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Signal Source</Label>
                    <Input value={sgSource} onChange={e => setSgSource(e.target.value)} placeholder="Community survey" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Notes</Label>
                    <Textarea value={sgNotes} onChange={e => setSgNotes(e.target.value)} rows={2} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setShowSignalDialog(false)}>Cancel</Button>
                <Button onClick={saveSignal} disabled={!sgCity.trim() || !sgCategory.trim()} className="bg-coral hover:bg-coral/90 text-white">Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Directory content (only show when on directory tab) */}
      {mainTab !== 'directory' ? null : (<>

      {/* Pipeline Funnel */}
      <PipelineFunnel
        merchants={merchants}
        activeStage={filterStatus}
        onStageClick={stage => {
          setFilterStatus(stage ?? 'all')
          setActiveViewId('')
        }}
      />

      {/* Saved Views Strip */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
        {savedViews.map(view => (
          <div key={view.id} className="flex items-center shrink-0">
            <button
              onClick={() => applyView(view)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                activeViewId === view.id
                  ? 'bg-coral text-white border-coral shadow-sm'
                  : 'bg-white dark:bg-navy-600 border-slate-200 dark:border-navy-500 text-slate-600 dark:text-slate-300 hover:border-coral/50 hover:text-coral',
              )}
            >
              <span>{view.emoji}</span>
              <span className="max-w-[120px] truncate">{view.name}</span>
            </button>
            {!view.isSystem && (
              <button
                onClick={() => handleDeleteView(view.id)}
                className="ml-0.5 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-400 transition-colors"
                title="Remove view"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => { setSaveViewName(''); setSaveViewEmoji('🏪'); setShowSaveViewDialog(true) }}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-dashed border-slate-300 dark:border-navy-500 text-slate-400 hover:border-coral hover:text-coral transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> Save View
        </button>
      </div>

      {/* Filter Bar */}
      <Card className="mb-4">
        <CardContent className="p-4">
          {/* Primary filters — always visible */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, city, or category..."
                className="pl-9"
              />
            </div>

            <div className="w-[160px]">
              <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setActiveViewId('') }}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {OUTREACH_STATUSES.map(s => <SelectItem key={s} value={s}>{labelOf(s)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[150px]">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[120px]">
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger><SelectValue placeholder="Tier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  {TIERS.map(t => <SelectItem key={t} value={String(t)}>Tier {t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* More filters toggle */}
            <button
              onClick={() => setShowAdvancedFilters(v => !v)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                showAdvancedFilters || advancedFilterCount > 0
                  ? 'bg-coral/10 border-coral/40 text-coral'
                  : 'border-slate-200 dark:border-navy-500 text-slate-500 hover:border-coral/40 hover:text-coral',
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {advancedFilterCount > 0 && (
                <span className="ml-0.5 flex items-center justify-center bg-coral text-white text-[10px] font-bold rounded-full w-4 h-4">
                  {advancedFilterCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-1.5 ml-auto">
              {(search || filterStatus !== 'all' || filterCategory !== 'all' || filterTier !== 'all' || advancedFilterCount > 0) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
                  <X className="h-4 w-4" /> Clear
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={handleExportCSV} className="shrink-0">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">CSV</span>
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowImport(true)} className="shrink-0">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Import</span>
              </Button>
            </div>
          </div>

          {/* Advanced filters — collapsible */}
          {showAdvancedFilters && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-navy-500 flex flex-wrap gap-2">
              <div className="w-[140px]">
                <Select value={filterSegment} onValueChange={setFilterSegment}>
                  <SelectTrigger><SelectValue placeholder="Segment" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Segments</SelectItem>
                    {SEGMENTS.map(s => <SelectItem key={s} value={s}>{labelOf(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[130px]">
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {PRIORITIES.map(p => <SelectItem key={p} value={p}>{labelOf(p)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[140px]">
                <Select value={filterDigital} onValueChange={setFilterDigital}>
                  <SelectTrigger><SelectValue placeholder="Digital" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Digital</SelectItem>
                    {DIGITAL_PRESENCES.map(d => <SelectItem key={d} value={d}>{labelOf(d)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {countries.length > 1 && (
                <div className="w-[150px]">
                  <Select value={filterCountry} onValueChange={setFilterCountry}>
                    <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="w-[150px]">
                <Select value={filterLibdelivery} onValueChange={setFilterLibdelivery}>
                  <SelectTrigger><SelectValue placeholder="LIBdelivery" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All LIBdelivery</SelectItem>
                    <SelectItem value="yes">LIBdelivery Partners</SelectItem>
                    <SelectItem value="no">Not on LIBdelivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[160px]">
                <Select value={filterShipsToLiberia} onValueChange={setFilterShipsToLiberia}>
                  <SelectTrigger><SelectValue placeholder="Ships to LR" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Shipping</SelectItem>
                    <SelectItem value="yes">Ships to Liberia</SelectItem>
                    <SelectItem value="no">Does Not Ship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {counties.length > 0 && (
                <div className="w-[150px]">
                  <Select value={filterCounty} onValueChange={setFilterCounty}>
                    <SelectTrigger><SelectValue placeholder="County" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Counties</SelectItem>
                      {counties.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="w-[150px]">
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="trueliberia">TrueLiberia Import</SelectItem>
                    <SelectItem value="research">Hand-Researched</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[160px]">
                <Select value={filterContactMethod} onValueChange={setFilterContactMethod}>
                  <SelectTrigger><SelectValue placeholder="Contact" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Contact</SelectItem>
                    <SelectItem value="has_email">Has Email</SelectItem>
                    <SelectItem value="has_phone">Has Phone</SelectItem>
                    <SelectItem value="has_whatsapp">Has WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[160px]">
                <Select value={filterHealth} onValueChange={v => setFilterHealth(v as typeof filterHealth)}>
                  <SelectTrigger><SelectValue placeholder="Health" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Health</SelectItem>
                    <SelectItem value="healthy">Healthy (A/B)</SelectItem>
                    <SelectItem value="at-risk">At Risk (C/D)</SelectItem>
                    <SelectItem value="critical">Critical (F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned To filter */}
              <div className="w-[180px]">
                <Select value={filterAssignedTo || '__all__'} onValueChange={v => setFilterAssignedTo(v === '__all__' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Assigned To" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Anyone</SelectItem>
                    {user?.email && (
                      <SelectItem value={user.email}>
                        Assigned to Me ({user.email.split('@')[0]})
                      </SelectItem>
                    )}
                    {assignees
                      .filter(e => e !== user?.email)
                      .map(email => (
                        <SelectItem key={email} value={email}>
                          {email.split('@')[0]}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Mode Toggle + Columns */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {allFiltered.length} merchant{allFiltered.length !== 1 ? 's' : ''} matching
          {allFiltered.length > displayCount && ` · showing first ${displayCount}`}
        </p>
        <div className="flex items-center gap-2">
          {/* Columns toggle */}
          <div className="relative" ref={colMenuRef}>
            <button
              onClick={() => setShowColMenu(v => !v)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                hiddenCols.length > 0
                  ? 'border-coral/40 text-coral bg-coral/5'
                  : 'border-slate-200 dark:border-navy-500 text-slate-500 hover:text-navy dark:hover:text-white',
              )}
            >
              <Columns3 className="h-3.5 w-3.5" />
              Columns
              {hiddenCols.length > 0 && (
                <span className="text-[10px] bg-coral text-white rounded-full px-1">{hiddenCols.length}</span>
              )}
            </button>
            {showColMenu && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-navy-600 rounded-xl border border-slate-200 dark:border-navy-500 shadow-lg p-2 min-w-[180px]">
                {ALL_COLUMNS.filter(c => !ALWAYS_VISIBLE.includes(c.id)).map(col => (
                  <label
                    key={col.id}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-500 cursor-pointer text-sm text-slate-700 dark:text-slate-200"
                  >
                    <input
                      type="checkbox"
                      checked={!hiddenCols.includes(col.id)}
                      onChange={() => toggleColumn(col.id)}
                      className="rounded border-slate-300 text-coral focus:ring-coral"
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-1 bg-gray-100 dark:bg-navy-500 p-0.5 rounded-lg">
          <button
            onClick={() => setViewMode('table')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              viewMode === 'table'
                ? 'bg-white dark:bg-navy-600 text-navy dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-navy dark:hover:text-white',
            )}
          >
            <Table2 className="h-3.5 w-3.5" /> Table
          </button>
          <button
            onClick={() => setViewMode('tier')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              viewMode === 'tier'
                ? 'bg-white dark:bg-navy-600 text-navy dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-navy dark:hover:text-white',
            )}
          >
            <LayoutList className="h-3.5 w-3.5" /> Tier View
          </button>
          </div>
        </div>
      </div>

      {/* Tier View */}
      {viewMode === 'tier' && (
        <TierView merchants={filtered} onSelect={setSelectedMerchant} />
      )}

      {/* Desktop Table */}
      <div className={cn('rounded-xl border border-gray-100 dark:border-navy-500 bg-white dark:bg-navy-600 shadow-sm overflow-hidden', viewMode === 'tier' ? 'hidden' : 'hidden md:block')}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-navy-500 border-b border-gray-100 dark:border-navy-400">
              <tr>
                {(
                  [
                    { key: 'name', colId: 'name' as ColId, label: 'Name' },
                    { key: 'segment', colId: 'segment' as ColId, label: 'Segment' },
                    { key: 'category', colId: 'category' as ColId, label: 'Category' },
                    { key: 'city', colId: 'city' as ColId, label: 'City' },
                    { key: 'country', colId: 'country' as ColId, label: 'Country' },
                    { key: 'digitalPresence', colId: 'digital' as ColId, label: 'Digital' },
                    { key: 'outreachStatus', colId: 'status' as ColId, label: 'Status' },
                    { key: 'priority', colId: 'priority' as ColId, label: 'Priority' },
                    { key: 'lastContactDate', colId: 'lastContact' as ColId, label: 'Last Contact' },
                  ] as { key: SortKey; colId: ColId; label: string }[]
                ).map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide cursor-pointer hover:text-navy dark:hover:text-white select-none',
                      hiddenCols.includes(col.colId) && 'hidden',
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <SortIcon col={col.key} />
                    </div>
                  </th>
                ))}
                {/* Assigned To column header */}
                <th className={cn('px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide', hiddenCols.includes('assignedTo') && 'hidden')}>
                  Assigned To
                </th>
                {/* Completeness column header */}
                <th className={cn('px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide', hiddenCols.includes('completeness') && 'hidden')}>
                  Completeness
                </th>
                <th className={cn('px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide', hiddenCols.includes('health') && 'hidden')}>
                  Health
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-navy-500">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-sm text-slate-400">
                    No merchants match your filters.
                  </td>
                </tr>
              )}
              {filtered.map(m => {
                const pct = getMerchantCompleteness(m)
                const due = isDueForFollowUp(m)
                return (
                  <tr
                    key={m.id}
                    className={cn(
                      'hover:bg-brand-cream/50 dark:hover:bg-navy-500/50 cursor-pointer transition-colors',
                      due && 'border-l-4 border-l-amber-400 bg-amber-50/30 dark:bg-amber-900/10',
                    )}
                    onClick={() => setSelectedMerchant(m)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-navy dark:text-white">{m.name}</div>
                      {/* Contact availability icons */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span aria-label={m.email ? `Email: ${m.email}` : 'No email'}>
                          <Mail className={cn('h-3 w-3', m.email ? 'text-brand-purple' : 'text-slate-300 dark:text-navy-400')} />
                        </span>
                        <span aria-label={m.phone ? `Phone: ${m.phone}` : 'No phone'}>
                          <Phone className={cn('h-3 w-3', m.phone ? 'text-brand-green' : 'text-slate-300 dark:text-navy-400')} />
                        </span>
                        <span aria-label={m.whatsapp ? `WhatsApp: ${m.whatsapp}` : 'No WhatsApp'}>
                        <svg
                          viewBox="0 0 24 24"
                          className={cn('h-3 w-3 fill-current', m.whatsapp ? 'text-[#25D366]' : 'text-slate-300 dark:text-navy-400')}
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967c-.273-.099-.471-.148-.67.15c-.197.297-.767.966-.94 1.164c-.173.199-.347.223-.644.075c-.297-.15-1.255-.463-2.39-1.475c-.883-.788-1.48-1.761-1.653-2.059c-.173-.297-.018-.458.13-.606c.134-.133.298-.347.446-.52c.149-.174.198-.298.298-.497c.099-.198.05-.371-.025-.52c-.075-.149-.669-1.612-.916-2.207c-.242-.579-.487-.5-.669-.51c-.173-.008-.371-.01-.57-.01c-.198 0-.52.074-.792.372c-.272.297-1.04 1.016-1.04 2.479c0 1.462 1.065 2.875 1.213 3.074c.149.198 2.096 3.2 5.077 4.487c.709.306 1.262.489 1.694.625c.712.227 1.36.195 1.871.118c.571-.085 1.758-.719 2.006-1.413c.248-.694.248-1.289.173-1.413c-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214l-3.741.982l.998-3.648l-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884c2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {m.tier != null && (
                          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full border', TIER_COLORS[m.tier])}>
                            T{m.tier}
                          </span>
                        )}
                        {m.isLibdeliveryPartner && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-1.5 py-0.5 rounded-full">
                            <Package className="h-2.5 w-2.5" /> LIBdelivery
                          </span>
                        )}
                        {m.shipsToLiberia && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                            <Truck className="h-2.5 w-2.5" /> Ships
                          </span>
                        )}
                        {m.tags?.includes('trueliberia-import') && (
                          <span className="text-[10px] bg-navy/10 text-navy dark:bg-white/10 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium">TL</span>
                        )}
                      </div>
                    </td>
                    <td className={cn('px-4 py-3 text-slate-600 dark:text-slate-300', hiddenCols.includes('segment') && 'hidden')}>{labelOf(m.segment)}</td>
                    <td className={cn('px-4 py-3 text-slate-600 dark:text-slate-300', hiddenCols.includes('category') && 'hidden')}>{m.category}</td>
                    <td className={cn('px-4 py-3 text-slate-600 dark:text-slate-300', hiddenCols.includes('city') && 'hidden')}>{m.city}</td>
                    <td className={cn('px-4 py-3 text-slate-500 dark:text-slate-400 text-xs', hiddenCols.includes('country') && 'hidden')}>{m.country || '—'}</td>
                    <td className={cn('px-4 py-3', hiddenCols.includes('digital') && 'hidden')}>
                      <Badge variant={digitalPresenceVariant(m.digitalPresence)}>{labelOf(m.digitalPresence)}</Badge>
                    </td>
                    <td className={cn('px-4 py-3', hiddenCols.includes('status') && 'hidden')}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant={outreachVariant(m.outreachStatus)}>{labelOf(m.outreachStatus)}</Badge>
                        {due && (
                          <Badge variant="warning" className="text-[10px]">Follow-up due</Badge>
                        )}
                      </div>
                    </td>
                    <td className={cn('px-4 py-3', hiddenCols.includes('priority') && 'hidden')}>
                      <Badge variant={priorityVariant(m.priority)}>{labelOf(m.priority)}</Badge>
                    </td>
                    <td className={cn('px-4 py-3 text-slate-500 dark:text-slate-400 text-xs', hiddenCols.includes('lastContact') && 'hidden')}>
                      {m.lastContactDate ? formatDate(m.lastContactDate) : '—'}
                    </td>
                    {/* Assigned To cell */}
                    <td className={cn('px-4 py-3 text-slate-500 dark:text-slate-400 text-xs', hiddenCols.includes('assignedTo') && 'hidden')}>
                      {m.assignedTo ? (
                        <div className="flex items-center gap-1">
                          <UserCircle className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[100px]">{m.assignedTo.split('@')[0]}</span>
                        </div>
                      ) : '—'}
                    </td>
                    {/* Completeness cell */}
                    <td className={cn('px-4 py-3 w-[120px]', hiddenCols.includes('completeness') && 'hidden')}>
                      <CompletenessBar pct={pct} />
                    </td>
                    {/* Health grade cell */}
                    <td className={cn('px-4 py-3', hiddenCols.includes('health') && 'hidden')}>
                      {(() => {
                        const h = computeMerchantHealth(m)
                        const gradeColors: Record<string, string> = {
                          A: 'bg-emerald-100 text-emerald-800',
                          B: 'bg-blue-100 text-blue-800',
                          C: 'bg-amber-100 text-amber-800',
                          D: 'bg-orange-100 text-orange-800',
                          F: 'bg-red-100 text-red-800',
                        }
                        return (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${gradeColors[h.grade]}`}>
                            {h.grade}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <div className="w-[140px]">
                          <Select
                            value={m.outreachStatus}
                            onValueChange={v => handleUpdateMerchant({ ...m, outreachStatus: v as OutreachStatus })}
                          >
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {OUTREACH_STATUSES.map(s => <SelectItem key={s} value={s}>{labelOf(s)}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        {m.outreachStatus === 'signed-up' && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            title="View Seller Dashboard"
                            onClick={e => { e.stopPropagation(); router.push(`/merchants/${m.id}`) }}
                          >
                            <Store className="h-4 w-4 text-brand-green" />
                          </Button>
                        )}
                        <Button size="icon-sm" variant="ghost" onClick={() => setSelectedMerchant(m)}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination controls */}
        {allFiltered.length > displayCount ? (
          <div className="py-4 flex flex-col items-center gap-2">
            {/* Invisible sentinel for IntersectionObserver auto-load */}
            <div ref={loaderRef} className="h-1 w-full" />
            <p className="text-xs text-slate-400">
              Showing {displayCount} of {allFiltered.length} merchants
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDisplayCount(n => n + 50)}
            >
              Load {Math.min(50, allFiltered.length - displayCount)} more
            </Button>
          </div>
        ) : (
          <div ref={loaderRef} className="py-3 text-center text-xs text-slate-300 dark:text-navy-400">
            {allFiltered.length > 0 ? `All ${allFiltered.length} merchants loaded` : ''}
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className={cn('space-y-3', viewMode === 'tier' ? 'hidden' : 'md:hidden')}>
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-slate-400">
              No merchants match your filters.
            </CardContent>
          </Card>
        )}
        {filtered.map(m => {
          const pct = getMerchantCompleteness(m)
          const due = isDueForFollowUp(m)
          return (
            <Card
              key={m.id}
              className={cn(
                'cursor-pointer active:scale-[0.99] transition-transform',
                due && 'border-l-4 border-l-amber-400',
              )}
              onClick={() => setSelectedMerchant(m)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-navy dark:text-white truncate">{m.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{m.category} · {m.city}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 mt-1" />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <Badge variant="outline" className="text-xs">{labelOf(m.segment)}</Badge>
                  <Badge variant={outreachVariant(m.outreachStatus)}>{labelOf(m.outreachStatus)}</Badge>
                  <Badge variant={priorityVariant(m.priority)}>{labelOf(m.priority)}</Badge>
                  {due && <Badge variant="warning" className="text-[10px]">Follow-up due</Badge>}
                </div>
                <div className="mt-2">
                  <CompletenessBar pct={pct} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Slide-Over */}
      {selectedMerchant && (
        <MerchantSlideOver
          merchant={selectedMerchant}
          scripts={scripts}
          currentUserEmail={user?.email ?? undefined}
          allAssignees={assignees}
          onClose={() => setSelectedMerchant(null)}
          onUpdate={handleUpdateMerchant}
          onDelete={handleDeleteMerchant}
        />
      )}

      {/* Dialogs */}
      <MerchantFormDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={handleAddMerchant}
      />
      <ImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
      />

      {/* Save View Dialog */}
      <Dialog open={showSaveViewDialog} onOpenChange={v => !v && setShowSaveViewDialog(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Current View</DialogTitle>
            <DialogDescription>Name this filter configuration so you can reapply it with one click.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Emoji</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SAVE_VIEW_EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => setSaveViewEmoji(e)}
                    className={cn(
                      'text-xl p-1.5 rounded-lg border transition-all',
                      saveViewEmoji === e
                        ? 'border-coral bg-coral/10'
                        : 'border-slate-200 dark:border-navy-500 hover:border-coral/40',
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>View name</Label>
              <Input
                value={saveViewName}
                onChange={e => setSaveViewName(e.target.value)}
                placeholder="e.g. Hot Leads, My Merchants..."
                className="mt-1"
                onKeyDown={e => e.key === 'Enter' && handleSaveView()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowSaveViewDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveView} disabled={!saveViewName.trim()}>Save View</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>)}

      {/* Bulk Outreach Tool — receives the currently filtered merchant list */}
      {showBulkOutreach && (
        <BulkOutreachTool
          merchants={allFiltered}
          scripts={scripts}
          onClose={() => setShowBulkOutreach(false)}
        />
      )}
    </div>
  )
}
