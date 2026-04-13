'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sun,
  Moon,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Users,
  LayoutGrid,
  Megaphone,
  Calendar,
  ArrowRight,
  TrendingUp,
  MessageCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toaster'
import {
  getSOPs,
  isSOPCompletedToday,
  isSOPCompletedThisWeek,
  logSOPCompletion,
  getMerchants,
  getProjectBoards,
  getCardsForBoard,
  getCampaigns,
  getPosts,
  getDeals,
  initializeStorage,
} from '@/lib/storage'
import { cn } from '@/lib/utils'
import type { SOP, Merchant, ProjectCard, Campaign, Post, Deal } from '@/types'

// ─── Today helpers ─────────────────────────────────────────────────────────────

function getTodayGreeting() {
  const h = new Date().getHours()
  if (h < 12) return { word: 'morning', useMoon: false }
  if (h < 17) return { word: 'afternoon', useMoon: false }
  return { word: 'evening', useMoon: true }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function dayOfWeek() {
  return new Date().getDay() // 0=Sun
}

function isDueToday(sop: SOP): boolean {
  if (sop.frequency === 'daily') return true
  if (sop.frequency === 'weekly') return dayOfWeek() === 1 // Monday
  if (sop.frequency === 'monthly') return new Date().getDate() === 1
  return false
}

function isDueForFollowUp(m: Merchant): boolean {
  if (m.outreachStatus !== 'contacted' && m.outreachStatus !== 'responded') return false
  if (!m.lastContactDate) return false
  const last = new Date(m.lastContactDate)
  const now = new Date()
  return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)) > 3
}

function isCardDueToday(card: ProjectCard): boolean {
  if (!card.dueDate || card.status === 'done') return false
  return card.dueDate.slice(0, 10) <= todayStr()
}

function isPostScheduledToday(post: Post): boolean {
  if (!post.scheduledFor) return false
  return post.scheduledFor.slice(0, 10) === todayStr()
}

// A campaign "has deployment today" if it's active and its deploymentSchedule
// string mentions today's date or "day 1/day 2" style entries.
// Since deploymentSchedule is freeform text, we show all active campaigns
// and surface the schedule text for the team to act on manually.
function isActiveCampaign(c: Campaign): boolean {
  return c.status === 'active' || c.status === 'ready'
}

// ─── Section components ────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label, count, color }: {
  icon: React.ElementType
  label: string
  count: number
  color: string
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center', color)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <h2 className="text-sm font-semibold text-navy dark:text-white">{label}</h2>
      {count > 0 && (
        <span className="ml-auto text-xs font-semibold bg-coral text-white px-2 py-0.5 rounded-full">{count}</span>
      )}
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-5 text-sm text-slate-400 dark:text-slate-500 italic">
      {label}
    </div>
  )
}

// ─── SOPs Section ─────────────────────────────────────────────────────────────

function SOPsSection({ sops }: { sops: SOP[] }) {
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set())

  useEffect(() => {
    const set = new Set<string>()
    sops.forEach(s => { if (isSOPCompletedToday(s.id)) set.add(s.id) })
    setCompletedToday(set)
  }, [sops])

  const handleComplete = (sopId: string, title: string) => {
    logSOPCompletion(sopId, 'me')
    setCompletedToday(prev => new Set([...prev, sopId]))
    toast(`✓ "${title}" marked complete`)
  }

  if (sops.length === 0) return <EmptyState label="No SOPs due today" />

  return (
    <div className="space-y-2">
      {sops.map(sop => {
        const done = completedToday.has(sop.id)
        return (
          <div
            key={sop.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border transition-all',
              done
                ? 'bg-brand-green/5 border-brand-green/20 opacity-60'
                : 'bg-white dark:bg-navy-600 border-gray-100 dark:border-navy-500 hover:border-coral/30',
            )}
          >
            <button
              onClick={() => !done && handleComplete(sop.id, sop.title)}
              className="mt-0.5 shrink-0"
              disabled={done}
            >
              {done
                ? <CheckCircle2 className="h-5 w-5 text-brand-green" />
                : <Circle className="h-5 w-5 text-slate-300 hover:text-coral transition-colors" />
              }
            </button>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium', done ? 'line-through text-slate-400' : 'text-navy dark:text-white')}>{sop.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sop.estimatedMinutes} min · {sop.owner}</p>
            </div>
            <Badge variant="secondary" className="text-[10px] shrink-0 capitalize">{sop.frequency}</Badge>
          </div>
        )
      })}
    </div>
  )
}

// ─── Follow-ups Section ────────────────────────────────────────────────────────

function FollowUpsSection({ merchants }: { merchants: Merchant[] }) {
  const router = useRouter()
  if (merchants.length === 0) return <EmptyState label="No merchants overdue for follow-up" />

  return (
    <div className="space-y-2">
      {merchants.slice(0, 8).map(m => {
        const rawPhone = (m.whatsapp || m.phone || '').replace(/\D/g, '')
        const daysSince = m.lastContactDate
          ? Math.floor((new Date().getTime() - new Date(m.lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
          : null
        return (
          <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-navy-500 bg-white dark:bg-navy-600 hover:border-amber-300 dark:hover:border-amber-600 transition-all">
            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{m.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-navy dark:text-white truncate">{m.name}</p>
              <p className="text-xs text-slate-400">
                {m.category} · {m.city}
                {daysSince !== null && <span className="text-amber-600 dark:text-amber-400 ml-1">· {daysSince}d ago</span>}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {rawPhone && (
                <a
                  href={`https://wa.me/${rawPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-[#25D366]/10 text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                  title="Open WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              )}
              <Badge variant={m.outreachStatus === 'responded' ? 'navy' : 'warning'} className="text-[10px]">
                {m.outreachStatus === 'responded' ? 'Responded' : 'Contacted'}
              </Badge>
            </div>
          </div>
        )
      })}
      {merchants.length > 8 && (
        <button
          onClick={() => router.push('/merchants')}
          className="w-full text-center text-xs text-coral hover:underline py-1"
        >
          +{merchants.length - 8} more — view all in Merchants
        </button>
      )}
    </div>
  )
}

// ─── Project Cards Section ─────────────────────────────────────────────────────

function ProjectCardsSection({ cards }: { cards: Array<ProjectCard & { boardTitle: string }> }) {
  const router = useRouter()
  if (cards.length === 0) return <EmptyState label="No project cards due today" />

  const priorityColor = (p: string) => {
    if (p === 'urgent') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    if (p === 'high') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
    if (p === 'medium') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
    return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
  }

  const isOverdue = (dueDate: string) => dueDate.slice(0, 10) < todayStr()

  return (
    <div className="space-y-2">
      {cards.slice(0, 8).map(card => (
        <div
          key={card.id}
          onClick={() => router.push(`/projects/${card.boardId}`)}
          className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-navy-500 bg-white dark:bg-navy-600 hover:border-coral/30 cursor-pointer transition-all"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-navy dark:text-white truncate">{card.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.boardTitle}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize', priorityColor(card.priority))}>
              {card.priority}
            </span>
            {card.dueDate && isOverdue(card.dueDate) && (
              <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-0.5">
                <AlertTriangle className="h-3 w-3" /> Overdue
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Posts Section ─────────────────────────────────────────────────────────────

function PostsSection({ posts }: { posts: Post[] }) {
  const router = useRouter()
  if (posts.length === 0) return <EmptyState label="No posts scheduled for today" />

  const platformColor = (p: string) => {
    const map: Record<string, string> = {
      instagram: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      facebook: 'bg-navy/10 text-navy dark:bg-navy/30 dark:text-blue-300',
      linkedin: 'bg-navy/10 text-navy dark:bg-navy/30 dark:text-blue-300',
      twitter: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
      whatsapp: 'bg-[#25D366]/10 text-[#128C7E] dark:text-[#25D366]',
    }
    return map[p] ?? 'bg-slate-100 text-slate-600'
  }

  return (
    <div className="space-y-2">
      {posts.map(post => (
        <div
          key={post.id}
          onClick={() => router.push('/posts')}
          className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-navy-500 bg-white dark:bg-navy-600 hover:border-coral/30 cursor-pointer transition-all"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-navy dark:text-white truncate">
              {post.title || post.body.slice(0, 60)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              {post.scheduledFor
                ? new Date(post.scheduledFor).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                : 'Today'}
            </p>
          </div>
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize shrink-0', platformColor(post.platform))}>
            {post.platform}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Campaigns Section ─────────────────────────────────────────────────────────

function CampaignsSection({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter()
  if (campaigns.length === 0) return <EmptyState label="No active campaigns running" />

  const statusVariant = (s: string): 'success' | 'warning' | 'secondary' | 'default' => {
    if (s === 'active') return 'success'
    if (s === 'ready') return 'warning'
    return 'secondary'
  }

  const phaseColor = (p: string) => {
    if (p === 'launch-day') return 'bg-coral/10 text-coral'
    if (p === 'pre-launch') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
    return 'bg-brand-green/10 text-brand-green'
  }

  return (
    <div className="space-y-2">
      {campaigns.map(c => {
        const executedCount = c.executedPosts?.length ?? 0
        const totalAssets = (c.assets.posts?.length ?? 0) + (c.assets.emails?.length ?? 0)
        const pct = totalAssets > 0 ? Math.round((executedCount / totalAssets) * 100) : 0
        return (
          <div
            key={c.id}
            onClick={() => router.push('/campaigns')}
            className="p-3 rounded-lg border border-gray-100 dark:border-navy-500 bg-white dark:bg-navy-600 hover:border-coral/30 cursor-pointer transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-navy dark:text-white truncate">{c.name}</p>
                  <Badge variant={statusVariant(c.status)} className="text-[10px] capitalize">{c.status}</Badge>
                </div>
                {c.deploymentSchedule && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.deploymentSchedule}</p>
                )}
                {totalAssets > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1 bg-gray-100 dark:bg-navy-400 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-green rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{executedCount}/{totalAssets} executed</span>
                  </div>
                )}
              </div>
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize', phaseColor(c.phase))}>
                {c.phase.replace(/-/g, ' ')}
              </span>
            </div>
          </div>
        )
      })}
      <button
        onClick={() => router.push('/campaigns')}
        className="w-full text-center text-xs text-coral hover:underline py-1 flex items-center justify-center gap-1"
      >
        Open Campaigns <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  )
}

// ─── Pipeline Pulse ────────────────────────────────────────────────────────────

function PipelinePulse({ deals }: { deals: Deal[] }) {
  const router = useRouter()
  const hot = deals.filter(d =>
    d.stage === 'verbal-yes' || d.stage === 'negotiating' || d.stage === 'contract-sent'
  )
  const stageLabel = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const totalWeighted = deals.reduce((sum, d) => sum + (d.weightedValue ?? 0), 0)

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-coral" />
            <span className="text-sm font-semibold text-navy dark:text-white">Pipeline Pulse</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => router.push('/crm')} className="text-xs text-coral gap-1 h-7">
            View Pipeline <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-navy dark:text-white">{deals.length}</p>
            <p className="text-xs text-slate-400">Total Deals</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-coral">{hot.length}</p>
            <p className="text-xs text-slate-400">Hot Deals</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-brand-green">${totalWeighted.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Weighted GMV</p>
          </div>
        </div>
        {hot.length > 0 && (
          <div className="space-y-1.5">
            {hot.slice(0, 3).map(deal => (
              <div key={deal.id} className="flex items-center gap-2 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-coral shrink-0" />
                <span className="flex-1 text-navy dark:text-white font-medium truncate">{deal.title}</span>
                <Badge variant="warning" className="text-[10px]">{stageLabel(deal.stage)}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function TodayPage() {
  const [sopsDue, setSopsDue] = useState<SOP[]>([])
  const [followUps, setFollowUps] = useState<Merchant[]>([])
  const [cardsDue, setCardsDue] = useState<Array<ProjectCard & { boardTitle: string }>>([])
  const [postsToday, setPostsToday] = useState<Post[]>([])
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    initializeStorage()

    // SOPs due today
    const allSOPs = getSOPs()
    setSopsDue(allSOPs.filter(s => {
      if (!isDueToday(s)) return false
      if (s.frequency === 'daily') return !isSOPCompletedToday(s.id)
      if (s.frequency === 'weekly') return !isSOPCompletedThisWeek(s.id)
      return true
    }))

    // Merchants overdue for follow-up
    const allMerchants = getMerchants()
    setFollowUps(allMerchants.filter(isDueForFollowUp))

    // Project cards due today
    const boards = getProjectBoards()
    const allCardsDue: Array<ProjectCard & { boardTitle: string }> = []
    boards.forEach(board => {
      const cards = getCardsForBoard(board.id)
      cards.filter(isCardDueToday).forEach(card => {
        allCardsDue.push({ ...card, boardTitle: board.title })
      })
    })
    allCardsDue.sort((a, b) => {
      const pOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      return (pOrder[a.priority] ?? 3) - (pOrder[b.priority] ?? 3)
    })
    setCardsDue(allCardsDue)

    // Posts scheduled today
    const allPosts = getPosts()
    setPostsToday(allPosts.filter(isPostScheduledToday))

    // Active / ready campaigns
    const allCampaigns = getCampaigns()
    setActiveCampaigns(allCampaigns.filter(isActiveCampaign))

    // CRM deals (hot ones)
    const allDeals = getDeals()
    const activeDeals = allDeals.filter(d => d.stage !== 'closed-won' && d.stage !== 'closed-lost')
    setDeals(activeDeals)

    setLoaded(true)
  }, [])

  const totalItems = sopsDue.length + followUps.length + cardsDue.length + postsToday.length + activeCampaigns.length
  const now = new Date()
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          {(() => {
            const g = getTodayGreeting()
            return (
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${g.useMoon ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                {g.useMoon
                  ? <Moon className="h-5 w-5 text-indigo-400" />
                  : <Sun className="h-5 w-5 text-amber-500" />}
              </div>
            )
          })()}
          <div>
            <h1 className="text-2xl font-bold text-navy dark:text-white">Good {getTodayGreeting().word}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{dateLabel}</p>
          </div>
        </div>
        {loaded && totalItems === 0 ? (
          <div className="mt-4 rounded-xl bg-brand-green/10 border border-brand-green/20 px-5 py-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-brand-green shrink-0" />
            <p className="text-sm font-medium text-brand-green">All clear — nothing urgent on the board today.</p>
          </div>
        ) : loaded ? (
          <div className="mt-4 rounded-xl bg-coral/5 border border-coral/20 px-5 py-3 flex items-center gap-3">
            <Clock className="h-5 w-5 text-coral shrink-0" />
            <p className="text-sm font-medium text-coral">
              {totalItems} item{totalItems !== 1 ? 's' : ''} need your attention today
            </p>
          </div>
        ) : null}
      </div>

      <div className="space-y-6">
        {/* Pipeline Pulse — always visible */}
        <PipelinePulse deals={deals} />

        {/* SOPs Due */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader
              icon={CheckCircle2}
              label="SOPs Due Today"
              count={sopsDue.length}
              color="bg-brand-purple/10 text-brand-purple"
            />
          </CardHeader>
          <CardContent className="pt-0">
            <SOPsSection sops={sopsDue} />
          </CardContent>
        </Card>

        {/* Merchant Follow-ups */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader
              icon={Users}
              label="Merchants Due for Follow-Up"
              count={followUps.length}
              color="bg-amber-100 text-amber-600"
            />
          </CardHeader>
          <CardContent className="pt-0">
            <FollowUpsSection merchants={followUps} />
          </CardContent>
        </Card>

        {/* Project Cards */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader
              icon={LayoutGrid}
              label="Project Cards Due"
              count={cardsDue.length}
              color="bg-navy/10 text-navy dark:bg-white/10 dark:text-white"
            />
          </CardHeader>
          <CardContent className="pt-0">
            <ProjectCardsSection cards={cardsDue} />
          </CardContent>
        </Card>

        {/* Posts Scheduled */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader
              icon={Calendar}
              label="Posts Scheduled Today"
              count={postsToday.length}
              color="bg-brand-purple/10 text-brand-purple"
            />
          </CardHeader>
          <CardContent className="pt-0">
            <PostsSection posts={postsToday} />
          </CardContent>
        </Card>

        {/* Active Campaigns */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader
              icon={Megaphone}
              label="Active Campaigns"
              count={activeCampaigns.length}
              color="bg-brand-green/10 text-brand-green"
            />
          </CardHeader>
          <CardContent className="pt-0">
            <CampaignsSection campaigns={activeCampaigns} />
          </CardContent>
        </Card>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Merchants', href: '/merchants', icon: Users, color: 'text-coral' },
            { label: 'CRM Pipeline', href: '/crm', icon: TrendingUp, color: 'text-brand-purple' },
            { label: 'Projects', href: '/projects', icon: LayoutGrid, color: 'text-navy dark:text-white' },
            { label: 'Campaigns', href: '/campaigns', icon: Megaphone, color: 'text-brand-green' },
          ].map(({ label, href, icon: Icon, color }) => (
            <a
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 dark:border-navy-500 bg-white dark:bg-navy-600 hover:border-coral/30 transition-all text-center group"
            >
              <Icon className={cn('h-5 w-5 group-hover:scale-110 transition-transform', color)} />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
