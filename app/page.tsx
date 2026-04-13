'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  FileText,
  MessageSquare,
  Mail,
  Megaphone,
  BookOpen,
  MessageCircle,
  Plus,
  Users,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Target,
  AlertCircle,
  CheckCheck,
  Timer,
  Activity,
  TrendingUp,
  ClipboardList,
  LayoutGrid,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getPosts,
  getScripts,
  getSequences,
  getCampaigns,
  getSOPs,
  getBrandResponses,
  getMerchants,
  getSettings,
  initializeStorage,
  isSOPCompletedToday,
  isSOPCompletedThisWeek,
  logSOPCompletion,
  getActivityFeed,
} from '@/lib/storage'
import type { OutreachStatus, SOP, Merchant, ActivityEntry, ActivityEntityType } from '@/types'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function daysSince(dateStr: string): number {
  const then = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - then.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

const OUTREACH_STAGES: { status: OutreachStatus; label: string; color: 'secondary' | 'warning' | 'default' | 'success' | 'purple' | 'navy' }[] = [
  { status: 'not-contacted', label: 'Not Contacted', color: 'secondary' },
  { status: 'contacted', label: 'Contacted', color: 'warning' },
  { status: 'responded', label: 'Responded', color: 'navy' },
  { status: 'interested', label: 'Interested', color: 'purple' },
  { status: 'signed-up', label: 'Signed Up', color: 'success' },
]

// ── Readiness metric type ─────────────────────────────────────────────────────
interface ReadinessMetric {
  icon: React.ElementType
  label: string
  current: number
  target: number
  display: string
}

// ── Progress bar colour based on % of target ─────────────────────────────────
function progressColor(pct: number): string {
  if (pct >= 80) return 'bg-brand-green'
  if (pct >= 50) return 'bg-amber-400'
  return 'bg-coral'
}

// ── Score badge colour ────────────────────────────────────────────────────────
function scoreBadgeStyle(pct: number): string {
  if (pct >= 80) return 'bg-brand-green/10 text-brand-green border border-brand-green/30'
  if (pct >= 50) return 'bg-amber-50 text-amber-600 border border-amber-300'
  return 'bg-coral/10 text-coral border border-coral/30'
}

// ── Widget 1: Launch Readiness Scorecard ──────────────────────────────────────
function LaunchReadinessScorecard({ metrics }: { metrics: ReadinessMetric[] }) {
  const totalPct = metrics.reduce((sum, m) => {
    const raw = m.target > 0 ? (m.current / m.target) * 100 : 0
    return sum + Math.min(raw, 100)
  }, 0)
  const overallPct = Math.round(metrics.length > 0 ? totalPct / metrics.length : 0)

  return (
    <Card className="relative overflow-hidden border-0 shadow-md">
      {/* Accent left border strip */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-coral to-navy rounded-l-xl" />

      <CardHeader className="pb-2 pl-7">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-coral" />
            <CardTitle className="text-base font-semibold text-navy dark:text-white">
              Launch Readiness Scorecard
            </CardTitle>
          </div>
          {/* Large score badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${scoreBadgeStyle(overallPct)}`}>
            <span className="text-2xl font-extrabold leading-none">{overallPct}%</span>
            <span className="font-semibold">Launch Ready</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pl-7 pt-1 pb-5 space-y-3">
        {metrics.map(m => {
          const Icon = m.icon
          const raw = m.target > 0 ? (m.current / m.target) * 100 : 0
          const pct = Math.min(Math.round(raw), 100)
          return (
            <div key={m.label} className="flex items-center gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-gray-50 dark:bg-navy/30 flex items-center justify-center">
                <Icon className="h-4 w-4 text-slate-500" />
              </div>
              {/* Label + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-navy dark:text-slate-200">{m.label}</span>
                  <span className="text-xs text-slate-500 font-medium ml-2 flex-shrink-0">{m.display}</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-navy/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressColor(pct)}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              {/* Pct label */}
              <span className="text-xs font-semibold text-slate-400 w-8 text-right flex-shrink-0">{pct}%</span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ── Widget 2: Follow-Up Needed ────────────────────────────────────────────────
function FollowUpNeeded({ merchants }: { merchants: Merchant[] }) {
  const needsFollowUp = merchants
    .filter(m =>
      (m.outreachStatus === 'contacted' || m.outreachStatus === 'responded') &&
      m.lastContactDate !== undefined &&
      daysSince(m.lastContactDate) > 3,
    )
    .sort((a, b) => {
      const da = a.lastContactDate ? daysSince(a.lastContactDate) : 0
      const db = b.lastContactDate ? daysSince(b.lastContactDate) : 0
      return db - da // most overdue first
    })

  const visible = needsFollowUp.slice(0, 5)
  const overflow = needsFollowUp.length - 5

  const stageInfo = (status: OutreachStatus) =>
    OUTREACH_STAGES.find(s => s.status === status) ?? { label: status, color: 'secondary' as const }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-sm font-semibold text-navy dark:text-white">Follow-Up Needed</CardTitle>
          </div>
          {needsFollowUp.length > 0 && (
            <Badge variant="warning" className="text-xs">
              {needsFollowUp.length}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4">
        {needsFollowUp.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-brand-green">
            <CheckCheck className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">All outreach is current</span>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map(m => {
              const days = m.lastContactDate ? daysSince(m.lastContactDate) : 0
              const stage = stageInfo(m.outreachStatus)
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2 py-1.5 border-b border-gray-50 dark:border-navy/20 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy dark:text-white truncate">{m.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Last contacted {days} day{days !== 1 ? 's' : ''} ago</p>
                  </div>
                  <Badge variant={stage.color} className="text-xs flex-shrink-0">{stage.label}</Badge>
                  <Link href="/merchants" className="text-xs text-coral hover:underline font-medium flex-shrink-0">
                    View
                  </Link>
                </div>
              )
            })}
            {overflow > 0 && (
              <Link
                href="/merchants"
                className="flex items-center gap-1 text-xs text-coral hover:underline font-medium pt-1"
              >
                View all {needsFollowUp.length} <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Widget 3: Today's SOPs ────────────────────────────────────────────────────
function TodaysSOPs({ sops: initialSOPs }: { sops: SOP[] }) {
  // We track completion state locally so "Mark Done" refreshes immediately
  const [completionState, setCompletionState] = useState<Record<string, boolean>>({})

  const relevantSOPs = initialSOPs.filter(
    s => s.frequency === 'daily' || s.frequency === 'weekly',
  )

  const isCompleted = useCallback(
    (sop: SOP): boolean => {
      if (completionState[sop.id] !== undefined) return completionState[sop.id]
      if (sop.frequency === 'daily') return isSOPCompletedToday(sop.id)
      if (sop.frequency === 'weekly') return isSOPCompletedThisWeek(sop.id)
      return false
    },
    [completionState],
  )

  function handleMarkDone(sopId: string) {
    logSOPCompletion(sopId)
    setCompletionState(prev => ({ ...prev, [sopId]: true }))
  }

  const completedCount = relevantSOPs.filter(s => isCompleted(s)).length
  const total = relevantSOPs.length

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-brand-green" />
            <CardTitle className="text-sm font-semibold text-navy dark:text-white">Today's SOPs</CardTitle>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {completedCount}/{total} done
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4">
        {relevantSOPs.length === 0 ? (
          <p className="text-sm text-slate-500 py-3">No daily or weekly SOPs found.</p>
        ) : (
          <div className="space-y-2">
            {relevantSOPs.map(sop => {
              const done = isCompleted(sop)
              return (
                <div
                  key={sop.id}
                  className={`flex items-start gap-2 py-2 border-b border-gray-50 dark:border-navy/20 last:border-0 ${
                    done ? 'opacity-60' : ''
                  }`}
                >
                  {/* Done indicator */}
                  <div className="flex-shrink-0 mt-0.5">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-brand-green" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-snug ${done ? 'line-through text-slate-400' : 'text-navy dark:text-white'}`}>
                      {sop.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs py-0">{sop.owner}</Badge>
                      <Badge
                        variant={sop.frequency === 'daily' ? 'warning' : 'navy'}
                        className="text-xs py-0 capitalize"
                      >
                        {sop.frequency}
                      </Badge>
                      <span className="flex items-center gap-0.5 text-xs text-slate-400">
                        <Timer className="h-3 w-3" />
                        ~{sop.estimatedMinutes} min
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  {done ? (
                    <span className="text-xs text-brand-green font-semibold flex-shrink-0 mt-0.5">Done</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs h-7 px-2 flex-shrink-0"
                      onClick={() => handleMarkDone(sop.id)}
                    >
                      Mark Done
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Summary line */}
        {total > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-navy/20 flex items-center gap-1.5">
            <div className="h-1.5 flex-1 bg-gray-100 dark:bg-navy/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-green rounded-full transition-all duration-500"
                style={{ width: total > 0 ? `${Math.round((completedCount / total) * 100)}%` : '0%' }}
              />
            </div>
            <span className="text-xs text-slate-500 flex-shrink-0">
              {completedCount}/{total} completed
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Widget 4: Recent Activity ─────────────────────────────────────────────────
const entityIcon: Record<ActivityEntityType, React.ElementType> = {
  'post': FileText, 'merchant': Users, 'deal': TrendingUp, 'sop': ClipboardList,
  'campaign': Megaphone, 'project-card': LayoutGrid, 'script': MessageSquare, 'sequence': Mail,
}
const entityColor: Record<ActivityEntityType, string> = {
  'post': 'text-blue-500', 'merchant': 'text-green-500', 'deal': 'text-purple-500',
  'sop': 'text-amber-500', 'campaign': 'text-coral', 'project-card': 'text-pink-500',
  'script': 'text-teal-500', 'sequence': 'text-indigo-500',
}
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
function RecentActivityWidget({ entries }: { entries: ActivityEntry[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-coral" />
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          </div>
          <Link href="/feed" className="text-xs text-coral hover:underline font-medium flex items-center gap-0.5">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {entries.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No activity yet</p>
        ) : (
          <div className="space-y-2">
            {entries.map(e => {
              const Icon = entityIcon[e.entityType]
              return (
                <div key={e.id} className="flex items-start gap-2.5">
                  <div className="mt-0.5 h-6 w-6 rounded-md bg-slate-50 dark:bg-navy-600 flex items-center justify-center flex-shrink-0">
                    <Icon className={`h-3.5 w-3.5 ${entityColor[e.entityType]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-navy dark:text-slate-200 leading-snug">
                      <span className="font-semibold">{e.userName}</span>{' '}
                      <span className="text-slate-500">{e.action}</span>{' '}
                      <span className="font-medium truncate">{e.entityName}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(e.timestamp)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [counts, setCounts] = useState({
    posts: 0,
    scripts: 0,
    sequences: 0,
    campaigns: 0,
    sops: 0,
    brandResponses: 0,
  })
  const [connections, setConnections] = useState({
    buffer: false,
    brevo: false,
    notion: false,
  })
  const [pipelineCounts, setPipelineCounts] = useState<Record<OutreachStatus, number>>({
    'not-contacted': 0,
    contacted: 0,
    responded: 0,
    interested: 0,
    'signed-up': 0,
    declined: 0,
    'not-a-fit': 0,
  })
  const [readinessMetrics, setReadinessMetrics] = useState<ReadinessMetric[]>([])
  const [allMerchants, setAllMerchants] = useState<Merchant[]>([])
  const [allSOPs, setAllSOPs] = useState<SOP[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([])

  useEffect(() => {
    initializeStorage()
    const posts = getPosts()
    const scripts = getScripts()
    const sequences = getSequences()
    const campaigns = getCampaigns()
    const sops = getSOPs()
    const brandResponses = getBrandResponses()
    const merchants = getMerchants()
    const settings = getSettings()

    // ── Basic counts ──────────────────────────────────────────────────────────
    setCounts({
      posts: posts.length,
      scripts: scripts.length,
      sequences: sequences.length,
      campaigns: campaigns.length,
      sops: sops.length,
      brandResponses: brandResponses.length,
    })

    setConnections({
      buffer: !!settings.bufferAccessToken,
      brevo: !!settings.brevoApiKey,
      notion: !!settings.notionToken,
    })

    const pipeline: Record<string, number> = {}
    merchants.forEach(m => {
      pipeline[m.outreachStatus] = (pipeline[m.outreachStatus] ?? 0) + 1
    })
    setPipelineCounts(prev => ({ ...prev, ...pipeline }))

    // ── Readiness metrics ─────────────────────────────────────────────────────
    const sellersCount = merchants.filter(m => m.outreachStatus === 'signed-up').length
    const postsReadyCount = posts.filter(p => p.status === 'ready' || p.status === 'scheduled' || p.status === 'published').length
    const seqReadyCount = sequences.filter(s => s.status === 'ready' || s.status === 'active').length
    const campReadyCount = campaigns.filter(c => c.status === 'ready' || c.status === 'active').length
    const sopsCount = sops.length
    const brandRespCount = brandResponses.length

    setReadinessMetrics([
      {
        icon: Users,
        label: 'Sellers recruited',
        current: sellersCount,
        target: 30,
        display: `${sellersCount}/30 sellers`,
      },
      {
        icon: FileText,
        label: 'Posts ready',
        current: postsReadyCount,
        target: 20,
        display: `${postsReadyCount}/20 posts ready`,
      },
      {
        icon: Mail,
        label: 'Email sequences live',
        current: seqReadyCount,
        target: 3,
        display: `${seqReadyCount}/3 sequences ready`,
      },
      {
        icon: Megaphone,
        label: 'Campaign bundles ready',
        current: campReadyCount,
        target: 3,
        display: `${campReadyCount}/3 campaigns`,
      },
      {
        icon: BookOpen,
        label: 'SOPs documented',
        current: sopsCount,
        target: 5,
        display: `${sopsCount}/5 SOPs`,
      },
      {
        icon: MessageCircle,
        label: 'Brand responses ready',
        current: brandRespCount,
        target: 20,
        display: `${brandRespCount}/20 responses`,
      },
    ])

    setAllMerchants(merchants)
    setAllSOPs(sops)
    setRecentActivity(getActivityFeed().slice(0, 10))
  }, [])

  const statCards = [
    { label: 'Posts', count: counts.posts, icon: FileText, href: '/posts', color: 'text-coral' },
    { label: 'Scripts', count: counts.scripts, icon: MessageSquare, href: '/scripts', color: 'text-brand-purple' },
    { label: 'Sequences', count: counts.sequences, icon: Mail, href: '/sequences', color: 'text-brand-green' },
    { label: 'Campaigns', count: counts.campaigns, icon: Megaphone, href: '/campaigns', color: 'text-navy' },
    { label: 'SOPs', count: counts.sops, icon: BookOpen, href: '/sops', color: 'text-amber-600' },
    { label: 'Brand Responses', count: counts.brandResponses, icon: MessageCircle, href: '/brand', color: 'text-slate-500' },
  ]

  const connectionCards = [
    { name: 'Buffer', connected: connections.buffer, description: 'Social scheduling', href: '/settings' },
    { name: 'Brevo', connected: connections.brevo, description: 'Email sequences', href: '/settings' },
    { name: 'Notion', connected: connections.notion, description: 'Content sync', href: '/settings' },
  ]

  const quickActions = [
    {
      title: 'New Post',
      description: 'Create a social media post',
      href: '/posts',
      icon: FileText,
      accent: 'bg-coral/10 text-coral',
    },
    {
      title: 'New Merchant',
      description: 'Add a merchant to the pipeline',
      href: '/merchants',
      icon: ShoppingBag,
      accent: 'bg-navy/10 text-navy',
    },
    {
      title: 'Outreach Pipeline',
      description: 'View and manage outreach',
      href: '/merchants',
      icon: Users,
      accent: 'bg-brand-purple/10 text-brand-purple',
    },
    {
      title: "Today's Content",
      description: 'Browse ready-to-post content',
      href: '/posts',
      icon: Megaphone,
      accent: 'bg-brand-green/10 text-brand-green',
    },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">
            Good {getGreeting()}, Team
          </h1>
          <p className="text-sm text-slate-500 mt-1">{formatTodayDate()}</p>
        </div>
        <Link href="/posts">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>

      {/* ── WIDGET 1: Launch Readiness Scorecard (full-width) ─────────────── */}
      <LaunchReadinessScorecard metrics={readinessMetrics} />

      {/* ── Stats grid ────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Content Library</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statCards.map(card => {
            const Icon = card.icon
            return (
              <Card key={card.label} className="card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg bg-gray-50 dark:bg-navy-700 ${card.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <Link
                      href={card.href}
                      className="text-xs text-coral hover:underline font-medium flex items-center gap-0.5"
                    >
                      View all
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="mt-3">
                    <p className="text-3xl font-bold text-navy dark:text-white">{card.count}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{card.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* ── Integrations ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Integrations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {connectionCards.map(conn => (
            <Card key={conn.name}>
              <CardContent className="p-4 flex items-center gap-4">
                <div
                  className={`h-3 w-3 rounded-full flex-shrink-0 ${
                    conn.connected ? 'bg-brand-green shadow-[0_0_0_3px_#E8F5EE]' : 'bg-slate-300'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy dark:text-white">{conn.name}</p>
                  <p className="text-xs text-slate-500">{conn.description}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {conn.connected ? (
                    <CheckCircle2 className="h-4 w-4 text-brand-green" />
                  ) : (
                    <XCircle className="h-4 w-4 text-slate-300" />
                  )}
                  <span className={`text-xs font-medium ${conn.connected ? 'text-brand-green' : 'text-slate-400'}`}>
                    {conn.connected ? 'Connected' : 'Not configured'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Two-column layout: left = quick actions + pipeline, right = widgets ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column (60%) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quick actions */}
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map(action => {
                const Icon = action.icon
                return (
                  <Link key={action.title} href={action.href}>
                    <Card className="card-hover cursor-pointer h-full">
                      <CardContent className="p-4 flex flex-col gap-3">
                        <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl ${action.accent}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-navy dark:text-white">{action.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{action.description}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-coral font-medium mt-auto">
                          Go <ArrowRight className="h-3 w-3" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </section>

          {/* Merchant pipeline funnel */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Merchant Outreach Pipeline</h2>
              <Link href="/merchants" className="text-xs text-coral hover:underline font-medium flex items-center gap-0.5">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 flex-wrap">
                  {OUTREACH_STAGES.map((stage, i) => (
                    <div key={stage.status} className="flex items-center gap-2">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="text-2xl font-bold text-navy dark:text-white">
                          {pipelineCounts[stage.status] ?? 0}
                        </span>
                        <Badge variant={stage.color}>{stage.label}</Badge>
                      </div>
                      {i < OUTREACH_STAGES.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-slate-300 flex-shrink-0 mx-1" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Right column (40%) — WIDGET 2 + WIDGET 3 */}
        <div className="lg:col-span-2 space-y-4">
          {/* WIDGET 2: Follow-Up Needed */}
          <FollowUpNeeded merchants={allMerchants} />

          {/* WIDGET 3: Today's SOPs */}
          <TodaysSOPs sops={allSOPs} />

          {/* WIDGET 4: Recent Activity */}
          <RecentActivityWidget entries={recentActivity} />
        </div>
      </div>
    </div>
  )
}
