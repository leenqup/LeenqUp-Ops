'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  FileText,
  Users,
  MessageSquare,
  Mail,
  Megaphone,
  ClipboardList,
  Palette,
  TrendingUp,
  LayoutGrid,
  X,
  ArrowRight,
  Clock,
} from 'lucide-react'
import {
  getPosts,
  getMerchants,
  getScripts,
  getSOPs,
  getCampaigns,
  getDeals,
  getBrandResponses,
  getSequences,
} from '@/lib/storage'

// ── Types ─────────────────────────────────────────────────────

type ResultType = 'post' | 'merchant' | 'script' | 'sop' | 'campaign' | 'deal' | 'brand' | 'sequence'

interface SearchResult {
  id: string
  type: ResultType
  title: string
  subtitle: string
  href: string
}

// ── Config ────────────────────────────────────────────────────

const typeConfig: Record<ResultType, { icon: React.ElementType; color: string; label: string }> = {
  post:     { icon: FileText,      color: 'text-blue-500',   label: 'Post' },
  merchant: { icon: Users,         color: 'text-green-500',  label: 'Merchant' },
  script:   { icon: MessageSquare, color: 'text-teal-500',   label: 'Script' },
  sop:      { icon: ClipboardList, color: 'text-amber-500',  label: 'SOP' },
  campaign: { icon: Megaphone,     color: 'text-coral',      label: 'Campaign' },
  deal:     { icon: TrendingUp,    color: 'text-purple-500', label: 'Deal' },
  brand:    { icon: Palette,       color: 'text-pink-500',   label: 'Brand' },
  sequence: { icon: Mail,          color: 'text-indigo-500', label: 'Sequence' },
}

// ── Helpers ───────────────────────────────────────────────────

const RECENT_KEY = 'leenqup_search_recent'
const MAX_RECENT = 5

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') } catch { return [] }
}

function saveRecentSearch(query: string): void {
  if (!query.trim() || typeof window === 'undefined') return
  const existing = getRecentSearches()
  const updated = [query, ...existing.filter(q => q !== query)].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
}

function fuzzyMatch(haystack: string, needle: string): boolean {
  if (!needle) return true
  const h = haystack.toLowerCase()
  const n = needle.toLowerCase()
  // Exact substring match first (fastest)
  if (h.includes(n)) return true
  // Character-by-character fuzzy match
  let hi = 0
  for (let ni = 0; ni < n.length; ni++) {
    const pos = h.indexOf(n[ni], hi)
    if (pos === -1) return false
    hi = pos + 1
  }
  return true
}

function buildIndex(): SearchResult[] {
  const results: SearchResult[] = []

  for (const p of getPosts()) {
    results.push({ id: p.id, type: 'post', title: p.title, subtitle: `${p.platform} · ${p.status}`, href: '/posts' })
  }
  for (const m of getMerchants()) {
    results.push({ id: m.id, type: 'merchant', title: m.name, subtitle: `${m.category} · ${m.city}`, href: `/merchants/${m.id}` })
  }
  for (const s of getScripts()) {
    results.push({ id: s.id, type: 'script', title: s.title, subtitle: `${s.channel} · ${s.type}`, href: '/scripts' })
  }
  for (const s of getSOPs()) {
    results.push({ id: s.id, type: 'sop', title: s.title, subtitle: `${s.frequency} · ${s.owner}`, href: '/sops' })
  }
  for (const c of getCampaigns()) {
    results.push({ id: c.id, type: 'campaign', title: c.name, subtitle: `${c.phase} · ${c.status}`, href: '/campaigns' })
  }
  for (const d of getDeals()) {
    results.push({ id: d.id, type: 'deal', title: d.title, subtitle: `${d.stage} · $${d.dealValueUSD.toLocaleString()}`, href: '/crm' })
  }
  for (const b of getBrandResponses()) {
    results.push({ id: b.id, type: 'brand', title: b.trigger, subtitle: `${b.audience} · ${b.channel}`, href: '/brand' })
  }
  for (const s of getSequences()) {
    results.push({ id: s.id, type: 'sequence', title: s.name, subtitle: `${s.audience} · ${s.status}`, href: '/sequences' })
  }

  return results
}

// ── Component ─────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const indexRef = useRef<SearchResult[]>([])

  // Build index once on open
  useEffect(() => {
    if (open) {
      indexRef.current = buildIndex()
      setRecent(getRecentSearches())
      setQuery('')
      setResults([])
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Filter on query change
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSelectedIdx(0)
      return
    }
    const q = query.trim()
    const matched = indexRef.current.filter(r =>
      fuzzyMatch(r.title, q) || fuzzyMatch(r.subtitle, q)
    ).slice(0, 20)
    setResults(matched)
    setSelectedIdx(0)
  }, [query])

  const navigate = useCallback((result: SearchResult) => {
    saveRecentSearch(query || result.title)
    onClose()
    router.push(result.href)
  }, [query, onClose, router])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const list = results
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, list.length - 1)); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); return }
    if (e.key === 'Enter' && list[selectedIdx]) { navigate(list[selectedIdx]); return }
  }

  if (!open) return null

  // Group results by type
  const grouped: Partial<Record<ResultType, SearchResult[]>> = {}
  for (const r of results) {
    if (!grouped[r.type]) grouped[r.type] = []
    grouped[r.type]!.push(r)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-[15vh] z-50 w-full max-w-xl -translate-x-1/2 rounded-2xl bg-white dark:bg-navy-700 shadow-2xl ring-1 ring-black/10 dark:ring-white/10 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-navy-600">
          <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search merchants, posts, scripts, deals, SOPs…"
            className="flex-1 bg-transparent text-sm text-navy dark:text-white placeholder:text-slate-400 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-navy-600 text-xs text-slate-500">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {!query && recent.length > 0 && (
            <div className="px-4 pb-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> Recent
              </p>
              {recent.map(r => (
                <button
                  key={r}
                  onClick={() => setQuery(r)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-600 text-sm text-slate-600 dark:text-slate-300"
                >
                  <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  {r}
                </button>
              ))}
              <div className="my-2 border-t border-gray-100 dark:border-navy-600" />
            </div>
          )}

          {query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-400 text-sm">
              No results for "<span className="text-navy dark:text-white font-medium">{query}</span>"
            </div>
          )}

          {query && results.length > 0 && (
            <div className="px-2">
              {(Object.entries(grouped) as [ResultType, SearchResult[]][]).map(([type, items]) => {
                const cfg = typeConfig[type]
                const Icon = cfg.icon
                return (
                  <div key={type} className="mb-1">
                    <p className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{cfg.label}</p>
                    {items.map((r, i) => {
                      const globalIdx = results.indexOf(r)
                      const isSelected = globalIdx === selectedIdx
                      return (
                        <button
                          key={r.id}
                          onClick={() => navigate(r)}
                          onMouseEnter={() => setSelectedIdx(globalIdx)}
                          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors ${
                            isSelected ? 'bg-coral/10 dark:bg-coral/20' : 'hover:bg-slate-50 dark:hover:bg-navy-600'
                          }`}
                        >
                          <div className="h-7 w-7 rounded-lg bg-slate-50 dark:bg-navy-600 flex items-center justify-center flex-shrink-0">
                            <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-navy dark:text-white truncate">{r.title}</p>
                            <p className="text-xs text-slate-400 truncate">{r.subtitle}</p>
                          </div>
                          {isSelected && <ArrowRight className="h-3.5 w-3.5 text-coral flex-shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}

          {!query && recent.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-400 text-sm">
              Start typing to search across everything
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-navy-600 flex items-center gap-4 text-[11px] text-slate-400">
          <span><kbd className="font-mono bg-slate-100 dark:bg-navy-600 px-1.5 py-0.5 rounded text-slate-500">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono bg-slate-100 dark:bg-navy-600 px-1.5 py-0.5 rounded text-slate-500">↵</kbd> open</span>
          <span><kbd className="font-mono bg-slate-100 dark:bg-navy-600 px-1.5 py-0.5 rounded text-slate-500">Esc</kbd> close</span>
          {results.length > 0 && <span className="ml-auto">{results.length} result{results.length !== 1 ? 's' : ''}</span>}
        </div>
      </div>
    </>
  )
}

// ── Hook: mount Cmd+K globally ────────────────────────────────

export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return { open, setOpen }
}
