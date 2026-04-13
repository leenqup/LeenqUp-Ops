'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  Users,
  TrendingUp,
  FileText,
  ClipboardList,
  DollarSign,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Target,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  getMerchants,
  getDeals,
  getPosts,
  getSOPs,
  getSOPCompletions,
  getExpenses,
  getRevenues,
  getCashPositions,
  initializeStorage,
} from '@/lib/storage'
import type {
  Merchant, Deal, Post, SOP, OutreachStatus, DealStage,
  ExpenseEntry, RevenueEntry,
} from '@/types'

// ── Helpers ───────────────────────────────────────────────────

function pct(num: number, denom: number): number {
  return denom === 0 ? 0 : Math.round((num / denom) * 100)
}

function fmtMoney(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return `$${n.toLocaleString()}`
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

function thisWeekRange(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay())
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

// ── Sub-components ────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, subtext, color, href,
}: {
  icon: React.ElementType; label: string; value: string | number
  subtext?: string; color: string; href?: string
}) {
  const inner = (
    <Card className="card-hover">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          {href && <ArrowRight className="h-4 w-4 text-slate-300" />}
        </div>
        <p className="text-2xl font-bold text-navy dark:text-white">{value}</p>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </CardContent>
    </Card>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

function ProgressBar({ value, max, color = 'bg-coral' }: { value: number; max: number; color?: string }) {
  const w = max === 0 ? 0 : Math.min(Math.round((value / max) * 100), 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-navy-500 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${w}%` }} />
      </div>
      <span className="text-xs text-slate-500 w-8 text-right">{value}</span>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────

export default function ReportsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [sops, setSOPs] = useState<SOP[]>([])
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([])
  const [revenues, setRevenues] = useState<RevenueEntry[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    initializeStorage()
    setMerchants(getMerchants())
    setDeals(getDeals())
    setPosts(getPosts())
    setSOPs(getSOPs())
    setExpenses(getExpenses())
    setRevenues(getRevenues())
    setLoaded(true)
  }, [])

  // ── Merchant Pipeline ──────────────────────────────────────
  const merchantPipeline = useMemo(() => {
    const stages: OutreachStatus[] = ['not-contacted', 'contacted', 'responded', 'interested', 'signed-up', 'declined', 'not-a-fit']
    const counts: Record<OutreachStatus, number> = {} as Record<OutreachStatus, number>
    stages.forEach(s => (counts[s] = 0))
    merchants.forEach(m => { counts[m.outreachStatus]++ })
    const highPriNotContacted = merchants.filter(m => m.priority === 'high' && m.outreachStatus === 'not-contacted').slice(0, 5)
    return { counts, highPriNotContacted, total: merchants.length }
  }, [merchants])

  // ── Deal Funnel ────────────────────────────────────────────
  const dealFunnel = useMemo(() => {
    const stageOrder: DealStage[] = ['prospecting', 'qualified', 'demo-sent', 'negotiating', 'verbal-yes', 'contract-sent', 'closed-won', 'closed-lost']
    const stageCounts: Record<DealStage, { count: number; value: number }> = {} as Record<DealStage, { count: number; value: number }>
    stageOrder.forEach(s => (stageCounts[s] = { count: 0, value: 0 }))
    deals.forEach(d => {
      stageCounts[d.stage].count++
      stageCounts[d.stage].value += d.dealValueUSD
    })
    const totalWeighted = deals.reduce((sum, d) => sum + d.weightedValue, 0)
    const month = currentMonth()
    const closingThisMonth = deals.filter(d => d.expectedCloseDate?.startsWith(month) && d.stage !== 'closed-won' && d.stage !== 'closed-lost')
    const openDeals = deals.filter(d => d.stage !== 'closed-won' && d.stage !== 'closed-lost')
    return { stageCounts, stageOrder, totalWeighted, closingThisMonth, openDeals }
  }, [deals])

  // ── Content Health ─────────────────────────────────────────
  const contentHealth = useMemo(() => {
    const byStatus = { ready: 0, 'needs-review': 0, scheduled: 0, published: 0 }
    const byPlatform: Record<string, number> = {}
    posts.forEach(p => {
      byStatus[p.status]++
      byPlatform[p.platform] = (byPlatform[p.platform] ?? 0) + 1
    })
    const { start, end } = thisWeekRange()
    const scheduledThisWeek = posts.filter(p => p.scheduledFor && new Date(p.scheduledFor) >= start && new Date(p.scheduledFor) <= end)
    return { byStatus, byPlatform, scheduledThisWeek, total: posts.length }
  }, [posts])

  // ── SOP Compliance ─────────────────────────────────────────
  const sopCompliance = useMemo(() => {
    const completions = getSOPCompletions()
    const todayStr = new Date().toISOString().slice(0, 10)
    const { start: weekStart } = thisWeekRange()
    const monthStr = currentMonth()

    const daily = sops.filter(s => s.frequency === 'daily')
    const weekly = sops.filter(s => s.frequency === 'weekly')
    const monthly = sops.filter(s => s.frequency === 'monthly')

    const completedToday = new Set(completions.filter(c => c.date === todayStr).map(c => c.sopId))
    const completedThisWeek = new Set(completions.filter(c => new Date(c.completedAt) >= weekStart).map(c => c.sopId))
    const completedThisMonth = new Set(completions.filter(c => c.date.startsWith(monthStr)).map(c => c.sopId))

    const overdue = [
      ...daily.filter(s => !completedToday.has(s.id)),
      ...weekly.filter(s => !completedThisWeek.has(s.id)),
    ]

    return {
      daily: { done: daily.filter(s => completedToday.has(s.id)).length, total: daily.length },
      weekly: { done: weekly.filter(s => completedThisWeek.has(s.id)).length, total: weekly.length },
      monthly: { done: monthly.filter(s => completedThisMonth.has(s.id)).length, total: monthly.length },
      overdue,
    }
  }, [sops])

  // ── Finance Summary ────────────────────────────────────────
  const financeSummary = useMemo(() => {
    const month = currentMonth()
    const monthExpenses = expenses.filter(e => e.month === month)
    const monthRevenues = revenues.filter(r => r.month === month)
    const totalExpense = monthExpenses.reduce((s, e) => s + e.amountUSD, 0)
    const totalRevenue = monthRevenues.reduce((s, r) => s + r.amountUSD, 0)
    const netCashFlow = totalRevenue - totalExpense

    // Top expense category
    const byCat: Record<string, number> = {}
    monthExpenses.forEach(e => { byCat[e.category] = (byCat[e.category] ?? 0) + e.amountUSD })
    const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]

    return { totalExpense, totalRevenue, netCashFlow, topCat, month }
  }, [expenses, revenues])

  if (!loaded) {
    return <div className="p-6 text-center text-slate-400">Loading reports…</div>
  }

  const PIPELINE_STAGE_CONFIG: { status: OutreachStatus; label: string; color: string }[] = [
    { status: 'not-contacted', label: 'Not Contacted', color: 'bg-slate-300' },
    { status: 'contacted',     label: 'Contacted',     color: 'bg-amber-400' },
    { status: 'responded',     label: 'Responded',     color: 'bg-blue-400' },
    { status: 'interested',    label: 'Interested',    color: 'bg-purple-400' },
    { status: 'signed-up',     label: 'Signed Up',     color: 'bg-brand-green' },
  ]

  const DEAL_STAGE_LABELS: Partial<Record<DealStage, { label: string; color: string }>> = {
    'prospecting':   { label: 'Prospecting',    color: 'bg-slate-300' },
    'qualified':     { label: 'Qualified',       color: 'bg-blue-300' },
    'demo-sent':     { label: 'Demo Sent',       color: 'bg-indigo-400' },
    'negotiating':   { label: 'Negotiating',     color: 'bg-amber-400' },
    'verbal-yes':    { label: 'Verbal Yes',      color: 'bg-purple-400' },
    'contract-sent': { label: 'Contract Sent',   color: 'bg-orange-400' },
    'closed-won':    { label: 'Closed Won',      color: 'bg-brand-green' },
    'closed-lost':   { label: 'Closed Lost',     color: 'bg-red-400' },
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-purple-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Reports & KPIs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Business health at a glance — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Top KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users}        label="Total Merchants"     value={merchantPipeline.total}                        color="bg-green-50 dark:bg-green-900/30 text-green-600" href="/merchants" />
        <StatCard icon={TrendingUp}   label="Open Deals"          value={dealFunnel.openDeals.length}                   color="bg-purple-50 dark:bg-purple-900/30 text-purple-600" href="/crm"
          subtext={`${fmtMoney(dealFunnel.totalWeighted)} weighted`} />
        <StatCard icon={FileText}     label="Posts Ready"         value={contentHealth.byStatus.ready}                  color="bg-blue-50 dark:bg-blue-900/30 text-blue-600" href="/posts"
          subtext={`${contentHealth.byStatus.scheduled} scheduled`} />
        <StatCard icon={DollarSign}   label="Revenue This Month"  value={fmtMoney(financeSummary.totalRevenue)}         color="bg-amber-50 dark:bg-amber-900/30 text-amber-600" href="/finance"
          subtext={`vs ${fmtMoney(financeSummary.totalExpense)} expenses`} />
      </div>

      {/* 2-column layout */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* ── Merchant Pipeline ── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                <CardTitle className="text-sm font-semibold">Merchant Pipeline</CardTitle>
              </div>
              <Link href="/merchants" className="text-xs text-coral hover:underline font-medium flex items-center gap-0.5">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {PIPELINE_STAGE_CONFIG.map(({ status, label, color }) => (
              <div key={status}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300">{label}</span>
                </div>
                <ProgressBar value={merchantPipeline.counts[status] ?? 0} max={merchantPipeline.total} color={color} />
              </div>
            ))}
            {merchantPipeline.highPriNotContacted.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-navy-600">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3 text-amber-500" /> High Priority — Not Contacted
                </p>
                <div className="space-y-1">
                  {merchantPipeline.highPriNotContacted.map(m => (
                    <Link key={m.id} href={`/merchants/${m.id}`}
                      className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-600">
                      <span className="text-xs text-navy dark:text-slate-200 font-medium">{m.name}</span>
                      <span className="text-[11px] text-slate-400">{m.category}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Deal Funnel ── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <CardTitle className="text-sm font-semibold">Deal Funnel</CardTitle>
              </div>
              <Link href="/crm" className="text-xs text-coral hover:underline font-medium flex items-center gap-0.5">
                View pipeline <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {dealFunnel.stageOrder.map(stage => {
              const { count, value } = dealFunnel.stageCounts[stage]
              const cfg = DEAL_STAGE_LABELS[stage]
              if (!cfg || count === 0) return null
              return (
                <div key={stage} className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${cfg.color}`} />
                  <span className="text-xs text-slate-600 dark:text-slate-300 flex-1">{cfg.label}</span>
                  <span className="text-xs font-semibold text-navy dark:text-white">{count}</span>
                  <span className="text-xs text-slate-400 w-16 text-right">{fmtMoney(value)}</span>
                </div>
              )
            })}
            <div className="pt-2 mt-1 border-t border-gray-100 dark:border-navy-600 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Weighted pipeline</span>
              <span className="text-sm font-bold text-navy dark:text-white">{fmtMoney(dealFunnel.totalWeighted)}</span>
            </div>
            {dealFunnel.closingThisMonth.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                {dealFunnel.closingThisMonth.length} deal{dealFunnel.closingThisMonth.length !== 1 ? 's' : ''} expected to close this month
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Content Health ── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-sm font-semibold">Content Health</CardTitle>
              </div>
              <Link href="/posts" className="text-xs text-coral hover:underline font-medium flex items-center gap-0.5">
                View posts <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {/* Status breakdown */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {([['ready', 'Ready', 'text-brand-green'], ['needs-review', 'Needs Review', 'text-amber-500'], ['scheduled', 'Scheduled', 'text-blue-500'], ['published', 'Published', 'text-slate-500']] as const).map(([status, label, color]) => (
                <div key={status} className="bg-slate-50 dark:bg-navy-600 rounded-xl p-3 text-center">
                  <p className={`text-xl font-bold ${color}`}>{contentHealth.byStatus[status]}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Platform coverage */}
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Coverage by platform</p>
            <div className="space-y-1.5">
              {(['instagram', 'facebook', 'linkedin', 'twitter', 'whatsapp'] as const).map(p => (
                <div key={p} className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 dark:text-slate-300 w-20 capitalize">{p}</span>
                  <ProgressBar value={contentHealth.byPlatform[p] ?? 0} max={contentHealth.total} color="bg-blue-400" />
                </div>
              ))}
            </div>

            {contentHealth.scheduledThisWeek.length > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                {contentHealth.scheduledThisWeek.length} post{contentHealth.scheduledThisWeek.length !== 1 ? 's' : ''} scheduled this week
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── SOP Compliance ── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm font-semibold">SOP Compliance</CardTitle>
              </div>
              <Link href="/sops" className="text-xs text-coral hover:underline font-medium flex items-center gap-0.5">
                View SOPs <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Daily (today)',    ...sopCompliance.daily,   color: 'bg-amber-400' },
              { label: 'Weekly (this week)', ...sopCompliance.weekly, color: 'bg-blue-400' },
              { label: 'Monthly (this month)', ...sopCompliance.monthly, color: 'bg-purple-400' },
            ].map(({ label, done, total, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300">{label}</span>
                  <span className="font-semibold text-navy dark:text-white">{done} / {total}</span>
                </div>
                <ProgressBar value={done} max={total} color={color} />
              </div>
            ))}

            {sopCompliance.overdue.length > 0 && (
              <div className="pt-2 border-t border-gray-100 dark:border-navy-600">
                <p className="text-xs font-semibold text-red-500 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" /> {sopCompliance.overdue.length} SOP{sopCompliance.overdue.length !== 1 ? 's' : ''} overdue
                </p>
                <div className="space-y-1">
                  {sopCompliance.overdue.slice(0, 4).map(s => (
                    <div key={s.id} className="text-xs text-slate-500 dark:text-slate-400 pl-2 border-l-2 border-red-200">{s.title}</div>
                  ))}
                </div>
              </div>
            )}

            {sopCompliance.overdue.length === 0 && (
              <div className="flex items-center gap-1.5 text-xs text-brand-green bg-brand-green/5 px-3 py-2 rounded-lg">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                All active SOPs are on track
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Finance Summary ── */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm font-semibold">Finance — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardTitle>
              </div>
              <Link href="/finance" className="text-xs text-coral hover:underline font-medium flex items-center gap-0.5">
                View finance <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-brand-green">{fmtMoney(financeSummary.totalRevenue)}</p>
                <p className="text-xs text-slate-500 mt-1">Revenue</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-coral">{fmtMoney(financeSummary.totalExpense)}</p>
                <p className="text-xs text-slate-500 mt-1">Expenses</p>
              </div>
              <div className="text-center">
                <p className={`text-3xl font-bold ${financeSummary.netCashFlow >= 0 ? 'text-brand-green' : 'text-red-500'}`}>
                  {financeSummary.netCashFlow >= 0 ? '+' : ''}{fmtMoney(financeSummary.netCashFlow)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Net Cash Flow</p>
              </div>
            </div>
            {financeSummary.topCat && (
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-navy-600 px-4 py-2.5 rounded-xl">
                <Target className="h-3.5 w-3.5 text-coral flex-shrink-0" />
                Top expense category this month:{' '}
                <span className="font-semibold text-navy dark:text-white capitalize">{financeSummary.topCat[0].replace(/-/g, ' ')}</span>
                <span className="ml-auto font-semibold">{fmtMoney(financeSummary.topCat[1])}</span>
              </div>
            )}
            {financeSummary.totalExpense === 0 && financeSummary.totalRevenue === 0 && (
              <p className="text-sm text-slate-400 text-center mt-4">No entries for this month yet. Add them in Finance.</p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
