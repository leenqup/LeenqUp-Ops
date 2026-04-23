'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Users, MessageSquare, TrendingUp, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getMerchants, getScripts, initializeStorage } from '@/lib/storage'
import { cn } from '@/lib/utils'
import type { Merchant, Script, OutreachStatus, ScriptType, ScriptChannel } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PipelineStage {
  key: OutreachStatus
  label: string
  color: string
  barColor: string
}

interface ScriptGroup {
  type: ScriptType
  count: number
  avgWordCount: number
  sampleTitles: string[]
}

interface ChannelCount {
  name: string
  count: number
  color: string
  bgColor: string
}

interface VelocityKPI {
  label: string
  value: number
  icon: React.ElementType
  color: string
  iconBg: string
  sub: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PIPELINE_STAGES: PipelineStage[] = [
  { key: 'not-contacted', label: 'Not Contacted', color: 'text-slate-600 dark:text-slate-400', barColor: 'bg-slate-400' },
  { key: 'contacted',     label: 'Contacted',     color: 'text-blue-600 dark:text-blue-400',   barColor: 'bg-blue-500'   },
  { key: 'responded',     label: 'Responded',     color: 'text-indigo-600 dark:text-indigo-400', barColor: 'bg-indigo-500' },
  { key: 'interested',    label: 'Interested',    color: 'text-purple-600 dark:text-purple-400', barColor: 'bg-purple-500' },
  { key: 'signed-up',     label: 'Signed Up',     color: 'text-emerald-600 dark:text-emerald-400', barColor: 'bg-emerald-500' },
  { key: 'declined',      label: 'Declined',      color: 'text-amber-600 dark:text-amber-400',  barColor: 'bg-amber-500'  },
  { key: 'not-a-fit',     label: 'Not a Fit',     color: 'text-red-600 dark:text-red-400',      barColor: 'bg-red-500'    },
]

const SCRIPT_TYPE_COLORS: Record<ScriptType, string> = {
  'cold-outreach':     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'warm-intro':        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'objection-handling': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'follow-up':         'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'close':             'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
}

const SCRIPT_TYPE_LABELS: Record<ScriptType, string> = {
  'cold-outreach':     'Cold Outreach',
  'warm-intro':        'Warm Intro',
  'objection-handling': 'Objection Handling',
  'follow-up':         'Follow-Up',
  'close':             'Close',
}

const CHANNEL_CONFIG: Array<{
  name: string
  match: (title: string, channel: ScriptChannel) => boolean
  color: string
  bgColor: string
}> = [
  {
    name: 'WhatsApp',
    match: (title, channel) => channel === 'whatsapp' || title.toLowerCase().includes('whatsapp'),
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    name: 'Email',
    match: (title, channel) => channel === 'email' || title.toLowerCase().includes('email'),
    color: 'bg-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    name: 'LinkedIn',
    match: (title, _channel) => title.toLowerCase().includes('linkedin'),
    color: 'bg-indigo-500',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  {
    name: 'Instagram',
    match: (title, channel) => channel === 'instagram-dm' || title.toLowerCase().includes('instagram'),
    color: 'bg-pink-500',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
  },
  {
    name: 'Facebook',
    match: (title, channel) => channel === 'facebook-messenger' || title.toLowerCase().includes('facebook'),
    color: 'bg-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    name: 'SMS',
    match: (_title, channel) => channel === 'sms',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function isWithinDays(dateStr: string | undefined, days: number): boolean {
  if (!dateStr) return false
  return new Date(dateStr) >= daysAgo(days)
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function inferChannel(title: string, channel: ScriptChannel): string {
  for (const cfg of CHANNEL_CONFIG) {
    if (cfg.match(title, channel)) return cfg.name
  }
  return 'Other'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 mb-0">
      <div className="h-8 w-8 rounded-lg bg-navy/10 dark:bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-navy dark:text-slate-300" />
      </div>
      <div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="mt-0.5">{description}</CardDescription>
      </div>
    </div>
  )
}

// ─── Section 1: Pipeline Funnel ───────────────────────────────────────────────

function PipelineFunnel({ merchants }: { merchants: Merchant[] }) {
  const total = merchants.length
  const counts = PIPELINE_STAGES.map(stage => ({
    ...stage,
    count: merchants.filter(m => m.outreachStatus === stage.key).length,
  }))
  const maxCount = Math.max(...counts.map(c => c.count), 1)

  return (
    <Card>
      <CardHeader className="pb-3">
        <SectionHeader
          icon={BarChart3}
          title="Pipeline Funnel"
          description="Merchant distribution across outreach stages"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 ml-11">
          <span className="font-semibold text-navy dark:text-white">{total.toLocaleString()}</span> total merchants
        </p>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-6">No merchants in your pipeline yet.</p>
        ) : (
          <div className="space-y-2.5">
            {counts.map(stage => {
              const pct = total > 0 ? Math.round((stage.count / total) * 100) : 0
              const barWidth = total > 0 ? (stage.count / maxCount) * 100 : 0
              return (
                <div key={stage.key} className="flex items-center gap-3">
                  <span className={cn('w-32 text-xs font-medium shrink-0', stage.color)}>
                    {stage.label}
                  </span>
                  <div className="flex-1 h-5 bg-gray-100 dark:bg-navy-500/40 rounded-md overflow-hidden">
                    <div
                      className={cn('h-full rounded-md transition-all duration-500', stage.barColor)}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-navy dark:text-white w-6 text-right shrink-0">
                    {stage.count}
                  </span>
                  <span className="text-xs text-slate-400 w-9 shrink-0">
                    {pct}%
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Section 2: Script Inventory by Type ──────────────────────────────────────

function ScriptInventory({ scripts }: { scripts: Script[] }) {
  const allTypes: ScriptType[] = ['cold-outreach', 'warm-intro', 'objection-handling', 'follow-up', 'close']

  const groups: ScriptGroup[] = allTypes.map(type => {
    const group = scripts.filter(s => s.type === type)
    const avgWords = group.length > 0
      ? Math.round(group.reduce((sum, s) => sum + wordCount(s.body), 0) / group.length)
      : 0
    return {
      type,
      count: group.length,
      avgWordCount: avgWords,
      sampleTitles: group.slice(0, 2).map(s => s.title),
    }
  }).filter(g => g.count > 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <SectionHeader
          icon={MessageSquare}
          title="Script Inventory by Type"
          description="Your sales scripts grouped by outreach type"
        />
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-6">No scripts in your library yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-navy-500">
                  <th className="text-left text-xs font-semibold text-slate-500 pb-2 pr-4">Type</th>
                  <th className="text-right text-xs font-semibold text-slate-500 pb-2 pr-4 w-14">Count</th>
                  <th className="text-right text-xs font-semibold text-slate-500 pb-2 pr-4 w-20">Avg Words</th>
                  <th className="text-left text-xs font-semibold text-slate-500 pb-2">Sample Titles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-navy-500/50">
                {groups.map(group => (
                  <tr key={group.type} className="align-top">
                    <td className="py-2.5 pr-4">
                      <Badge className={cn('text-[11px] font-semibold border-0', SCRIPT_TYPE_COLORS[group.type])}>
                        {SCRIPT_TYPE_LABELS[group.type]}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-right text-xs font-semibold text-navy dark:text-white">
                      {group.count}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-xs text-slate-500">
                      {group.avgWordCount > 0 ? group.avgWordCount : '—'}
                    </td>
                    <td className="py-2.5">
                      <div className="space-y-0.5">
                        {group.sampleTitles.map((title, i) => (
                          <p
                            key={i}
                            className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[220px]"
                            title={title}
                          >
                            {title}
                          </p>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Section 3: Outreach Channel Mix ─────────────────────────────────────────

function ChannelMix({ scripts }: { scripts: Script[] }) {
  const channelNames = [...CHANNEL_CONFIG.map(c => c.name), 'Other']

  const channelColorMap: Record<string, { color: string; bgColor: string }> = {
    WhatsApp:  { color: 'bg-emerald-500', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
    Email:     { color: 'bg-blue-500',    bgColor: 'bg-blue-100 dark:bg-blue-900/30'    },
    LinkedIn:  { color: 'bg-indigo-500',  bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'  },
    Instagram: { color: 'bg-pink-500',    bgColor: 'bg-pink-100 dark:bg-pink-900/30'    },
    Facebook:  { color: 'bg-blue-600',    bgColor: 'bg-blue-100 dark:bg-blue-900/30'    },
    SMS:       { color: 'bg-orange-500',  bgColor: 'bg-orange-100 dark:bg-orange-900/30'  },
    Other:     { color: 'bg-gray-400',    bgColor: 'bg-gray-100 dark:bg-gray-700/30'    },
  }

  const channelCounts: ChannelCount[] = channelNames
    .map(name => {
      const count = scripts.filter(s => inferChannel(s.title, s.channel) === name).length
      return {
        name,
        count,
        color: channelColorMap[name]?.color ?? 'bg-gray-400',
        bgColor: channelColorMap[name]?.bgColor ?? 'bg-gray-100',
      }
    })
    .filter(c => c.count > 0)

  const total = channelCounts.reduce((s, c) => s + c.count, 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <SectionHeader
          icon={TrendingUp}
          title="Outreach Channel Mix"
          description="Scripts categorized by delivery channel"
        />
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-6">No scripts to analyze yet.</p>
        ) : (
          <div className="space-y-4">
            {/* Color strip */}
            <div className="flex w-full h-8 rounded-lg overflow-hidden">
              {channelCounts.map(ch => (
                <div
                  key={ch.name}
                  className={cn('h-full transition-all', ch.color)}
                  style={{ width: `${(ch.count / total) * 100}%` }}
                  title={`${ch.name}: ${ch.count} scripts (${Math.round((ch.count / total) * 100)}%)`}
                />
              ))}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {channelCounts.map(ch => (
                <div key={ch.name} className="flex items-center gap-1.5">
                  <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', ch.color)} />
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{ch.name}</span>
                  <span className="text-xs text-slate-400">{ch.count}</span>
                  <span className="text-xs text-slate-300 dark:text-slate-600">
                    ({Math.round((ch.count / total) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Section 4: Velocity Snapshot ────────────────────────────────────────────

function VelocitySnapshot({ merchants }: { merchants: Merchant[] }) {
  const addedThisWeek  = merchants.filter(m => isWithinDays(m.createdAt, 7)).length
  const addedThisMonth = merchants.filter(m => isWithinDays(m.createdAt, 30)).length
  const contactedRecently = merchants.filter(m => isWithinDays(m.lastContactDate, 7)).length
  const neverContacted    = merchants.filter(m => !m.lastContactDate).length

  const kpis: VelocityKPI[] = [
    {
      label:   'Added This Week',
      value:   addedThisWeek,
      icon:    Users,
      color:   'text-blue-600 dark:text-blue-400',
      iconBg:  'bg-blue-100 dark:bg-blue-900/30',
      sub:     'new merchants (7d)',
    },
    {
      label:   'Added This Month',
      value:   addedThisMonth,
      icon:    TrendingUp,
      color:   'text-indigo-600 dark:text-indigo-400',
      iconBg:  'bg-indigo-100 dark:bg-indigo-900/30',
      sub:     'new merchants (30d)',
    },
    {
      label:   'Contacted Recently',
      value:   contactedRecently,
      icon:    MessageSquare,
      color:   'text-emerald-600 dark:text-emerald-400',
      iconBg:  'bg-emerald-100 dark:bg-emerald-900/30',
      sub:     'last contact within 7d',
    },
    {
      label:   'Never Contacted',
      value:   neverContacted,
      icon:    Zap,
      color:   'text-amber-600 dark:text-amber-400',
      iconBg:  'bg-amber-100 dark:bg-amber-900/30',
      sub:     'no outreach logged',
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <SectionHeader
          icon={Zap}
          title="Velocity Snapshot"
          description="Pipeline momentum at a glance"
        />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {kpis.map(kpi => (
            <div
              key={kpi.label}
              className="rounded-xl border border-gray-100 dark:border-navy-500 bg-gray-50 dark:bg-navy-500/20 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-tight pr-2">
                  {kpi.label}
                </p>
                <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0', kpi.iconBg)}>
                  <kpi.icon className={cn('h-3.5 w-3.5', kpi.color)} />
                </div>
              </div>
              <p className={cn('text-3xl font-bold', kpi.color)}>{kpi.value.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [scripts, setScripts] = useState<Script[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    initializeStorage()
    setMerchants(getMerchants())
    setScripts(getScripts())
    setLoaded(true)
  }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy dark:text-white">Pipeline Analytics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Computed from your current merchant pipeline and script library.
        </p>
      </div>

      {loaded && (
        <div className="space-y-6">
          <PipelineFunnel merchants={merchants} />
          <ScriptInventory scripts={scripts} />
          <ChannelMix scripts={scripts} />
          <VelocitySnapshot merchants={merchants} />
        </div>
      )}

      {!loaded && (
        <div className="space-y-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-24 bg-gray-100 dark:bg-navy-500/20 rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
