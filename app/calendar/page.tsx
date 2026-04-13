'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Megaphone,
  ClipboardList,
  LayoutGrid,
  TrendingUp,
  Circle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  getPosts,
  getCampaigns,
  getSOPs,
  getProjectCards,
  getDeals,
  isSOPCompletedThisWeek,
  isSOPCompletedToday,
  initializeStorage,
} from '@/lib/storage'
import type { Post, Campaign, SOP, ProjectCard, Deal, SOPFrequency } from '@/types'

// ── Types ─────────────────────────────────────────────────────

type EventType = 'post' | 'campaign' | 'sop' | 'card' | 'deal'

interface CalendarEvent {
  id: string
  type: EventType
  title: string
  date: string          // 'YYYY-MM-DD'
  href: string
  detail?: string
}

// ── Event type config ─────────────────────────────────────────

const eventConfig: Record<EventType, { color: string; bg: string; dot: string; icon: React.ElementType; label: string }> = {
  post:     { color: 'text-blue-700 dark:text-blue-300',    bg: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',     dot: 'bg-blue-500',   icon: FileText,      label: 'Posts' },
  campaign: { color: 'text-green-700 dark:text-green-300',  bg: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800', dot: 'bg-green-500',  icon: Megaphone,     label: 'Campaigns' },
  sop:      { color: 'text-amber-700 dark:text-amber-300',  bg: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800', dot: 'bg-amber-500',  icon: ClipboardList, label: 'SOPs' },
  card:     { color: 'text-purple-700 dark:text-purple-300',bg: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800', dot: 'bg-purple-500', icon: LayoutGrid, label: 'Projects' },
  deal:     { color: 'text-red-700 dark:text-red-300',      bg: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',         dot: 'bg-red-500',    icon: TrendingUp,    label: 'Deals' },
}

// ── SOP next-due computation ──────────────────────────────────

function sopNextDueDates(sop: SOP, year: number, month: number): string[] {
  // Returns all dates in the given month/year when this SOP is due
  const dates: string[] = []
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  if (sop.frequency === 'daily') {
    for (let d = 1; d <= daysInMonth; d++) {
      dates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    }
  } else if (sop.frequency === 'weekly') {
    // Every Monday of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      if (date.getDay() === 1) { // Monday
        dates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
      }
    }
  } else if (sop.frequency === 'monthly') {
    // First day of month
    dates.push(`${year}-${String(month + 1).padStart(2, '0')}-01`)
  }
  // 'as-needed' — no calendar date

  return dates
}

// ── Main component ────────────────────────────────────────────

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

type FilterKey = EventType | 'all'

export default function CalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [filter, setFilter] = useState<FilterKey>('all')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    initializeStorage()
    const allEvents: CalendarEvent[] = []

    // Posts with scheduledFor
    for (const p of getPosts()) {
      if (p.scheduledFor) {
        allEvents.push({ id: p.id, type: 'post', title: p.title, date: p.scheduledFor.slice(0, 10), href: '/posts', detail: p.platform })
      }
    }

    // Campaigns with deploymentSchedule
    for (const c of getCampaigns()) {
      if (c.deploymentSchedule) {
        // deploymentSchedule is a text description — try to parse a date from it
        const match = c.deploymentSchedule.match(/\d{4}-\d{2}-\d{2}/)
        if (match) {
          allEvents.push({ id: c.id, type: 'campaign', title: c.name, date: match[0], href: '/campaigns', detail: c.phase })
        }
      }
    }

    // SOPs — compute due dates for current month view
    for (const s of getSOPs()) {
      const dueDates = sopNextDueDates(s, year, month)
      for (const date of dueDates) {
        allEvents.push({ id: `${s.id}-${date}`, type: 'sop', title: s.title, date, href: '/sops', detail: s.frequency })
      }
    }

    // Project cards with dueDate
    for (const card of getProjectCards()) {
      if (card.dueDate && card.status !== 'done') {
        allEvents.push({ id: card.id, type: 'card', title: card.title, date: card.dueDate.slice(0, 10), href: '/projects', detail: card.priority })
      }
    }

    // Deals with expectedCloseDate
    for (const d of getDeals()) {
      if (d.expectedCloseDate && d.stage !== 'closed-won' && d.stage !== 'closed-lost') {
        allEvents.push({ id: d.id, type: 'deal', title: d.title, date: d.expectedCloseDate.slice(0, 10), href: '/crm', detail: d.stage })
      }
    }

    setEvents(allEvents)
  }, [year, month])

  // Navigate months
  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelectedDate(null) }

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter)

  // Events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const e of filtered) {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    }
    return map
  }, [filtered])

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : []

  // Summary counts for the month
  const monthSummary = useMemo(() => {
    const counts: Record<EventType, number> = { post: 0, campaign: 0, sop: 0, card: 0, deal: 0 }
    for (const e of events) {
      if (e.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
        counts[e.type]++
      }
    }
    return counts
  }, [events, year, month])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy dark:text-white">Content Calendar</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Unified view of all scheduled activity</p>
          </div>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={goToday}>Today</Button>
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-semibold text-navy dark:text-white min-w-[140px] text-center">
              {MONTHS[month]} {year}
            </span>
            <Button variant="ghost" size="sm" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex gap-3 flex-wrap mb-4">
        {(Object.entries(eventConfig) as [EventType, typeof eventConfig[EventType]][]).map(([type, cfg]) => {
          const count = monthSummary[type]
          const Icon = cfg.icon
          return (
            <button
              key={type}
              onClick={() => setFilter(f => f === type ? 'all' : type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                filter === type ? cfg.bg + ' ' + cfg.color : 'border-transparent bg-slate-50 dark:bg-navy-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {cfg.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${count > 0 ? 'bg-white/70 dark:bg-navy-700/70' : 'opacity-50'}`}>{count}</span>
            </button>
          )
        })}
        {filter !== 'all' && (
          <button onClick={() => setFilter('all')} className="text-xs text-coral hover:underline font-medium px-2">
            Show all
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Calendar grid */}
        <div className="bg-white dark:bg-navy-700 rounded-2xl border border-gray-100 dark:border-navy-600 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100 dark:border-navy-600">
            {DAYS_OF_WEEK.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {Array.from({ length: totalCells }).map((_, idx) => {
              const dayNum = idx - firstDayOfMonth + 1
              const isValid = dayNum >= 1 && dayNum <= daysInMonth
              const dateStr = isValid
                ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                : ''
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate
              const dayEvents = dateStr ? (eventsByDate[dateStr] ?? []) : []
              const MAX_CHIPS = 2

              return (
                <div
                  key={idx}
                  onClick={() => isValid && setSelectedDate(isSelected ? null : dateStr)}
                  className={`min-h-[90px] p-1.5 border-b border-r border-gray-50 dark:border-navy-600 last:border-r-0 transition-colors ${
                    isValid ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-navy-600/50' : 'bg-slate-50/50 dark:bg-navy-800/30'
                  } ${isSelected ? 'bg-coral/5 dark:bg-coral/10 ring-1 ring-inset ring-coral/30' : ''}`}
                >
                  {isValid && (
                    <>
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-medium mb-1 mx-auto ${
                        isToday ? 'bg-coral text-white' : 'text-navy dark:text-slate-200'
                      }`}>
                        {dayNum}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, MAX_CHIPS).map(e => {
                          const cfg = eventConfig[e.type]
                          return (
                            <div key={e.id} className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate border ${cfg.bg} ${cfg.color}`}>
                              <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                              <span className="truncate">{e.title}</span>
                            </div>
                          )
                        })}
                        {dayEvents.length > MAX_CHIPS && (
                          <div className="text-[10px] text-slate-400 px-1.5">+{dayEvents.length - MAX_CHIPS} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Side panel — selected day detail */}
        <div className="space-y-4">
          {selectedDate ? (
            <div className="bg-white dark:bg-navy-700 rounded-2xl border border-gray-100 dark:border-navy-600 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-navy dark:text-white">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <button onClick={() => setSelectedDate(null)} className="text-slate-400 hover:text-slate-600">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              {selectedEvents.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Nothing scheduled</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map(e => {
                    const cfg = eventConfig[e.type]
                    const Icon = cfg.icon
                    return (
                      <Link
                        key={e.id}
                        href={e.href}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${cfg.bg} hover:opacity-80 transition-opacity`}
                      >
                        <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${cfg.color}`} />
                        <div className="min-w-0">
                          <p className={`text-xs font-medium leading-snug ${cfg.color}`}>{e.title}</p>
                          {e.detail && <p className="text-[11px] opacity-70 mt-0.5">{e.detail}</p>}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-navy-700 rounded-2xl border border-gray-100 dark:border-navy-600 p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">This month</p>
              <div className="space-y-2">
                {(Object.entries(eventConfig) as [EventType, typeof eventConfig[EventType]][]).map(([type, cfg]) => {
                  const Icon = cfg.icon
                  const count = monthSummary[type]
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                        <span className="text-sm text-navy dark:text-slate-200">{cfg.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-navy dark:text-white">{count}</span>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-slate-400 mt-4 text-center">Click a day to see its events</p>
            </div>
          )}

          {/* Legend */}
          <div className="bg-white dark:bg-navy-700 rounded-2xl border border-gray-100 dark:border-navy-600 p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Legend</p>
            <div className="space-y-2">
              {(Object.entries(eventConfig) as [EventType, typeof eventConfig[EventType]][]).map(([type, cfg]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                  <span className="text-xs text-slate-600 dark:text-slate-300">{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
