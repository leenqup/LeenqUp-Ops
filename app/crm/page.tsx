'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  Plus,
  DollarSign,
  Target,
  CheckCircle,
  Activity,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MessageSquare,
  Users,
  Calendar,
  StickyNote,
  ArrowRight,
  X,
  Zap,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  getDeals,
  upsertDeal,
  deleteDeal,
  getCRMActivities,
  logCRMActivity,
  getMerchants,
  initializeStorage,
} from '@/lib/storage'
import type { Deal, DealStage, DealActivity, Merchant } from '@/types'
import { differenceInDays, parseISO } from 'date-fns'

// ── Stage config ──────────────────────────────────────────────
const STAGES: DealStage[] = [
  'prospecting', 'qualified', 'demo-sent', 'negotiating',
  'verbal-yes', 'contract-sent', 'closed-won', 'closed-lost', 'on-hold',
]

const STAGE_CONFIG: Record<DealStage, { label: string; color: string; defaultProbability: number }> = {
  'prospecting':    { label: 'Prospecting',    color: '#94a3b8', defaultProbability: 10 },
  'qualified':      { label: 'Qualified',      color: '#f59e0b', defaultProbability: 25 },
  'demo-sent':      { label: 'Demo Sent',      color: '#7C6AE8', defaultProbability: 40 },
  'negotiating':    { label: 'Negotiating',    color: '#F05A4A', defaultProbability: 60 },
  'verbal-yes':     { label: 'Verbal Yes',     color: '#2E7D52', defaultProbability: 75 },
  'contract-sent':  { label: 'Contract Sent',  color: '#1E2A4A', defaultProbability: 85 },
  'closed-won':     { label: 'Closed Won',     color: '#16a34a', defaultProbability: 100 },
  'closed-lost':    { label: 'Closed Lost',    color: '#dc2626', defaultProbability: 0 },
  'on-hold':        { label: 'On Hold',        color: '#9ca3af', defaultProbability: 20 },
}

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  email: Mail,
  whatsapp: MessageSquare,
  meeting: Users,
  note: StickyNote,
  'stage-change': ArrowRight,
  outreach: MessageSquare,
  'follow-up': ArrowRight,
  'signed-up': CheckCircle,
  'listing-live': CheckCircle,
}

// ── Helpers ───────────────────────────────────────────────────
function computeWeighted(deal: Deal): number {
  return Math.round(deal.dealValueUSD * (deal.probability / 100))
}

function formatUSD(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return `$${n}`
}

function daysInStage(deal: Deal): number {
  const lastChange = deal.activities
    .filter(a => a.type === 'stage-change')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

  const from = lastChange ? parseISO(lastChange.createdAt) : parseISO(deal.createdAt)
  return differenceInDays(new Date(), from)
}

// ── Deal Card ─────────────────────────────────────────────────
function DealCard({
  deal,
  merchant,
  onClick,
}: {
  deal: Deal
  merchant: Merchant | undefined
  onClick: () => void
}) {
  const days = daysInStage(deal)
  const lastActivity = deal.activities[deal.activities.length - 1]

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-navy-600 rounded-lg border border-slate-200 dark:border-navy-500 p-3 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-xs font-semibold text-navy-500 dark:text-white line-clamp-2">{deal.title}</p>
        <span className="text-[10px] font-medium text-slate-400 flex-shrink-0">{formatUSD(deal.dealValueUSD)}</span>
      </div>

      {merchant && (
        <p className="text-[10px] text-slate-500 mb-2 truncate">{merchant.name}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {deal.probability}% likely
        </Badge>
        <span className="text-[10px] text-brand-purple font-medium">
          Wtd: {formatUSD(deal.weightedValue)}
        </span>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-navy-500">
        <span className="text-[10px] text-slate-400">{days}d in stage</span>
        {deal.assignedTo && (
          <span className="w-5 h-5 rounded-full bg-brand-purple text-white text-[9px] font-bold flex items-center justify-center">
            {deal.assignedTo.slice(0, 2).toUpperCase()}
          </span>
        )}
        {lastActivity && (
          <span className="text-[10px] text-slate-400 capitalize">{lastActivity.type}</span>
        )}
      </div>
    </div>
  )
}

// ── Deal Slide-over ───────────────────────────────────────────
function DealSlideOver({
  deal,
  merchant,
  open,
  onClose,
  onSave,
  onDelete,
}: {
  deal: Deal | null
  merchant: Merchant | undefined
  open: boolean
  onClose: () => void
  onSave: (deal: Deal) => void
  onDelete: (id: string) => void
}) {
  const [local, setLocal] = useState<Deal | null>(null)
  const [newActivity, setNewActivity] = useState('')
  const [activityType, setActivityType] = useState<DealActivity['type']>('note')

  useEffect(() => {
    if (deal) setLocal({ ...deal, activities: [...deal.activities] })
  }, [deal])

  if (!local) return null

  function patch(updates: Partial<Deal>) {
    setLocal(prev => prev ? { ...prev, ...updates } : prev)
  }

  function addActivity() {
    if (!newActivity.trim()) return
    const now = new Date().toISOString()
    const act: DealActivity = {
      id: `act-${Date.now()}`,
      type: activityType,
      note: newActivity.trim(),
      by: 'You',
      createdAt: now,
    }
    patch({ activities: [...local!.activities, act] })

    // Log to CRM global feed
    logCRMActivity({
      merchantId: local!.merchantId,
      dealId: local!.id,
      type: activityType === 'stage-change' ? 'stage-change' : activityType === 'note' ? 'note' : 'follow-up',
      description: newActivity.trim(),
      by: 'You',
    })

    setNewActivity('')
  }

  function changeStage(newStage: DealStage) {
    if (!local) return
    const now = new Date().toISOString()
    const act: DealActivity = {
      id: `act-${Date.now()}`,
      type: 'stage-change',
      note: `Stage changed from ${STAGE_CONFIG[local.stage].label} to ${STAGE_CONFIG[newStage].label}`,
      by: 'You',
      createdAt: now,
      oldStage: local.stage,
      newStage,
    }
    const newProb = STAGE_CONFIG[newStage].defaultProbability
    const updated = {
      ...local,
      stage: newStage,
      probability: newProb,
      weightedValue: Math.round(local.dealValueUSD * (newProb / 100)),
      activities: [...local.activities, act],
    }
    patch(updated)

    logCRMActivity({
      merchantId: local.merchantId,
      dealId: local.id,
      type: 'stage-change',
      description: act.note,
      by: 'You',
    })
  }

  function handleSave() {
    if (!local) return
    onSave({ ...local, weightedValue: computeWeighted(local), updatedAt: new Date().toISOString() })
    onClose()
  }

  return (
    <div className={cn(
      'fixed inset-y-0 right-0 w-[480px] bg-white dark:bg-navy-600 border-l border-slate-200 dark:border-navy-500 shadow-2xl z-50 flex flex-col transform transition-transform duration-300',
      open ? 'translate-x-0' : 'translate-x-full'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-navy-500">
        <div>
          <h2 className="font-bold text-navy-500 dark:text-white">{local.title}</h2>
          {merchant && <p className="text-sm text-slate-500">{merchant.name}</p>}
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-500">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Stage selector */}
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-400 uppercase tracking-wider">Stage</Label>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.filter(s => s !== 'closed-lost' && s !== 'on-hold').map(s => (
              <button
                key={s}
                onClick={() => changeStage(s)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                  local.stage === s
                    ? 'text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-navy-700 text-slate-500 hover:bg-slate-200'
                )}
                style={local.stage === s ? { backgroundColor: STAGE_CONFIG[s].color } : undefined}
              >
                {STAGE_CONFIG[s].label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 mt-1">
            {(['closed-lost', 'on-hold'] as DealStage[]).map(s => (
              <button
                key={s}
                onClick={() => changeStage(s)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                  local.stage === s ? 'text-white' : 'bg-slate-100 dark:bg-navy-700 text-slate-500 hover:bg-slate-200'
                )}
                style={local.stage === s ? { backgroundColor: STAGE_CONFIG[s].color } : undefined}
              >
                {STAGE_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* Key fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Deal Value (USD)</Label>
            <Input
              type="number"
              value={local.dealValueUSD}
              onChange={e => {
                const val = Number(e.target.value)
                patch({ dealValueUSD: val, weightedValue: Math.round(val * (local!.probability / 100)) })
              }}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Probability (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={local.probability}
              onChange={e => {
                const val = Number(e.target.value)
                patch({ probability: val, weightedValue: Math.round(local!.dealValueUSD * (val / 100)) })
              }}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Weighted Value</Label>
            <div className="h-8 px-3 rounded-md border bg-slate-50 dark:bg-navy-700 flex items-center text-sm font-semibold text-brand-purple">
              {formatUSD(computeWeighted(local))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Expected Close</Label>
            <Input
              type="date"
              value={local.expectedCloseDate ?? ''}
              onChange={e => patch({ expectedCloseDate: e.target.value || undefined })}
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Assigned To</Label>
            <Input
              value={local.assignedTo ?? ''}
              onChange={e => patch({ assignedTo: e.target.value || undefined })}
              className="h-8 text-sm"
              placeholder="Team member"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Actual GMV ($)</Label>
            <Input
              type="number"
              value={local.gmvActual ?? ''}
              onChange={e => patch({ gmvActual: e.target.value ? Number(e.target.value) : undefined })}
              className="h-8 text-sm"
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-slate-400">Notes</Label>
          <Textarea
            value={local.notes ?? ''}
            onChange={e => patch({ notes: e.target.value || undefined })}
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Activity log */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-400 uppercase tracking-wider">Activity Timeline</Label>

          {/* Add activity */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Select value={activityType} onValueChange={v => setActivityType(v as DealActivity['type'])}>
                <SelectTrigger className="h-8 text-xs w-32 flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['call','email','whatsapp','meeting','note'] as DealActivity['type'][]).map(t => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={newActivity}
                onChange={e => setNewActivity(e.target.value)}
                placeholder="Log an activity…"
                className="h-8 text-xs flex-1"
                onKeyDown={e => e.key === 'Enter' && addActivity()}
              />
              <Button size="sm" onClick={addActivity} disabled={!newActivity.trim()} className="h-8 px-2 bg-coral hover:bg-coral/90 text-white">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-2 mt-2">
            {[...local.activities].reverse().map(act => {
              const Icon = ACTIVITY_ICONS[act.type] ?? Activity
              return (
                <div key={act.id} className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-navy-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="h-3 w-3 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-navy-500 dark:text-white">{act.note}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 capitalize">{act.type}</span>
                      <span className="text-[10px] text-slate-300">·</span>
                      <span className="text-[10px] text-slate-400">{act.by}</span>
                      <span className="text-[10px] text-slate-300">·</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(act.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
            {local.activities.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-3">No activity yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-2 p-4 border-t border-slate-200 dark:border-navy-500">
        <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button onClick={handleSave} className="flex-1 bg-coral hover:bg-coral/90 text-white">Save</Button>
        <Button
          variant="secondary"
          onClick={() => { onDelete(local.id); onClose() }}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          Delete
        </Button>
      </div>
    </div>
  )
}

// ── Main CRM Page ─────────────────────────────────────────────
export default function CRMPage() {
  const router = useRouter()
  const [deals, setDeals] = useState<Deal[]>([])
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [slideOverOpen, setSlideOverOpen] = useState(false)
  const [showNewDeal, setShowNewDeal] = useState(false)
  const [forecastOpen, setForecastOpen] = useState(false)

  // New deal form
  const [newMerchantId, setNewMerchantId] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newStage, setNewStage] = useState<DealStage>('prospecting')
  const [newValue, setNewValue] = useState('')
  const [newProb, setNewProb] = useState('')
  const [newCloseDate, setNewCloseDate] = useState('')

  useEffect(() => {
    initializeStorage()
    reload()
  }, [])

  function reload() {
    setDeals(getDeals())
    setMerchants(getMerchants())
  }

  function openDeal(deal: Deal) {
    setActiveDeal(deal)
    setSlideOverOpen(true)
  }

  function saveDeal(deal: Deal) {
    upsertDeal(deal)
    reload()
  }

  function removeDeal(id: string) {
    deleteDeal(id)
    reload()
  }

  function createDeal() {
    const merchant = merchants.find(m => m.id === newMerchantId)
    if (!merchant) return
    const value = Number(newValue) || 0
    const prob = Number(newProb) || STAGE_CONFIG[newStage].defaultProbability
    const now = new Date().toISOString()
    const deal: Deal = {
      id: `deal-${Date.now()}`,
      merchantId: newMerchantId,
      title: newTitle || `Deal with ${merchant.name}`,
      stage: newStage,
      dealValueUSD: value,
      probability: prob,
      weightedValue: Math.round(value * (prob / 100)),
      expectedCloseDate: newCloseDate || undefined,
      activities: [],
      tags: [],
      createdAt: now,
      updatedAt: now,
    }
    upsertDeal(deal)
    logCRMActivity({
      merchantId: merchant.id,
      dealId: deal.id,
      type: 'outreach',
      description: `Deal created: ${deal.title} (${STAGE_CONFIG[newStage].label})`,
      by: 'You',
    })
    setShowNewDeal(false)
    setNewMerchantId('')
    setNewTitle('')
    setNewStage('prospecting')
    setNewValue('')
    setNewProb('')
    setNewCloseDate('')
    reload()
  }

  function importFromMerchants() {
    const stageMap: Record<string, DealStage> = {
      interested: 'qualified',
      'signed-up': 'closed-won',
      responded: 'prospecting',
    }
    const existing = deals.map(d => d.merchantId)
    let count = 0
    merchants
      .filter(m => ['interested', 'signed-up', 'responded'].includes(m.outreachStatus) && !existing.includes(m.id))
      .forEach(m => {
        const stage: DealStage = stageMap[m.outreachStatus] ?? 'prospecting'
        const prob = STAGE_CONFIG[stage].defaultProbability
        const now = new Date().toISOString()
        upsertDeal({
          id: `deal-${Date.now()}-${count}`,
          merchantId: m.id,
          title: `Deal with ${m.name}`,
          stage,
          dealValueUSD: 0,
          probability: prob,
          weightedValue: 0,
          activities: [],
          tags: [],
          createdAt: now,
          updatedAt: now,
        })
        count++
      })
    reload()
  }

  // Stats
  const openDeals = deals.filter(d => d.stage !== 'closed-lost')
  const wonDeals = deals.filter(d => d.stage === 'closed-won')
  const totalPipeline = openDeals.reduce((s, d) => s + d.dealValueUSD, 0)
  const totalWeighted = openDeals.reduce((s, d) => s + d.weightedValue, 0)
  const totalWonGMV = wonDeals.reduce((s, d) => s + (d.gmvActual ?? d.dealValueUSD), 0)
  const conversionRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0

  // Stage pipeline sums
  const stageSums = STAGES.reduce((acc, stage) => {
    const stageDeals = deals.filter(d => d.stage === stage)
    acc[stage] = {
      count: stageDeals.length,
      total: stageDeals.reduce((s, d) => s + d.dealValueUSD, 0),
      weighted: stageDeals.reduce((s, d) => s + d.weightedValue, 0),
    }
    return acc
  }, {} as Record<DealStage, { count: number; total: number; weighted: number }>)

  const maxStageValue = Math.max(...STAGES.map(s => stageSums[s]?.total ?? 0), 1)

  // Activity feed
  const activities = getCRMActivities().slice(0, 50)

  const activeMerchant = activeDeal ? merchants.find(m => m.id === activeDeal.merchantId) : undefined

  return (
    <>
      <div className="p-6 space-y-6 max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-purple/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-brand-purple" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy-500 dark:text-white">CRM Pipeline</h1>
              <p className="text-sm text-slate-500">{deals.length} deals tracked</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="secondary"
              onClick={() => router.push('/crm/accounts')}
              className="gap-2 text-sm"
            >
              <Building2 className="h-4 w-4" />
              Accounts
            </Button>
            <Button
              variant="secondary"
              onClick={importFromMerchants}
              className="gap-2 text-sm"
            >
              <Zap className="h-4 w-4 text-coral" />
              Import from Merchants
            </Button>
            <Button onClick={() => setShowNewDeal(true)} className="bg-coral hover:bg-coral/90 text-white gap-2">
              <Plus className="h-4 w-4" />
              New Deal
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Pipeline', value: formatUSD(totalPipeline), icon: DollarSign, color: 'text-coral' },
            { label: 'Weighted Forecast', value: formatUSD(totalWeighted), icon: Target, color: 'text-brand-purple' },
            { label: 'Won GMV', value: formatUSD(totalWonGMV), icon: CheckCircle, color: 'text-brand-green' },
            { label: 'Conversion Rate', value: `${conversionRate}%`, icon: TrendingUp, color: 'text-amber-500' },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-navy-600 rounded-xl border border-slate-200 dark:border-navy-500 p-4">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={cn('h-4 w-4', stat.color)} />
                <span className="text-xs text-slate-500">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-navy-500 dark:text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Revenue Forecast Panel */}
        <div className="bg-white dark:bg-navy-600 rounded-xl border border-slate-200 dark:border-navy-500">
          <button
            onClick={() => setForecastOpen(o => !o)}
            className="w-full flex items-center justify-between p-4 text-sm font-semibold text-navy-500 dark:text-white"
          >
            <span>Revenue Forecast by Stage</span>
            {forecastOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {forecastOpen && (
            <div className="px-4 pb-4 space-y-2.5">
              {STAGES.filter(s => stageSums[s]?.count > 0).map(stage => (
                <div key={stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300">{STAGE_CONFIG[stage].label}</span>
                    <span className="font-medium text-navy-500 dark:text-white">
                      {formatUSD(stageSums[stage].total)} ({stageSums[stage].count})
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-navy-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(stageSums[stage].total / maxStageValue) * 100}%`,
                        backgroundColor: STAGE_CONFIG[stage].color,
                      }}
                    />
                  </div>
                </div>
              ))}
              {STAGES.every(s => !stageSums[s]?.count) && (
                <p className="text-sm text-slate-400 text-center py-4">No deals yet</p>
              )}
            </div>
          )}
        </div>

        {/* Pipeline + Activity Feed */}
        <Tabs defaultValue="pipeline">
          <TabsList>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="feed">Activity Feed</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="mt-4">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {STAGES.filter(s => s !== 'closed-lost' && s !== 'on-hold').map(stage => {
                const stageDeals = deals.filter(d => d.stage === stage)
                return (
                  <div key={stage} className="flex-shrink-0 w-64">
                    {/* Column header */}
                    <div className="mb-2 pb-2 border-b-2" style={{ borderColor: STAGE_CONFIG[stage].color }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-navy-500 dark:text-white">
                          {STAGE_CONFIG[stage].label}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-navy-700 rounded px-1.5 py-0.5">
                          {stageDeals.length}
                        </span>
                      </div>
                      {stageDeals.length > 0 && (
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {formatUSD(stageSums[stage].weighted)} weighted
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      {stageDeals.map(deal => (
                        <DealCard
                          key={deal.id}
                          deal={deal}
                          merchant={merchants.find(m => m.id === deal.merchantId)}
                          onClick={() => openDeal(deal)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Closed Lost + On Hold */}
              {(['closed-lost', 'on-hold'] as DealStage[]).map(stage => {
                const stageDeals = deals.filter(d => d.stage === stage)
                if (stageDeals.length === 0) return null
                return (
                  <div key={stage} className="flex-shrink-0 w-64">
                    <div className="mb-2 pb-2 border-b-2" style={{ borderColor: STAGE_CONFIG[stage].color }}>
                      <span className="text-xs font-semibold text-navy-500 dark:text-white">
                        {STAGE_CONFIG[stage].label}
                      </span>
                      <span className="ml-2 text-[10px] text-slate-400">({stageDeals.length})</span>
                    </div>
                    <div className="space-y-2">
                      {stageDeals.map(deal => (
                        <DealCard
                          key={deal.id}
                          deal={deal}
                          merchant={merchants.find(m => m.id === deal.merchantId)}
                          onClick={() => openDeal(deal)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {deals.length === 0 && (
              <div className="text-center py-16">
                <TrendingUp className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-600 dark:text-slate-300 mb-2">No deals yet</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Create deals manually or import from merchants with &quot;interested&quot; / &quot;signed-up&quot; status.
                </p>
                <Button onClick={importFromMerchants} variant="secondary" className="gap-2">
                  <Zap className="h-4 w-4 text-coral" />
                  Import from Merchants
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="feed" className="mt-4">
            <div className="space-y-3 max-w-2xl">
              {activities.map(activity => {
                const merchant = merchants.find(m => m.id === activity.merchantId)
                const Icon = ACTIVITY_ICONS[activity.type] ?? Activity
                return (
                  <div key={activity.id} className="flex gap-3 bg-white dark:bg-navy-600 rounded-lg border border-slate-200 dark:border-navy-500 p-3">
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-navy-700 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {merchant && (
                          <span className="text-xs font-semibold text-navy-500 dark:text-white">{merchant.name}</span>
                        )}
                        <Badge variant="secondary" className="text-[10px] capitalize">{activity.type.replace('-', ' ')}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400">{activity.by}</span>
                        <span className="text-[10px] text-slate-300">·</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(activity.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
              {activities.length === 0 && (
                <div className="text-center py-12">
                  <Activity className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No activity yet. Log activities on deals to see them here.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* New Deal Dialog */}
      <Dialog open={showNewDeal} onOpenChange={setShowNewDeal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Deal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Merchant</Label>
              <Select value={newMerchantId} onValueChange={v => {
                setNewMerchantId(v)
                const m = merchants.find(m => m.id === v)
                if (m && !newTitle) setNewTitle(`Deal with ${m.name}`)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a merchant…" />
                </SelectTrigger>
                <SelectContent>
                  {merchants.slice(0, 100).map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Deal Title</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Onboarding — Kaldi's Koffee" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Stage</Label>
                <Select value={newStage} onValueChange={v => {
                  setNewStage(v as DealStage)
                  setNewProb(String(STAGE_CONFIG[v as DealStage].defaultProbability))
                }}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map(s => (
                      <SelectItem key={s} value={s}>{STAGE_CONFIG[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Deal Value (USD)</Label>
                <Input type="number" value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="0" className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Probability (%)</Label>
                <Input type="number" value={newProb} onChange={e => setNewProb(e.target.value)} placeholder={String(STAGE_CONFIG[newStage].defaultProbability)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Expected Close</Label>
                <Input type="date" value={newCloseDate} onChange={e => setNewCloseDate(e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowNewDeal(false)}>Cancel</Button>
            <Button onClick={createDeal} disabled={!newMerchantId} className="bg-coral hover:bg-coral/90 text-white">
              Create Deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deal slide-over backdrop */}
      {slideOverOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setSlideOverOpen(false)}
        />
      )}

      {/* Deal slide-over */}
      <DealSlideOver
        deal={activeDeal}
        merchant={activeMerchant}
        open={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        onSave={saveDeal}
        onDelete={removeDeal}
      />
    </>
  )
}
