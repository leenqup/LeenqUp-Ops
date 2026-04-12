'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Papa from 'papaparse'
import {
  Plus,
  Search,
  X,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Send,
  Pencil,
  Trash2,
  Download,
  Filter,
  Calendar,
  StickyNote,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  getPosts,
  upsertPost,
  deletePost,
  getSettings,
  initializeStorage,
} from '@/lib/storage'
import { getCharLimit, getCharStatus, generateId, cn } from '@/lib/utils'
import type {
  Post,
  Platform,
  Audience,
  Pillar,
  Phase,
  PostStatus,
} from '@/types'

// ─── Badge variant helpers ────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'navy' | 'purple' | 'outline'

function platformVariant(p: Platform): BadgeVariant {
  const map: Record<Platform, BadgeVariant> = {
    instagram: 'purple',
    facebook: 'navy',
    linkedin: 'navy',
    twitter: 'secondary',
    whatsapp: 'success',
  }
  return map[p]
}

function audienceVariant(a: Audience): BadgeVariant {
  const map: Record<Audience, BadgeVariant> = {
    buyer: 'default',
    seller: 'navy',
    diaspora: 'purple',
    community: 'success',
    general: 'secondary',
  }
  return map[a]
}

function phaseVariant(p: Phase): BadgeVariant {
  const map: Record<Phase, BadgeVariant> = {
    'pre-launch': 'warning',
    launch: 'default',
    'post-launch': 'success',
    evergreen: 'secondary',
  }
  return map[p]
}

function statusVariant(s: PostStatus): BadgeVariant {
  const map: Record<PostStatus, BadgeVariant> = {
    ready: 'success',
    'needs-review': 'warning',
    scheduled: 'purple',
    published: 'secondary',
  }
  return map[s]
}

function pillarVariant(p: Pillar): BadgeVariant {
  const map: Record<Pillar, BadgeVariant> = {
    trust: 'success',
    discovery: 'navy',
    education: 'purple',
    proof: 'default',
    community: 'success',
    launch: 'default',
    feature: 'purple',
    announcement: 'warning',
  }
  return map[p]
}

// ─── Platform pill colors for calendar ───────────────────────────────────────

function platformPillClass(p: Platform): string {
  const map: Record<Platform, string> = {
    instagram: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
    facebook: 'bg-navy/10 text-navy dark:bg-navy/30 dark:text-blue-200',
    linkedin: 'bg-navy/10 text-navy dark:bg-navy/30 dark:text-blue-200',
    twitter: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    whatsapp: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  }
  return map[p]
}

// ─── Character count indicator ────────────────────────────────────────────────

function CharCountBadge({ post }: { post: Post }) {
  const limit = getCharLimit(post.platform)
  const count = post.characterCount
  const status = getCharStatus(count, post.platform)
  const colorMap = {
    green: 'text-brand-green bg-brand-green-light',
    amber: 'text-amber-700 bg-amber-100',
    red: 'text-red-700 bg-red-100',
  }
  return (
    <span className={cn('text-xs font-mono px-2 py-0.5 rounded-full font-semibold', colorMap[status])}>
      {count}/{limit}
    </span>
  )
}

// ─── Calendar helper ──────────────────────────────────────────────────────────

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  return days
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ─── Calendar View ────────────────────────────────────────────────────────────

interface CalendarViewProps {
  posts: Post[]
  onPostClick: (post: Post) => void
}

function CalendarView({ posts, onPostClick }: CalendarViewProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const days = getCalendarDays(year, month)
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // Build map: "YYYY-MM-DD" -> Post[]
  const postsByDate = new Map<string, Post[]>()
  for (const post of posts) {
    if (!post.scheduledFor) continue
    // normalise - just take the date part
    const d = post.scheduledFor.slice(0, 10)
    if (!postsByDate.has(d)) postsByDate.set(d, [])
    postsByDate.get(d)!.push(post)
  }

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }
  const goToToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()) }

  return (
    <div>
      {/* Calendar nav */}
      <div className="flex items-center gap-2 mb-4">
        <Button size="sm" variant="secondary" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-base font-semibold text-navy dark:text-white min-w-[160px] text-center">
          {MONTH_NAMES[month]} {year}
        </span>
        <Button size="sm" variant="secondary" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={goToToday} className="ml-2 text-slate-500">
          Today
        </Button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wide py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-l border-t border-gray-100 dark:border-navy-500">
        {days.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="border-r border-b border-gray-100 dark:border-navy-500 min-h-[90px] bg-gray-50/50 dark:bg-navy-600/30"
              />
            )
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayPosts = postsByDate.get(dateStr) ?? []
          const isToday = dateStr === todayStr
          const isPast = dateStr < todayStr
          const hasPosts = dayPosts.length > 0

          return (
            <div
              key={dateStr}
              className={cn(
                'border-r border-b border-gray-100 dark:border-navy-500 min-h-[90px] p-1.5 flex flex-col gap-1',
                hasPosts && 'bg-coral/5 dark:bg-coral/10',
                isPast && !hasPosts && 'opacity-50',
              )}
            >
              {/* Day number */}
              <div className={cn('text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full', isToday && 'bg-coral text-white font-bold')}>
                {isToday ? (
                  <span className="font-bold">{day}</span>
                ) : (
                  <span className={cn(isPast ? 'text-slate-400' : 'text-navy dark:text-white')}>{day}</span>
                )}
              </div>

              {/* Post pills */}
              <div className="flex flex-col gap-0.5">
                {dayPosts.slice(0, 3).map(post => (
                  <button
                    key={post.id}
                    onClick={() => onPostClick(post)}
                    className={cn(
                      'text-left text-[10px] leading-tight px-1.5 py-0.5 rounded font-medium truncate w-full',
                      platformPillClass(post.platform),
                      'hover:opacity-80 transition-opacity',
                    )}
                    title={post.title || post.body.slice(0, 60)}
                  >
                    {post.title || post.body.slice(0, 30)}
                  </button>
                ))}
                {dayPosts.length > 3 && (
                  <span className="text-[10px] text-slate-400 pl-1">+{dayPosts.length - 3} more</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Slide-over panel ────────────────────────────────────────────────────────

interface SlideOverProps {
  post: Post | null
  onClose: () => void
  onUpdate: (post: Post) => void
  onDelete: (id: string) => void
  bufferConfigured: boolean
}

const PLATFORM_OPTIONS: Platform[] = ['instagram', 'facebook', 'linkedin', 'twitter', 'whatsapp']
const AUDIENCE_OPTIONS: Audience[] = ['buyer', 'seller', 'diaspora', 'community', 'general']
const PILLAR_OPTIONS: Pillar[] = ['trust', 'discovery', 'education', 'proof', 'community', 'launch', 'feature', 'announcement']
const PHASE_OPTIONS: Phase[] = ['pre-launch', 'launch', 'post-launch', 'evergreen']
const STATUS_OPTIONS: PostStatus[] = ['ready', 'needs-review', 'scheduled', 'published']

interface BufferProfile { id: string; name: string; service: string }

function SlideOver({ post, onClose, onUpdate, onDelete, bufferConfigured }: SlideOverProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Post | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sendingBuffer, setSendingBuffer] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)

  // Buffer profile state
  const [bufferProfiles, setBufferProfiles] = useState<BufferProfile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([])

  // Default to tomorrow 9am
  const defaultSchedule = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(9, 0, 0, 0)
    return d.toISOString().slice(0, 16)
  }
  const [scheduleDateTime, setScheduleDateTime] = useState(defaultSchedule)

  useEffect(() => {
    if (post) {
      setDraft({ ...post })
      setEditing(false)
      setConfirmDelete(false)
    }
  }, [post])

  const openScheduleDialog = async () => {
    setScheduleDateTime(defaultSchedule())
    setShowScheduleDialog(true)
    if (bufferProfiles.length > 0) return // already loaded
    setLoadingProfiles(true)
    try {
      const settings = getSettings()
      const res = await fetch('/api/buffer/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: settings.bufferAccessToken }),
      })
      const data = await res.json()
      if (data.success && data.profiles?.length) {
        setBufferProfiles(data.profiles)
        // Pre-select profiles that match this post's platform
        const matching = (data.profiles as BufferProfile[])
          .filter(p => p.service === post?.platform)
          .map(p => p.id)
        setSelectedProfileIds(matching.length ? matching : (data.profiles as BufferProfile[]).map((p: BufferProfile) => p.id))
      }
    } catch { /* profiles optional — fall back to platform match */ }
    finally { setLoadingProfiles(false) }
  }

  const toggleProfile = (id: string) => {
    setSelectedProfileIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  if (!post || !draft) return null

  const handleSave = () => {
    const updated: Post = {
      ...draft,
      characterCount: draft.body.length,
      updatedAt: new Date().toISOString(),
    }
    upsertPost(updated)
    onUpdate(updated)
    setEditing(false)
    toast('Post saved successfully')
  }

  const handleDelete = () => {
    deletePost(post.id)
    onDelete(post.id)
    onClose()
    toast('Post deleted', 'info')
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(post.body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast('Copied to clipboard')
  }

  const handleScheduleToBuffer = async (immediate: boolean) => {
    setSendingBuffer(true)
    setShowScheduleDialog(false)
    try {
      const settings = getSettings()
      const res = await fetch('/api/buffer/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-buffer-token': settings.bufferAccessToken ?? '',
        },
        body: JSON.stringify({
          postBody: post.body,
          platforms: [post.platform],
          profileIds: selectedProfileIds.length ? selectedProfileIds : undefined,
          scheduledAt: immediate ? undefined : new Date(scheduleDateTime).toISOString(),
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Buffer API error')
      }
      const scheduled = post.scheduledFor ?? scheduleDateTime
      const updated: Post = {
        ...post,
        status: 'scheduled',
        scheduledFor: immediate ? undefined : new Date(scheduleDateTime).toISOString(),
        updatedAt: new Date().toISOString(),
      }
      upsertPost(updated)
      onUpdate(updated)
      toast(immediate ? 'Added to Buffer queue' : `Scheduled to Buffer for ${new Date(scheduleDateTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`)
    } catch (err) {
      toast(`Buffer error: ${err instanceof Error ? err.message : 'Check your API key in Settings.'}`, 'error')
    } finally {
      setSendingBuffer(false)
    }
  }

  const currentPost = editing ? draft : post

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Buffer Schedule Dialog */}
      {showScheduleDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-600 rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-navy dark:text-white text-base">Schedule to Buffer</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Choose when and where to publish</p>
            </div>

            {/* Profile selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Buffer Profiles
                {loadingProfiles && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}
              </label>
              {bufferProfiles.length > 0 ? (
                <div className="space-y-1 max-h-[120px] overflow-y-auto rounded-lg border border-gray-100 dark:border-navy-500 p-1">
                  {bufferProfiles.map(p => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-navy-500 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProfileIds.includes(p.id)}
                        onChange={() => toggleProfile(p.id)}
                        className="h-3.5 w-3.5 rounded border-gray-300 accent-coral"
                      />
                      <span className="text-sm text-navy dark:text-white flex-1 truncate">{p.name}</span>
                      <span className="text-[10px] font-medium text-slate-400 capitalize">{p.service}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  {loadingProfiles ? 'Loading profiles…' : `Will post to all ${post.platform} profiles`}
                </p>
              )}
            </div>

            {/* Date/time picker */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date &amp; Time</label>
              <input
                type="datetime-local"
                value={scheduleDateTime}
                onChange={e => setScheduleDateTime(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-navy-500 bg-white dark:bg-navy-500 px-3 py-2 text-sm text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-coral/50"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => handleScheduleToBuffer(false)} className="flex-1" disabled={sendingBuffer}>
                {sendingBuffer ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5" />}
                Schedule
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleScheduleToBuffer(true)} disabled={sendingBuffer}>
                Add to Queue
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[480px] z-50 bg-white dark:bg-navy-600 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-navy-500">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={platformVariant(post.platform)} className="capitalize">{post.platform}</Badge>
            <Badge variant={statusVariant(post.status)} className="capitalize">{post.status.replace('-', ' ')}</Badge>
          </div>
          <div className="flex items-center gap-1.5">
            {bufferConfigured && !editing && (
              <Button
                size="icon-sm"
                variant="secondary"
                onClick={openScheduleDialog}
                disabled={sendingBuffer}
                title="Schedule to Buffer"
              >
                {sendingBuffer ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            )}
            <Button size="icon-sm" variant="secondary" onClick={handleCopy} title="Copy body">
              {copied ? <Check className="h-3.5 w-3.5 text-brand-green" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            {!editing ? (
              <Button size="icon-sm" variant="secondary" onClick={() => setEditing(true)} title="Edit post">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            <Button size="icon-sm" variant="ghost" onClick={onClose} title="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Post body */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Post Body</p>
            {editing ? (
              <Textarea
                value={draft.body}
                onChange={e => setDraft(d => d ? { ...d, body: e.target.value } : d)}
                className="min-h-[200px] text-sm font-normal leading-relaxed"
              />
            ) : (
              <p className="text-sm text-navy dark:text-white leading-relaxed whitespace-pre-wrap">{post.body}</p>
            )}
            <div className="mt-1.5 flex justify-end">
              <CharCountBadge post={editing ? { ...draft, characterCount: draft.body.length } : post} />
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Platform</p>
              {editing ? (
                <Select value={draft.platform} onValueChange={v => setDraft(d => d ? { ...d, platform: v as Platform } : d)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATFORM_OPTIONS.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={platformVariant(post.platform)} className="capitalize">{post.platform}</Badge>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Audience</p>
              {editing ? (
                <Select value={draft.audience} onValueChange={v => setDraft(d => d ? { ...d, audience: v as Audience } : d)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_OPTIONS.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={audienceVariant(post.audience)} className="capitalize">{post.audience}</Badge>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Pillar</p>
              {editing ? (
                <Select value={draft.pillar} onValueChange={v => setDraft(d => d ? { ...d, pillar: v as Pillar } : d)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PILLAR_OPTIONS.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={pillarVariant(post.pillar)} className="capitalize">{post.pillar}</Badge>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Phase</p>
              {editing ? (
                <Select value={draft.phase} onValueChange={v => setDraft(d => d ? { ...d, phase: v as Phase } : d)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PHASE_OPTIONS.map(o => <SelectItem key={o} value={o} className="capitalize">{o.replace('-', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={phaseVariant(post.phase)} className="capitalize">{post.phase.replace('-', ' ')}</Badge>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</p>
              {editing ? (
                <Select value={draft.status} onValueChange={v => setDraft(d => d ? { ...d, status: v as PostStatus } : d)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(o => <SelectItem key={o} value={o} className="capitalize">{o.replace('-', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={statusVariant(post.status)} className="capitalize">{post.status.replace('-', ' ')}</Badge>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Scheduled
              </p>
              {editing ? (
                <Input
                  type="date"
                  value={draft.scheduledFor ?? ''}
                  onChange={e => setDraft(d => d ? { ...d, scheduledFor: e.target.value || undefined } : d)}
                  className="h-8 text-xs"
                />
              ) : (
                <p className="text-sm text-navy dark:text-white">
                  {post.scheduledFor
                    ? new Date(post.scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : <span className="text-slate-400">—</span>}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <StickyNote className="h-3 w-3" /> Notes
            </p>
            {editing ? (
              <Textarea
                value={draft.notes ?? ''}
                onChange={e => setDraft(d => d ? { ...d, notes: e.target.value || undefined } : d)}
                className="text-sm min-h-[80px]"
                placeholder="Add notes…"
              />
            ) : (
              <p className="text-sm text-slate-500 leading-relaxed">
                {post.notes || <span className="italic text-slate-300">No notes</span>}
              </p>
            )}
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map(tag => (
                  <Badge key={tag} variant="secondary">#{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-slate-400 space-y-0.5 pt-2 border-t border-gray-100 dark:border-navy-500">
            <p>Created: {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            <p>Updated: {new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-navy-500">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <p className="text-sm text-red-600 flex-1">Delete this post?</p>
              <Button size="sm" variant="destructive" onClick={handleDelete}>Yes, delete</Button>
              <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </div>
          ) : editing ? (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave} className="flex-1">Save changes</Button>
              <Button size="sm" variant="secondary" onClick={() => { setEditing(false); setDraft({ ...post }) }}>
                Cancel
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setEditing(true)} variant="secondary" className="flex-1">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Post card ────────────────────────────────────────────────────────────────

interface PostCardProps {
  post: Post
  selected: boolean
  onSelect: (id: string, checked: boolean) => void
  onClick: (post: Post) => void
  bufferConfigured: boolean
  onSendToBuffer: (post: Post) => void
}

function PostCard({ post, selected, onSelect, onClick, bufferConfigured, onSendToBuffer }: PostCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(post.body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast('Copied to clipboard')
  }

  const handleBuffer = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSendToBuffer(post)
  }

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded(v => !v)
  }

  return (
    <Card
      className="card-hover cursor-pointer flex flex-col"
      onClick={() => onClick(post)}
    >
      <CardContent className="p-4 flex flex-col gap-3 h-full">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={platformVariant(post.platform)} className="capitalize text-[10px]">{post.platform}</Badge>
            <Badge variant={audienceVariant(post.audience)} className="capitalize text-[10px]">{post.audience}</Badge>
            <Badge variant={phaseVariant(post.phase)} className="capitalize text-[10px]">{post.phase.replace('-', ' ')}</Badge>
          </div>
          <CharCountBadge post={post} />
        </div>

        {/* Title */}
        {post.title && (
          <p className="text-sm font-semibold text-navy dark:text-white leading-snug line-clamp-1">
            {post.title}
          </p>
        )}

        {/* Body */}
        <div className="flex-1">
          <p className={cn('text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap', !expanded && 'line-clamp-3')}>
            {post.body}
          </p>
          {post.body.length > 200 && (
            <button
              onClick={handleExpand}
              className="text-xs text-coral hover:underline mt-1 flex items-center gap-0.5"
            >
              {expanded ? (
                <><ChevronUp className="h-3 w-3" /> Show less</>
              ) : (
                <><ChevronDown className="h-3 w-3" /> Show more</>
              )}
            </button>
          )}
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50 dark:border-navy-500">
          <div className="flex items-center gap-1.5">
            <Badge variant={statusVariant(post.status)} className="capitalize text-[10px]">{post.status.replace('-', ' ')}</Badge>
            <Badge variant={pillarVariant(post.pillar)} className="capitalize text-[10px]">{post.pillar}</Badge>
          </div>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            {bufferConfigured && (
              <Button size="icon-sm" variant="ghost" onClick={handleBuffer} title="Send to Buffer">
                <Send className="h-3.5 w-3.5 text-slate-400" />
              </Button>
            )}
            <Button size="icon-sm" variant="ghost" onClick={handleCopy} title="Copy body">
              {copied ? (
                <Check className="h-3.5 w-3.5 text-brand-green" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-slate-400" />
              )}
            </Button>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 accent-coral cursor-pointer"
              checked={selected}
              onChange={e => onSelect(post.id, e.target.checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Add Post Dialog ──────────────────────────────────────────────────────────

interface AddPostDialogProps {
  open: boolean
  onClose: () => void
  onSave: (post: Post) => void
}

const emptyForm = {
  title: '',
  body: '',
  platform: 'instagram' as Platform,
  audience: 'buyer' as Audience,
  pillar: 'trust' as Pillar,
  phase: 'launch' as Phase,
  status: 'needs-review' as PostStatus,
  notes: '',
  scheduledFor: '',
  tags: '',
}

function AddPostDialog({ open, onClose, onSave }: AddPostDialogProps) {
  const [form, setForm] = useState(emptyForm)

  const handleClose = () => {
    setForm(emptyForm)
    onClose()
  }

  const handleSave = () => {
    if (!form.body.trim()) {
      toast('Post body is required', 'error')
      return
    }
    const now = new Date().toISOString()
    const post: Post = {
      id: generateId(),
      title: form.title.trim(),
      body: form.body.trim(),
      platform: form.platform,
      audience: form.audience,
      pillar: form.pillar,
      phase: form.phase,
      status: form.status,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      characterCount: form.body.trim().length,
      notes: form.notes.trim() || undefined,
      scheduledFor: form.scheduledFor || undefined,
      createdAt: now,
      updatedAt: now,
    }
    upsertPost(post)
    onSave(post)
    handleClose()
    toast('Post created successfully')
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Title (optional)</label>
            <Input
              placeholder="Post title or working title…"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Body <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Write your post content here…"
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              className="min-h-[160px]"
            />
            <div className="flex justify-end mt-1">
              <CharCountBadge
                post={{
                  body: form.body,
                  characterCount: form.body.length,
                  platform: form.platform,
                } as Post}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Platform</label>
              <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v as Platform }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Audience</label>
              <Select value={form.audience} onValueChange={v => setForm(f => ({ ...f, audience: v as Audience }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Pillar</label>
              <Select value={form.pillar} onValueChange={v => setForm(f => ({ ...f, pillar: v as Pillar }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PILLAR_OPTIONS.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Phase</label>
              <Select value={form.phase} onValueChange={v => setForm(f => ({ ...f, phase: v as Phase }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PHASE_OPTIONS.map(o => <SelectItem key={o} value={o} className="capitalize">{o.replace('-', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Status</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as PostStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => <SelectItem key={o} value={o} className="capitalize">{o.replace('-', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Scheduled For</label>
              <Input
                type="date"
                value={form.scheduledFor}
                onChange={e => setForm(f => ({ ...f, scheduledFor: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Notes</label>
            <Textarea
              placeholder="Optional notes…"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="min-h-[60px]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Tags (comma-separated)</label>
            <Input
              placeholder="e.g. launch, seller, trust"
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave}>
            <Plus className="h-4 w-4" />
            Create Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type FilterState = {
  platform: string
  audience: string
  pillar: string
  phase: string
  status: string
  search: string
}

const defaultFilters: FilterState = {
  platform: 'all',
  audience: 'all',
  pillar: 'all',
  phase: 'all',
  status: 'all',
  search: '',
}

export default function PostsPage() {
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activePost, setActivePost] = useState<Post | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [bufferConfigured, setBufferConfigured] = useState(false)
  const [bulkSending, setBulkSending] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    initializeStorage()
    setAllPosts(getPosts())
    const settings = getSettings()
    setBufferConfigured(!!settings.bufferAccessToken)
  }, [])

  // Filtered posts
  const filteredPosts = allPosts.filter(post => {
    if (filters.platform !== 'all' && post.platform !== filters.platform) return false
    if (filters.audience !== 'all' && post.audience !== filters.audience) return false
    if (filters.pillar !== 'all' && post.pillar !== filters.pillar) return false
    if (filters.phase !== 'all' && post.phase !== filters.phase) return false
    if (filters.status !== 'all' && post.status !== filters.status) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!post.title.toLowerCase().includes(q) && !post.body.toLowerCase().includes(q)) return false
    }
    return true
  })

  const hasActiveFilters =
    filters.platform !== 'all' ||
    filters.audience !== 'all' ||
    filters.pillar !== 'all' ||
    filters.phase !== 'all' ||
    filters.status !== 'all' ||
    filters.search !== ''

  const clearFilters = () => setFilters(defaultFilters)

  const setFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handlePostUpdate = (updated: Post) => {
    setAllPosts(prev => prev.map(p => p.id === updated.id ? updated : p))
    if (activePost?.id === updated.id) setActivePost(updated)
  }

  const handlePostDelete = (id: string) => {
    setAllPosts(prev => prev.filter(p => p.id !== id))
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleAddPost = (post: Post) => {
    setAllPosts(prev => [post, ...prev])
  }

  const handleExportCSV = () => {
    const postsToExport = filteredPosts.filter(p => selectedIds.size === 0 || selectedIds.has(p.id))
    const csv = Papa.unparse(postsToExport.map(p => ({
      id: p.id,
      title: p.title,
      body: p.body,
      platform: p.platform,
      audience: p.audience,
      pillar: p.pillar,
      phase: p.phase,
      status: p.status,
      characterCount: p.characterCount,
      tags: p.tags.join(', '),
      scheduledFor: p.scheduledFor ?? '',
      notes: p.notes ?? '',
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })))
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leenqup-posts-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast(`Exported ${postsToExport.length} posts to CSV`)
  }

  const handleBulkSendToBuffer = async () => {
    const selected = filteredPosts.filter(p => selectedIds.has(p.id))
    setBulkSending(true)
    const settings = getSettings()
    for (const post of selected) {
      try {
        const res = await fetch('/api/buffer/schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-buffer-token': settings.bufferAccessToken ?? '',
          },
          body: JSON.stringify({ body: post.body, platform: [post.platform] }),
        })
        if (res.ok) {
          toast(`Sent '${post.title || post.platform}' to Buffer ✓`)
        } else {
          let errMsg = 'API error'
          try { const j = await res.json(); errMsg = j.error ?? errMsg } catch { /* noop */ }
          toast(`Failed: '${post.title || post.platform}' — ${errMsg}`, 'error')
        }
      } catch (err) {
        toast(`Failed: '${post.title || post.platform}' — network error`, 'error')
      }
    }
    setBulkSending(false)
  }

  const handleSendToBuffer = async (post: Post) => {
    // Quick-send to Buffer queue (no scheduling dialog for card buttons)
    try {
      const settings = getSettings()
      const res = await fetch('/api/buffer/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-buffer-token': settings.bufferAccessToken ?? '',
        },
        body: JSON.stringify({ postBody: post.body, platforms: [post.platform] }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Buffer API error')
      }
      const updated: Post = { ...post, status: 'scheduled', updatedAt: new Date().toISOString() }
      upsertPost(updated)
      handlePostUpdate(updated)
      toast(`"${post.title || post.platform}" added to Buffer queue`)
    } catch (err) {
      toast(`Buffer error: ${err instanceof Error ? err.message : 'Check Settings.'}`, 'error')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Slide-over */}
      {activePost && (
        <SlideOver
          post={activePost}
          onClose={() => setActivePost(null)}
          onUpdate={handlePostUpdate}
          onDelete={handlePostDelete}
          bufferConfigured={bufferConfigured}
        />
      )}

      {/* Add post dialog */}
      <AddPostDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSave={handleAddPost}
      />

      {/* Page header */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-navy-500 bg-white dark:bg-navy-600 sticky top-0 z-30">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-navy dark:text-white">Post Library</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {filteredPosts.length} of {allPosts.length} posts
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
            Add Post
          </Button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-[260px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              ref={searchRef}
              placeholder="Search posts…"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          <div className="w-[130px]">
            <Select value={filters.platform} onValueChange={v => setFilter('platform', v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {PLATFORM_OPTIONS.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[120px]">
            <Select value={filters.audience} onValueChange={v => setFilter('audience', v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Audiences</SelectItem>
                {AUDIENCE_OPTIONS.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[120px]">
            <Select value={filters.pillar} onValueChange={v => setFilter('pillar', v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Pillar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pillars</SelectItem>
                {PILLAR_OPTIONS.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[120px]">
            <Select value={filters.phase} onValueChange={v => setFilter('phase', v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Phases</SelectItem>
                {PHASE_OPTIONS.map(o => <SelectItem key={o} value={o} className="capitalize">{o.replace('-', ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[130px]">
            <Select value={filters.status} onValueChange={v => setFilter('status', v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map(o => <SelectItem key={o} value={o} className="capitalize">{o.replace('-', ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 gap-1">
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="px-6 py-2.5 bg-coral/5 border-b border-coral/20 flex items-center gap-3">
          <span className="text-sm font-medium text-navy dark:text-white">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button size="sm" variant="secondary" onClick={handleExportCSV}>
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            {bufferConfigured && (
              <Button size="sm" variant="secondary" onClick={handleBulkSendToBuffer} disabled={bulkSending}>
                {bulkSending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {bulkSending ? 'Sending…' : 'Send to Buffer'}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Content area — tabbed */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="library">
          <TabsList className="mb-4">
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>

          {/* Library tab */}
          <TabsContent value="library">
            {filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Filter className="h-10 w-10 text-slate-200 mb-3" />
                <p className="text-navy dark:text-white font-semibold">No posts found</p>
                <p className="text-sm text-slate-500 mt-1">
                  {hasActiveFilters ? 'Try adjusting your filters.' : 'Add your first post to get started.'}
                </p>
                {!hasActiveFilters && (
                  <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4" />
                    Add Post
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    selected={selectedIds.has(post.id)}
                    onSelect={handleSelect}
                    onClick={setActivePost}
                    bufferConfigured={bufferConfigured}
                    onSendToBuffer={handleSendToBuffer}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Calendar tab */}
          <TabsContent value="calendar">
            <CalendarView posts={allPosts} onPostClick={setActivePost} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
