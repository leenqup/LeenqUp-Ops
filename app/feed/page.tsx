'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  FileText,
  Users,
  TrendingUp,
  ClipboardList,
  Megaphone,
  LayoutGrid,
  MessageSquare,
  Mail,
  Trash2,
  ChevronDown,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getActivityFeed } from '@/lib/storage'
import type { ActivityEntry, ActivityEntityType, ActivityAction } from '@/types'

// ── Helpers ───────────────────────────────────────────────────

const entityConfig: Record<ActivityEntityType, { icon: React.ElementType; color: string; href: (id: string) => string }> = {
  'post':          { icon: FileText,      color: 'text-blue-500',   href: () => '/posts' },
  'merchant':      { icon: Users,         color: 'text-green-500',  href: (id) => `/merchants/${id}` },
  'deal':          { icon: TrendingUp,    color: 'text-purple-500', href: () => '/crm' },
  'sop':           { icon: ClipboardList, color: 'text-amber-500',  href: () => '/sops' },
  'campaign':      { icon: Megaphone,     color: 'text-coral',      href: () => '/campaigns' },
  'project-card':  { icon: LayoutGrid,    color: 'text-pink-500',   href: () => '/projects' },
  'script':        { icon: MessageSquare, color: 'text-teal-500',   href: () => '/scripts' },
  'sequence':      { icon: Mail,          color: 'text-indigo-500', href: () => '/sequences' },
}

const actionLabel: Record<ActivityAction, string> = {
  'created':        'created',
  'updated':        'updated',
  'deleted':        'deleted',
  'status-changed': 'changed status of',
  'stage-changed':  'moved',
  'completed':      'completed',
  'scheduled':      'scheduled',
  'published':      'published',
  'contacted':      'contacted',
  'invited':        'invited',
  'joined':         'joined',
}

const actionBadgeVariant: Record<ActivityAction, string> = {
  'created':        'bg-brand-green/10 text-brand-green',
  'updated':        'bg-slate-100 text-slate-600 dark:bg-navy-500 dark:text-slate-300',
  'deleted':        'bg-red-100 text-red-600',
  'status-changed': 'bg-amber-100 text-amber-700',
  'stage-changed':  'bg-purple-100 text-purple-700',
  'completed':      'bg-brand-green/10 text-brand-green',
  'scheduled':      'bg-blue-100 text-blue-700',
  'published':      'bg-coral/10 text-coral',
  'contacted':      'bg-teal-100 text-teal-700',
  'invited':        'bg-indigo-100 text-indigo-700',
  'joined':         'bg-brand-green/10 text-brand-green',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function groupByDate(entries: ActivityEntry[]): Array<{ label: string; entries: ActivityEntry[] }> {
  const groups: Record<string, ActivityEntry[]> = {}
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  for (const entry of entries) {
    const date = entry.timestamp.slice(0, 10)
    const label = date === today ? 'Today' : date === yesterday ? 'Yesterday' : new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    if (!groups[label]) groups[label] = []
    groups[label].push(entry)
  }

  return Object.entries(groups).map(([label, entries]) => ({ label, entries }))
}

const PAGE_SIZE = 30

export default function FeedPage() {
  const [feed, setFeed] = useState<ActivityEntry[]>([])
  const [filter, setFilter] = useState<ActivityEntityType | 'all'>('all')
  const [page, setPage] = useState(1)
  const [loaded, setLoaded] = useState(false)

  const reload = () => {
    setFeed(getActivityFeed())
    setLoaded(true)
  }

  useEffect(() => { reload() }, [])

  const filtered = filter === 'all' ? feed : feed.filter(e => e.entityType === filter)
  const paginated = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = paginated.length < filtered.length
  const grouped = groupByDate(paginated)

  const filterTabs: Array<{ key: ActivityEntityType | 'all'; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'merchant', label: 'Merchants' },
    { key: 'deal', label: 'Deals' },
    { key: 'post', label: 'Posts' },
    { key: 'sop', label: 'SOPs' },
    { key: 'campaign', label: 'Campaigns' },
    { key: 'project-card', label: 'Projects' },
  ]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-coral/10 flex items-center justify-center">
            <Activity className="h-5 w-5 text-coral" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy dark:text-white">Activity Feed</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {feed.length === 0 ? 'No activity yet' : `${feed.length} action${feed.length !== 1 ? 's' : ''} logged`}
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={reload} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setFilter(tab.key); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === tab.key
                ? 'bg-coral text-white'
                : 'bg-slate-100 dark:bg-navy-500 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {!loaded ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No activity yet</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Actions across posts, merchants, deals, SOPs and more will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ label, entries }) => (
            <div key={label}>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">{label}</p>
              <div className="space-y-1">
                {entries.map(entry => {
                  const cfg = entityConfig[entry.entityType]
                  const Icon = cfg.icon
                  const href = cfg.href(entry.entityId)
                  return (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white dark:bg-navy-700 border border-gray-100 dark:border-navy-600 hover:border-coral/30 transition-colors group"
                    >
                      {/* Entity icon */}
                      <div className={`mt-0.5 h-8 w-8 rounded-lg bg-slate-50 dark:bg-navy-600 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-navy dark:text-white">
                            {entry.userName}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionBadgeVariant[entry.action]}`}>
                            {actionLabel[entry.action]}
                          </span>
                          <Link
                            href={href}
                            className="text-sm text-navy dark:text-slate-200 font-medium truncate hover:text-coral transition-colors"
                          >
                            {entry.entityName}
                          </Link>
                        </div>
                        {entry.detail && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{entry.detail}</p>
                        )}
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{timeAgo(entry.timestamp)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="text-center pt-2">
              <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} className="gap-2">
                <ChevronDown className="h-4 w-4" />
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
