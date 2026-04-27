'use client'

import { useEffect, useState } from 'react'
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Pencil,
  Trash2,
  Globe,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
} from '@/lib/storage'
import { generateId, cn } from '@/lib/utils'
import type { PriceBenchmark, CategoryTrend, DiasporaDemandSignal, TrendDirection } from '@/types'
import { Breadcrumb } from '@/components/breadcrumb'
import { useAuth } from '@/components/auth-provider'
import { AccessRestricted } from '@/components/role-gate'

// ─── Blank form factories ──────────────────────────────────────────────────────

function blankBenchmarkForm() {
  return {
    category: '',
    productName: '',
    ourPrice: '',
    competitorName: '',
    competitorPrice: '',
    currency: 'USD' as 'USD' | 'LRD',
    notes: '',
  }
}

function blankTrendForm() {
  return {
    category: '',
    direction: 'rising' as TrendDirection,
    signal: '',
    diasporaCities: '',
    confidenceLevel: 'medium' as 'high' | 'medium' | 'low',
    sourceNote: '',
  }
}

function blankSignalForm() {
  return {
    city: '',
    category: '',
    demandLevel: 'medium' as 'high' | 'medium' | 'low',
    signalSource: '',
    notes: '',
  }
}

// ─── KPI Strip ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
            <p className={cn('text-2xl font-bold mt-1', color)}>{value}</p>
          </div>
          <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', `${color.replace('text-', 'bg-')}/10`)}>
            <Icon className={cn('h-5 w-5', color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Price Benchmark Dialog ────────────────────────────────────────────────────

function BenchmarkDialog({
  open,
  editing,
  onClose,
  onSave,
}: {
  open: boolean
  editing: PriceBenchmark | null
  onClose: () => void
  onSave: (b: PriceBenchmark) => void
}) {
  const [form, setForm] = useState(blankBenchmarkForm())

  useEffect(() => {
    if (editing) {
      setForm({
        category: editing.category,
        productName: editing.productName,
        ourPrice: editing.ourPrice !== undefined ? String(editing.ourPrice) : '',
        competitorName: editing.competitorName,
        competitorPrice: String(editing.competitorPrice),
        currency: editing.currency,
        notes: editing.notes ?? '',
      })
    } else {
      setForm(blankBenchmarkForm())
    }
  }, [editing, open])

  const handleSave = () => {
    if (!form.category.trim()) { toast('Category is required', 'error'); return }
    if (!form.productName.trim()) { toast('Product name is required', 'error'); return }
    if (!form.competitorName.trim()) { toast('Competitor name is required', 'error'); return }
    const competitorPrice = parseFloat(form.competitorPrice)
    if (isNaN(competitorPrice) || competitorPrice < 0) { toast('Enter a valid competitor price', 'error'); return }
    const ourPrice = form.ourPrice.trim() ? parseFloat(form.ourPrice) : undefined
    if (ourPrice !== undefined && isNaN(ourPrice)) { toast('Enter a valid our price', 'error'); return }

    const benchmark: PriceBenchmark = {
      id: editing?.id ?? generateId(),
      category: form.category.trim(),
      productName: form.productName.trim(),
      ourPrice,
      competitorName: form.competitorName.trim(),
      competitorPrice,
      currency: form.currency,
      notes: form.notes.trim() || undefined,
      recordedAt: editing?.recordedAt ?? new Date().toISOString(),
    }
    onSave(benchmark)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Price Benchmark' : 'Add Price Benchmark'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category *</Label>
            <Input
              placeholder="e.g. Rice & Grains"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Name *</Label>
            <Input
              placeholder="e.g. 25kg bag of jasmine rice"
              value={form.productName}
              onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Our Price</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="optional"
                value={form.ourPrice}
                onChange={e => setForm(f => ({ ...f, ourPrice: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Currency</Label>
              <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v as 'USD' | 'LRD' }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="LRD">LRD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Competitor Name *</Label>
            <Input
              placeholder="e.g. Shoprite Monrovia"
              value={form.competitorName}
              onChange={e => setForm(f => ({ ...f, competitorName: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Their Price *</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.competitorPrice}
              onChange={e => setForm(f => ({ ...f, competitorPrice: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</Label>
            <Textarea
              placeholder="Optional context…"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="mt-1 min-h-[60px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            {editing ? <><Pencil className="h-4 w-4" /> Save Changes</> : <><Plus className="h-4 w-4" /> Add Benchmark</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Category Trend Dialog ─────────────────────────────────────────────────────

function TrendDialog({
  open,
  editing,
  onClose,
  onSave,
}: {
  open: boolean
  editing: CategoryTrend | null
  onClose: () => void
  onSave: (t: CategoryTrend) => void
}) {
  const [form, setForm] = useState(blankTrendForm())

  useEffect(() => {
    if (editing) {
      setForm({
        category: editing.category,
        direction: editing.direction,
        signal: editing.signal,
        diasporaCities: editing.diasporaCities.join(', '),
        confidenceLevel: editing.confidenceLevel,
        sourceNote: editing.sourceNote ?? '',
      })
    } else {
      setForm(blankTrendForm())
    }
  }, [editing, open])

  const handleSave = () => {
    if (!form.category.trim()) { toast('Category is required', 'error'); return }
    if (!form.signal.trim()) { toast('Signal description is required', 'error'); return }

    const trend: CategoryTrend = {
      id: editing?.id ?? generateId(),
      category: form.category.trim(),
      direction: form.direction,
      signal: form.signal.trim(),
      diasporaCities: form.diasporaCities
        .split(',')
        .map(c => c.trim())
        .filter(Boolean),
      confidenceLevel: form.confidenceLevel,
      sourceNote: form.sourceNote.trim() || undefined,
      recordedAt: editing?.recordedAt ?? new Date().toISOString(),
    }
    onSave(trend)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Category Trend' : 'Add Category Trend'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category *</Label>
            <Input
              placeholder="e.g. Traditional Fashion"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Direction</Label>
            <Select value={form.direction} onValueChange={v => setForm(f => ({ ...f, direction: v as TrendDirection }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rising">Rising</SelectItem>
                <SelectItem value="stable">Stable</SelectItem>
                <SelectItem value="declining">Declining</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Signal *</Label>
            <Textarea
              placeholder="Describe the trend signal or observation…"
              value={form.signal}
              onChange={e => setForm(f => ({ ...f, signal: e.target.value }))}
              className="mt-1 min-h-[80px]"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Diaspora Cities</Label>
            <Input
              placeholder="Philadelphia, Minneapolis, Atlanta"
              value={form.diasporaCities}
              onChange={e => setForm(f => ({ ...f, diasporaCities: e.target.value }))}
              className="mt-1"
            />
            <p className="text-[11px] text-slate-400 mt-0.5">Comma-separated</p>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confidence Level</Label>
            <Select value={form.confidenceLevel} onValueChange={v => setForm(f => ({ ...f, confidenceLevel: v as 'high' | 'medium' | 'low' }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Source Note</Label>
            <Textarea
              placeholder="Where did this signal come from? Optional…"
              value={form.sourceNote}
              onChange={e => setForm(f => ({ ...f, sourceNote: e.target.value }))}
              className="mt-1 min-h-[60px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            {editing ? <><Pencil className="h-4 w-4" /> Save Changes</> : <><Plus className="h-4 w-4" /> Add Trend</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Demand Signal Dialog ──────────────────────────────────────────────────────

function SignalDialog({
  open,
  editing,
  onClose,
  onSave,
}: {
  open: boolean
  editing: DiasporaDemandSignal | null
  onClose: () => void
  onSave: (s: DiasporaDemandSignal) => void
}) {
  const [form, setForm] = useState(blankSignalForm())

  useEffect(() => {
    if (editing) {
      setForm({
        city: editing.city,
        category: editing.category,
        demandLevel: editing.demandLevel,
        signalSource: editing.signalSource,
        notes: editing.notes ?? '',
      })
    } else {
      setForm(blankSignalForm())
    }
  }, [editing, open])

  const handleSave = () => {
    if (!form.city.trim()) { toast('City is required', 'error'); return }
    if (!form.category.trim()) { toast('Category is required', 'error'); return }
    if (!form.signalSource.trim()) { toast('Signal source is required', 'error'); return }

    const signal: DiasporaDemandSignal = {
      id: editing?.id ?? generateId(),
      city: form.city.trim(),
      category: form.category.trim(),
      demandLevel: form.demandLevel,
      signalSource: form.signalSource.trim(),
      notes: form.notes.trim() || undefined,
      recordedAt: editing?.recordedAt ?? new Date().toISOString(),
    }
    onSave(signal)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Demand Signal' : 'Add Demand Signal'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">City *</Label>
              <Input
                placeholder="e.g. Philadelphia"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category *</Label>
              <Input
                placeholder="e.g. Food & Beverages"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Demand Level</Label>
            <Select value={form.demandLevel} onValueChange={v => setForm(f => ({ ...f, demandLevel: v as 'high' | 'medium' | 'low' }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Signal Source *</Label>
            <Input
              placeholder="e.g. Community survey, WhatsApp group"
              value={form.signalSource}
              onChange={e => setForm(f => ({ ...f, signalSource: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</Label>
            <Textarea
              placeholder="Optional additional context…"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="mt-1 min-h-[60px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            {editing ? <><Pencil className="h-4 w-4" /> Save Changes</> : <><Plus className="h-4 w-4" /> Add Signal</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function DirectionBadge({ direction }: { direction: TrendDirection }) {
  if (direction === 'rising') {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 gap-1 font-semibold">
        <TrendingUp className="h-3 w-3" /> Rising
      </Badge>
    )
  }
  if (direction === 'declining') {
    return (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 gap-1 font-semibold">
        <TrendingDown className="h-3 w-3" /> Declining
      </Badge>
    )
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 gap-1 font-semibold">
      <Minus className="h-3 w-3" /> Stable
    </Badge>
  )
}

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const cls =
    level === 'high'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      : level === 'medium'
        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  return <Badge className={cn(cls, 'font-medium capitalize')}>{level} confidence</Badge>
}

function DemandBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const cls =
    level === 'high'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      : level === 'medium'
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  return <Badge className={cn(cls, 'font-medium capitalize')}>{level}</Badge>
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function IntelligencePage() {
  const { role } = useAuth()
  if (role === 'viewer') return <AccessRestricted />

  const [benchmarks, setBenchmarks] = useState<PriceBenchmark[]>([])
  const [trends, setTrends] = useState<CategoryTrend[]>([])
  const [signals, setSignals] = useState<DiasporaDemandSignal[]>([])

  // Dialog state
  const [benchmarkDialog, setBenchmarkDialog] = useState<{ open: boolean; editing: PriceBenchmark | null }>({ open: false, editing: null })
  const [trendDialog, setTrendDialog] = useState<{ open: boolean; editing: CategoryTrend | null }>({ open: false, editing: null })
  const [signalDialog, setSignalDialog] = useState<{ open: boolean; editing: DiasporaDemandSignal | null }>({ open: false, editing: null })

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'benchmark' | 'trend' | 'signal'; id: string } | null>(null)

  useEffect(() => {
    initializeStorage()
    setBenchmarks(getPriceBenchmarks())
    setTrends(getCategoryTrends())
    setSignals(getDemandSignals())
  }, [])

  // ── KPI counts ──────────────────────────────────────────────────────────────
  const totalBenchmarks = benchmarks.length
  const risingCategories = trends.filter(t => t.direction === 'rising').length
  const highDemandSignals = signals.filter(s => s.demandLevel === 'high').length

  // ── Benchmark handlers ──────────────────────────────────────────────────────
  const handleSaveBenchmark = (b: PriceBenchmark) => {
    upsertPriceBenchmark(b)
    setBenchmarks(getPriceBenchmarks())
    toast(benchmarkDialog.editing ? 'Benchmark updated' : 'Benchmark added')
  }

  const handleDeleteBenchmark = (id: string) => {
    deletePriceBenchmark(id)
    setBenchmarks(getPriceBenchmarks())
    setConfirmDelete(null)
    toast('Benchmark deleted', 'info')
  }

  // ── Trend handlers ──────────────────────────────────────────────────────────
  const handleSaveTrend = (t: CategoryTrend) => {
    upsertCategoryTrend(t)
    setTrends(getCategoryTrends())
    toast(trendDialog.editing ? 'Trend updated' : 'Trend added')
  }

  const handleDeleteTrend = (id: string) => {
    deleteCategoryTrend(id)
    setTrends(getCategoryTrends())
    setConfirmDelete(null)
    toast('Trend deleted', 'info')
  }

  // ── Signal handlers ─────────────────────────────────────────────────────────
  const handleSaveSignal = (s: DiasporaDemandSignal) => {
    upsertDemandSignal(s)
    setSignals(getDemandSignals())
    toast(signalDialog.editing ? 'Signal updated' : 'Signal added')
  }

  const handleDeleteSignal = (id: string) => {
    deleteDemandSignal(id)
    setSignals(getDemandSignals())
    setConfirmDelete(null)
    toast('Signal deleted', 'info')
  }

  const handleConfirmedDelete = () => {
    if (!confirmDelete) return
    if (confirmDelete.type === 'benchmark') handleDeleteBenchmark(confirmDelete.id)
    else if (confirmDelete.type === 'trend') handleDeleteTrend(confirmDelete.id)
    else handleDeleteSignal(confirmDelete.id)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Breadcrumb />
        <h1 className="text-2xl font-bold text-navy dark:text-white">Market Intelligence</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Track competitive pricing, category trends, and diaspora demand signals.
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Total Benchmarks" value={totalBenchmarks} icon={BarChart2} color="text-brand-purple" />
        <KpiCard label="Rising Categories" value={risingCategories} icon={TrendingUp} color="text-emerald-600" />
        <KpiCard label="High Demand Signals" value={highDemandSignals} icon={Globe} color="text-coral" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pricing">
        <TabsList className="mb-6">
          <TabsTrigger value="pricing">Pricing Intel</TabsTrigger>
          <TabsTrigger value="trends">Category Trends</TabsTrigger>
          <TabsTrigger value="demand">Diaspora Demand</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Pricing Intel ─────────────────────────────────────────── */}
        <TabsContent value="pricing">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-navy dark:text-white">Price Benchmarks</h2>
            <Button size="sm" onClick={() => setBenchmarkDialog({ open: true, editing: null })}>
              <Plus className="h-4 w-4" /> Add Benchmark
            </Button>
          </div>

          {benchmarks.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No benchmarks yet. Add your first one.</p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => setBenchmarkDialog({ open: true, editing: null })}
              >
                <Plus className="h-4 w-4" /> Add Benchmark
              </Button>
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-navy-500 text-xs text-slate-500 uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-semibold">Category</th>
                      <th className="text-left px-4 py-3 font-semibold">Product Name</th>
                      <th className="text-right px-4 py-3 font-semibold">Our Price</th>
                      <th className="text-left px-4 py-3 font-semibold">Competitor</th>
                      <th className="text-right px-4 py-3 font-semibold">Their Price</th>
                      <th className="text-left px-4 py-3 font-semibold">Currency</th>
                      <th className="text-left px-4 py-3 font-semibold">Recorded</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-navy-500">
                    {benchmarks.map(b => (
                      <tr key={b.id} className="group hover:bg-gray-50 dark:hover:bg-navy-500/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-navy dark:text-white">{b.category}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{b.productName}</td>
                        <td className="px-4 py-3 text-right font-semibold text-navy dark:text-white">
                          {b.ourPrice !== undefined ? b.ourPrice.toLocaleString() : <span className="text-slate-400 font-normal">—</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{b.competitorName}</td>
                        <td className="px-4 py-3 text-right font-semibold text-navy dark:text-white">
                          {b.competitorPrice.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">{b.currency}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{formatDate(b.recordedAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                            <button
                              onClick={() => setBenchmarkDialog({ open: true, editing: b })}
                              className="text-slate-400 hover:text-navy dark:hover:text-white p-1 rounded"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ type: 'benchmark', id: b.id })}
                              className="text-slate-400 hover:text-red-500 p-1 rounded"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab 2: Category Trends ───────────────────────────────────────── */}
        <TabsContent value="trends">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-navy dark:text-white">Category Trends</h2>
            <Button size="sm" onClick={() => setTrendDialog({ open: true, editing: null })}>
              <Plus className="h-4 w-4" /> Add Trend
            </Button>
          </div>

          {trends.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No trends yet. Add your first one.</p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => setTrendDialog({ open: true, editing: null })}
              >
                <Plus className="h-4 w-4" /> Add Trend
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trends.map(t => (
                <Card key={t.id} className="relative group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight">{t.category}</CardTitle>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => setTrendDialog({ open: true, editing: t })}
                          className="text-slate-400 hover:text-navy dark:hover:text-white p-1 rounded"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ type: 'trend', id: t.id })}
                          className="text-slate-400 hover:text-red-500 p-1 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <DirectionBadge direction={t.direction} />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{t.signal}</p>

                    {t.diasporaCities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {t.diasporaCities.map(city => (
                          <span
                            key={city}
                            className="inline-flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-navy-500/50 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full"
                          >
                            <Globe className="h-2.5 w-2.5" />
                            {city}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <ConfidenceBadge level={t.confidenceLevel} />
                      <span className="text-[11px] text-slate-400">{formatDate(t.recordedAt)}</span>
                    </div>

                    {t.sourceNote && (
                      <p className="text-[11px] text-slate-400 italic border-t border-gray-100 dark:border-navy-500 pt-2">
                        {t.sourceNote}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tab 3: Diaspora Demand ───────────────────────────────────────── */}
        <TabsContent value="demand">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-navy dark:text-white">Diaspora Demand Signals</h2>
            <Button size="sm" onClick={() => setSignalDialog({ open: true, editing: null })}>
              <Plus className="h-4 w-4" /> Add Signal
            </Button>
          </div>

          {signals.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No signals yet. Add your first one.</p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => setSignalDialog({ open: true, editing: null })}
              >
                <Plus className="h-4 w-4" /> Add Signal
              </Button>
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-navy-500 text-xs text-slate-500 uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-semibold">City</th>
                      <th className="text-left px-4 py-3 font-semibold">Category</th>
                      <th className="text-left px-4 py-3 font-semibold">Demand Level</th>
                      <th className="text-left px-4 py-3 font-semibold">Signal Source</th>
                      <th className="text-left px-4 py-3 font-semibold">Notes</th>
                      <th className="text-left px-4 py-3 font-semibold">Recorded</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-navy-500">
                    {signals.map(s => (
                      <tr key={s.id} className="group hover:bg-gray-50 dark:hover:bg-navy-500/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-navy dark:text-white">{s.city}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.category}</td>
                        <td className="px-4 py-3">
                          <DemandBadge level={s.demandLevel} />
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.signalSource}</td>
                        <td className="px-4 py-3 text-slate-400 max-w-[200px]">
                          {s.notes ? (
                            <span className="block truncate" title={s.notes}>{s.notes}</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{formatDate(s.recordedAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                            <button
                              onClick={() => setSignalDialog({ open: true, editing: s })}
                              className="text-slate-400 hover:text-navy dark:hover:text-white p-1 rounded"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ type: 'signal', id: s.id })}
                              className="text-slate-400 hover:text-red-500 p-1 rounded"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ───────────────────────────────────────────────────────── */}
      <BenchmarkDialog
        open={benchmarkDialog.open}
        editing={benchmarkDialog.editing}
        onClose={() => setBenchmarkDialog({ open: false, editing: null })}
        onSave={handleSaveBenchmark}
      />
      <TrendDialog
        open={trendDialog.open}
        editing={trendDialog.editing}
        onClose={() => setTrendDialog({ open: false, editing: null })}
        onSave={handleSaveTrend}
      />
      <SignalDialog
        open={signalDialog.open}
        editing={signalDialog.editing}
        onClose={() => setSignalDialog({ open: false, editing: null })}
        onSave={handleSaveSignal}
      />

      {/* ── Delete Confirmation Dialog ─────────────────────────────────────── */}
      <Dialog open={!!confirmDelete} onOpenChange={v => !v && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-300 py-2">
            Are you sure you want to delete this{' '}
            {confirmDelete?.type === 'benchmark'
              ? 'price benchmark'
              : confirmDelete?.type === 'trend'
                ? 'category trend'
                : 'demand signal'}
            ? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleConfirmedDelete}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
