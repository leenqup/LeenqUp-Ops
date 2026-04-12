'use client'

import { useEffect, useState, useRef } from 'react'
import {
  DollarSign,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Download,
  AlertTriangle,
  CheckCircle2,
  BarChart2,
  Target,
  Pencil,
  X,
  Check,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from '@/components/ui/toaster'
import {
  getExpenses,
  upsertExpense,
  deleteExpense,
  getRevenues,
  upsertRevenue,
  deleteRevenue,
  getCashPositions,
  upsertCashPosition,
  deleteCashPosition,
  getInvestorKpis,
  upsertInvestorKpi,
  initializeStorage,
} from '@/lib/storage'
import { generateId, cn } from '@/lib/utils'
import type { ExpenseEntry, RevenueEntry, CashPosition, InvestorKPIs, ExpenseCategory, RevenueType } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'salaries', label: 'Salaries & Contractors' },
  { value: 'tools-software', label: 'Tools & Software' },
  { value: 'marketing', label: 'Marketing & Ads' },
  { value: 'hosting-infra', label: 'Hosting & Infrastructure' },
  { value: 'office-ops', label: 'Office & Operations' },
  { value: 'legal-compliance', label: 'Legal & Compliance' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other' },
]

const REVENUE_TYPES: { value: RevenueType; label: string }[] = [
  { value: 'gmv-commission', label: 'GMV Commission' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'listing-fee', label: 'Listing Fee' },
  { value: 'sponsorship', label: 'Sponsorship' },
  { value: 'grant', label: 'Grant' },
  { value: 'investment', label: 'Investment' },
  { value: 'other', label: 'Other' },
]

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  'salaries': 'bg-coral/10 text-coral',
  'tools-software': 'bg-brand-purple/10 text-brand-purple',
  'marketing': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'hosting-infra': 'bg-navy/10 text-navy dark:bg-white/10 dark:text-slate-300',
  'office-ops': 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  'legal-compliance': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'travel': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'other': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
}

// ─── Month helpers ─────────────────────────────────────────────────────────────

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

function monthLabel(m: string): string {
  if (!m) return ''
  const [year, month] = m.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function getLast6Months(): string[] {
  const months: string[] = []
  const d = new Date()
  for (let i = 0; i < 6; i++) {
    months.unshift(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    d.setMonth(d.getMonth() - 1)
  }
  return months
}

// ─── Summary Stats ─────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function StatCard({ label, value, sub, color, icon: Icon }: {
  label: string
  value: string
  sub?: string
  color: string
  icon: React.ElementType
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
            <p className={cn('text-2xl font-bold mt-1', color)}>{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          </div>
          <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', color === 'text-brand-green' ? 'bg-brand-green/10' : color === 'text-coral' ? 'bg-coral/10' : color === 'text-amber-600' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-navy/10 dark:bg-white/10')}>
            <Icon className={cn('h-5 w-5', color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Burn Rate Bar Chart ───────────────────────────────────────────────────────

function BurnChart({ months, expenses, revenues }: {
  months: string[]
  expenses: ExpenseEntry[]
  revenues: RevenueEntry[]
}) {
  const data = months.map(m => ({
    month: m,
    burn: expenses.filter(e => e.month === m).reduce((s, e) => s + e.amountUSD, 0),
    revenue: revenues.filter(r => r.month === m).reduce((s, r) => s + r.amountUSD, 0),
  }))

  const maxVal = Math.max(...data.flatMap(d => [d.burn, d.revenue]), 1)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-coral inline-block" />Expenses</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-green inline-block" />Revenue</span>
      </div>
      <div className="flex items-end gap-2 h-[120px]">
        {data.map(d => (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end gap-0.5 h-[100px]">
              <div
                className="flex-1 bg-coral/70 rounded-t-sm transition-all"
                style={{ height: `${(d.burn / maxVal) * 100}%` }}
                title={`Expenses: $${fmt(d.burn)}`}
              />
              <div
                className="flex-1 bg-brand-green/70 rounded-t-sm transition-all"
                style={{ height: `${(d.revenue / maxVal) * 100}%` }}
                title={`Revenue: $${fmt(d.revenue)}`}
              />
            </div>
            <span className="text-[9px] text-slate-400 text-center leading-tight">
              {d.month.slice(5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Add Expense Dialog ────────────────────────────────────────────────────────

function AddExpenseDialog({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (e: ExpenseEntry) => void }) {
  const [form, setForm] = useState({
    category: 'tools-software' as ExpenseCategory,
    description: '',
    amountUSD: '',
    month: currentMonth(),
    recurring: false,
    vendor: '',
    notes: '',
  })

  const handleSave = () => {
    if (!form.description.trim()) { toast('Description is required', 'error'); return }
    const amount = parseFloat(form.amountUSD)
    if (isNaN(amount) || amount <= 0) { toast('Enter a valid amount', 'error'); return }
    const entry: ExpenseEntry = {
      id: generateId(),
      category: form.category,
      description: form.description.trim(),
      amountUSD: amount,
      month: form.month,
      recurring: form.recurring,
      vendor: form.vendor.trim() || undefined,
      notes: form.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    }
    onSave(entry)
    onClose()
    setForm({ category: 'tools-software', description: '', amountUSD: '', month: currentMonth(), recurring: false, vendor: '', notes: '' })
    toast('Expense logged')
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Log Expense</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as ExpenseCategory }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description *</Label>
            <Input placeholder="e.g. Vercel Pro plan" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount (USD) *</Label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.amountUSD} onChange={e => setForm(f => ({ ...f, amountUSD: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Month</Label>
              <Input type="month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor (optional)</Label>
            <Input placeholder="e.g. Vercel, Brevo, AWS" value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} className="mt-1" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="recurring" checked={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 accent-coral" />
            <label htmlFor="recurring" className="text-sm text-slate-600 dark:text-slate-300">Recurring monthly expense</label>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</Label>
            <Textarea placeholder="Optional…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="mt-1 min-h-[60px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}><Plus className="h-4 w-4" /> Log Expense</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Add Revenue Dialog ────────────────────────────────────────────────────────

function AddRevenueDialog({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (r: RevenueEntry) => void }) {
  const [form, setForm] = useState({
    type: 'gmv-commission' as RevenueType,
    description: '',
    amountUSD: '',
    month: currentMonth(),
    notes: '',
  })

  const handleSave = () => {
    if (!form.description.trim()) { toast('Description is required', 'error'); return }
    const amount = parseFloat(form.amountUSD)
    if (isNaN(amount) || amount <= 0) { toast('Enter a valid amount', 'error'); return }
    const entry: RevenueEntry = {
      id: generateId(),
      type: form.type,
      description: form.description.trim(),
      amountUSD: amount,
      month: form.month,
      notes: form.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    }
    onSave(entry)
    onClose()
    setForm({ type: 'gmv-commission', description: '', amountUSD: '', month: currentMonth(), notes: '' })
    toast('Revenue logged')
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Log Revenue</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</Label>
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as RevenueType }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{REVENUE_TYPES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description *</Label>
            <Input placeholder="e.g. April GMV commissions" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount (USD) *</Label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.amountUSD} onChange={e => setForm(f => ({ ...f, amountUSD: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Month</Label>
              <Input type="month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</Label>
            <Textarea placeholder="Optional…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="mt-1 min-h-[60px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-brand-green hover:bg-brand-green/90"><Plus className="h-4 w-4" /> Log Revenue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Cash Position Card ────────────────────────────────────────────────────────

function CashPositionCard({ positions, onUpdate }: { positions: CashPosition[]; onUpdate: (p: CashPosition) => void }) {
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const latest = positions[0]

  const handleSave = () => {
    const val = parseFloat(amount)
    if (isNaN(val) || val < 0) { toast('Enter a valid cash amount', 'error'); return }
    const entry: CashPosition = {
      id: generateId(),
      amountUSD: val,
      recordedAt: new Date().toISOString().slice(0, 10),
      notes: notes.trim() || undefined,
    }
    onUpdate(entry)
    setEditing(false)
    setAmount('')
    setNotes('')
    toast('Cash position updated')
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Cash on Hand</CardTitle>
            <CardDescription>Total liquid capital available</CardDescription>
          </div>
          {!editing && (
            <Button size="sm" variant="secondary" onClick={() => { setEditing(true); setAmount(latest ? String(latest.amountUSD) : '') }}>
              <Pencil className="h-3.5 w-3.5" /> Update
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-slate-500">Cash on Hand (USD)</Label>
              <Input type="number" min="0" step="100" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Notes (optional)</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. After payroll" className="mt-1" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}><Check className="h-3.5 w-3.5" /> Save</Button>
              <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : latest ? (
          <div>
            <p className="text-4xl font-bold text-navy dark:text-white">${fmt(latest.amountUSD)}</p>
            <p className="text-xs text-slate-400 mt-1">
              Last updated {new Date(latest.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {latest.notes && ` · ${latest.notes}`}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">No cash position recorded yet. Click Update to add one.</p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Runway Calculator ─────────────────────────────────────────────────────────

function RunwayCard({ expenses, revenues, cashPositions }: { expenses: ExpenseEntry[]; revenues: RevenueEntry[]; cashPositions: CashPosition[] }) {
  const cashOnHand = cashPositions[0]?.amountUSD ?? 0

  const last3Months = getLast6Months().slice(3)
  const avgBurn = last3Months.length
    ? last3Months.reduce((sum, m) => sum + expenses.filter(e => e.month === m).reduce((s, e) => s + e.amountUSD, 0), 0) / last3Months.length
    : 0

  const avgRevenue = last3Months.length
    ? last3Months.reduce((sum, m) => sum + revenues.filter(r => r.month === m).reduce((s, r) => s + r.amountUSD, 0), 0) / last3Months.length
    : 0

  const netBurn = avgBurn - avgRevenue
  const runwayMonths = netBurn > 0 && cashOnHand > 0 ? cashOnHand / netBurn : null

  const runwayColor = runwayMonths === null
    ? 'text-brand-green'
    : runwayMonths < 3
      ? 'text-red-600 dark:text-red-400'
      : runwayMonths < 6
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-brand-green'

  const runwayLabel = runwayMonths === null
    ? 'Revenue ≥ Burn'
    : `${runwayMonths.toFixed(1)} months`

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Runway Calculator</CardTitle>
        <CardDescription>Based on 3-month average burn and revenue</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-gray-50 dark:bg-navy-500/30 p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Avg Monthly Burn</p>
            <p className="text-lg font-bold text-coral">${fmt(avgBurn)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-navy-500/30 p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Avg Monthly Revenue</p>
            <p className="text-lg font-bold text-brand-green">${fmt(avgRevenue)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-navy-500/30 p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Net Monthly Burn</p>
            <p className={cn('text-lg font-bold', netBurn > 0 ? 'text-coral' : 'text-brand-green')}>
              {netBurn > 0 ? `-$${fmt(netBurn)}` : `+$${fmt(Math.abs(netBurn))}`}
            </p>
          </div>
        </div>

        <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-navy-400 p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Estimated Runway</p>
          <p className={cn('text-4xl font-bold', runwayColor)}>{runwayLabel}</p>
          {runwayMonths !== null && runwayMonths < 6 && (
            <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              {runwayMonths < 3 ? 'Critical — fundraise or cut immediately' : 'Plan your next raise now'}
            </div>
          )}
          {runwayMonths === null && (
            <p className="text-xs text-brand-green mt-2">Revenue exceeds burn — you are profitable</p>
          )}
        </div>

        {cashOnHand === 0 && (
          <p className="text-xs text-slate-400 text-center italic">Update cash position above to enable runway calculation</p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Investor KPIs Card ────────────────────────────────────────────────────────

function InvestorKPIsCard({ kpis, onSave }: { kpis: InvestorKPIs[]; onSave: (k: InvestorKPIs) => void }) {
  const [editing, setEditing] = useState(false)
  const [month, setMonth] = useState(currentMonth())
  const [form, setForm] = useState<Partial<InvestorKPIs>>({})

  const current = kpis.find(k => k.month === month)

  useEffect(() => {
    setForm(current ?? {})
  }, [month, kpis])

  const handleSave = () => {
    const entry: InvestorKPIs = {
      month,
      activeSellers: form.activeSellers,
      activeBuyers: form.activeBuyers,
      gmvUSD: form.gmvUSD,
      newListings: form.newListings,
      cacUSD: form.cacUSD,
      notes: form.notes,
      updatedAt: new Date().toISOString(),
    }
    onSave(entry)
    setEditing(false)
    toast('KPIs saved')
  }

  const numField = (label: string, field: keyof InvestorKPIs, prefix = '') => (
    <div>
      <Label className="text-xs text-slate-500">{label}</Label>
      {editing ? (
        <Input
          type="number"
          min="0"
          value={form[field] as number ?? ''}
          onChange={e => setForm(f => ({ ...f, [field]: e.target.value ? Number(e.target.value) : undefined }))}
          placeholder="—"
          className="mt-1 h-8 text-sm"
        />
      ) : (
        <p className="mt-1 text-sm font-semibold text-navy dark:text-white">
          {current?.[field] !== undefined ? `${prefix}${(current[field] as number).toLocaleString()}` : <span className="text-slate-400 font-normal">—</span>}
        </p>
      )}
    </div>
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base">Investor KPIs</CardTitle>
            <CardDescription>Manually enter key metrics for investor updates</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input type="month" value={month} onChange={e => { setMonth(e.target.value); setEditing(false) }} className="h-8 text-xs w-36" />
            {!editing ? (
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
            ) : (
              <>
                <Button size="sm" onClick={handleSave}><Check className="h-3.5 w-3.5" /> Save</Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setForm(current ?? {}) }}><X className="h-3.5 w-3.5" /></Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {numField('Active Sellers', 'activeSellers')}
          {numField('Active Buyers', 'activeBuyers')}
          {numField('GMV', 'gmvUSD', '$')}
          {numField('New Listings', 'newListings')}
          {numField('CAC (USD)', 'cacUSD', '$')}
        </div>
        {editing && (
          <div className="mt-3">
            <Label className="text-xs text-slate-500">Notes</Label>
            <Textarea
              value={form.notes ?? ''}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value || undefined }))}
              placeholder="Context for this month's numbers…"
              className="mt-1 min-h-[60px] text-sm"
            />
          </div>
        )}
        {!editing && current?.notes && (
          <p className="text-xs text-slate-500 mt-3 italic">{current.notes}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([])
  const [revenues, setRevenues] = useState<RevenueEntry[]>([])
  const [cashPositions, setCashPositions] = useState<CashPosition[]>([])
  const [kpis, setKpis] = useState<InvestorKPIs[]>([])
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddRevenue, setShowAddRevenue] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth())

  useEffect(() => {
    initializeStorage()
    setExpenses(getExpenses())
    setRevenues(getRevenues())
    setCashPositions(getCashPositions())
    setKpis(getInvestorKpis())
  }, [])

  const months = getLast6Months()

  // Month-filtered data
  const monthExpenses = expenses.filter(e => e.month === selectedMonth)
  const monthRevenues = revenues.filter(r => r.month === selectedMonth)
  const monthBurn = monthExpenses.reduce((s, e) => s + e.amountUSD, 0)
  const monthRevenue = monthRevenues.reduce((s, r) => s + r.amountUSD, 0)

  // Current month totals
  const curExpenses = expenses.filter(e => e.month === currentMonth())
  const curRevenues = revenues.filter(r => r.month === currentMonth())
  const curBurn = curExpenses.reduce((s, e) => s + e.amountUSD, 0)
  const curRevenue = curRevenues.reduce((s, r) => s + r.amountUSD, 0)

  const handleSaveExpense = (entry: ExpenseEntry) => {
    upsertExpense(entry)
    setExpenses(getExpenses())
  }

  const handleDeleteExpense = (id: string) => {
    deleteExpense(id)
    setExpenses(getExpenses())
    toast('Expense deleted', 'info')
  }

  const handleSaveRevenue = (entry: RevenueEntry) => {
    upsertRevenue(entry)
    setRevenues(getRevenues())
  }

  const handleDeleteRevenue = (id: string) => {
    deleteRevenue(id)
    setRevenues(getRevenues())
    toast('Revenue entry deleted', 'info')
  }

  const handleCashUpdate = (p: CashPosition) => {
    upsertCashPosition(p)
    setCashPositions(getCashPositions())
  }

  const handleKpiSave = (k: InvestorKPIs) => {
    upsertInvestorKpi(k)
    setKpis(getInvestorKpis())
  }

  const handleExportCSV = () => {
    const rows = [
      ['Type', 'Category/Type', 'Description', 'Amount USD', 'Month', 'Vendor', 'Recurring', 'Notes'],
      ...expenses.map(e => ['Expense', e.category, e.description, e.amountUSD, e.month, e.vendor ?? '', e.recurring ? 'Yes' : 'No', e.notes ?? '']),
      ...revenues.map(r => ['Revenue', r.type, r.description, r.amountUSD, r.month, '', '', r.notes ?? '']),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leenqup-finance-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast(`Exported ${expenses.length + revenues.length} entries`)
  }

  // By-category breakdown for the month
  const categoryTotals = EXPENSE_CATEGORIES.map(c => ({
    ...c,
    total: monthExpenses.filter(e => e.category === c.value).reduce((s, e) => s + e.amountUSD, 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Finance Tracker</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track burn, revenue, and runway. Replaces your spreadsheet.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={handleExportCSV} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => setShowAddRevenue(true)} className="gap-1.5 bg-brand-green hover:bg-brand-green/90">
            <Plus className="h-4 w-4" /> Revenue
          </Button>
          <Button size="sm" onClick={() => setShowAddExpense(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Expense
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="This Month's Burn" value={`$${fmt(curBurn)}`} sub="expenses logged" color="text-coral" icon={TrendingDown} />
        <StatCard label="This Month's Revenue" value={`$${fmt(curRevenue)}`} sub="revenue logged" color="text-brand-green" icon={TrendingUp} />
        <StatCard label="Net This Month" value={curRevenue - curBurn >= 0 ? `+$${fmt(curRevenue - curBurn)}` : `-$${fmt(curBurn - curRevenue)}`} color={curRevenue >= curBurn ? 'text-brand-green' : 'text-coral'} icon={curRevenue >= curBurn ? CheckCircle2 : AlertTriangle} />
        <StatCard label="Cash on Hand" value={cashPositions[0] ? `$${fmt(cashPositions[0].amountUSD)}` : '—'} sub={cashPositions[0] ? `as of ${cashPositions[0].recordedAt}` : 'not set'} color="text-navy dark:text-white" icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Burn chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">6-Month Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <BurnChart months={months} expenses={expenses} revenues={revenues} />
          </CardContent>
        </Card>

        {/* Cash + Runway */}
        <div className="space-y-4">
          <CashPositionCard positions={cashPositions} onUpdate={handleCashUpdate} />
        </div>
      </div>

      {/* Runway */}
      <div className="mb-6">
        <RunwayCard expenses={expenses} revenues={revenues} cashPositions={cashPositions} />
      </div>

      {/* Month selector + detail */}
      <div className="mb-6">
        <Tabs value={selectedMonth} onValueChange={setSelectedMonth}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-navy dark:text-white">Monthly Detail</h2>
            <TabsList className="h-8">
              {months.map(m => (
                <TabsTrigger key={m} value={m} className="text-[11px] px-2.5">{m.slice(5)}</TabsTrigger>
              ))}
            </TabsList>
          </div>

          {months.map(m => (
            <TabsContent key={m} value={m} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Expenses */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Expenses — {monthLabel(m)}</CardTitle>
                      <span className="text-sm font-bold text-coral">${fmt(monthBurn)}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Category breakdown */}
                    {categoryTotals.length > 0 && (
                      <div className="space-y-1.5 mb-3 pb-3 border-b border-gray-100 dark:border-navy-500">
                        {categoryTotals.map(c => (
                          <div key={c.value} className="flex items-center gap-2">
                            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', CATEGORY_COLORS[c.value])}>{c.label}</span>
                            <div className="flex-1 h-1 bg-gray-100 dark:bg-navy-400 rounded-full overflow-hidden">
                              <div className="h-full bg-coral/50 rounded-full" style={{ width: `${(c.total / monthBurn) * 100}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-navy dark:text-white">${fmt(c.total)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {monthExpenses.length === 0
                      ? <p className="text-sm text-slate-400 italic text-center py-4">No expenses logged for {monthLabel(m)}</p>
                      : (
                        <div className="space-y-1">
                          {monthExpenses.map(e => (
                            <div key={e.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 dark:border-navy-500 last:border-0 group">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-navy dark:text-white truncate">{e.description}</p>
                                <p className="text-[10px] text-slate-400">{EXPENSE_CATEGORIES.find(c => c.value === e.category)?.label}{e.recurring ? ' · recurring' : ''}</p>
                              </div>
                              <span className="text-xs font-semibold text-coral shrink-0">${fmt(e.amountUSD)}</span>
                              <button onClick={() => handleDeleteExpense(e.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )
                    }
                  </CardContent>
                </Card>

                {/* Revenue */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Revenue — {monthLabel(m)}</CardTitle>
                      <span className="text-sm font-bold text-brand-green">${fmt(monthRevenue)}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {monthRevenues.length === 0
                      ? <p className="text-sm text-slate-400 italic text-center py-4">No revenue logged for {monthLabel(m)}</p>
                      : (
                        <div className="space-y-1">
                          {monthRevenues.map(r => (
                            <div key={r.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 dark:border-navy-500 last:border-0 group">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-navy dark:text-white truncate">{r.description}</p>
                                <p className="text-[10px] text-slate-400">{REVENUE_TYPES.find(t => t.value === r.type)?.label}</p>
                              </div>
                              <span className="text-xs font-semibold text-brand-green shrink-0">${fmt(r.amountUSD)}</span>
                              <button onClick={() => handleDeleteRevenue(r.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )
                    }
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Investor KPIs */}
      <InvestorKPIsCard kpis={kpis} onSave={handleKpiSave} />

      {/* Dialogs */}
      <AddExpenseDialog open={showAddExpense} onClose={() => setShowAddExpense(false)} onSave={handleSaveExpense} />
      <AddRevenueDialog open={showAddRevenue} onClose={() => setShowAddRevenue(false)} onSave={handleSaveRevenue} />
    </div>
  )
}
