'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Printer, Download, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { RoleGate } from '@/components/role-gate'
import { getSOPs, logSOPCompletion, isSOPCompletedToday, isSOPCompletedThisWeek } from '@/lib/storage'
import { cn } from '@/lib/utils'
import type { SOP, SOPFrequency } from '@/types'

// ── helpers ───────────────────────────────────────────────────────────────────

function frequencyVariant(freq: SOPFrequency) {
  if (freq === 'daily') return 'default' as const
  if (freq === 'weekly') return 'navy' as const
  if (freq === 'monthly') return 'success' as const
  return 'secondary' as const
}

function frequencyLabel(freq: SOPFrequency) {
  if (freq === 'as-needed') return 'As-Needed'
  return freq.charAt(0).toUpperCase() + freq.slice(1)
}

// ── Export Markdown ───────────────────────────────────────────────────────────

function exportMarkdown(sops: SOP[]) {
  const lines: string[] = ['# LeenqUp Standard Operating Procedures', '']

  for (const sop of sops) {
    lines.push(`## ${sop.title}`)
    lines.push(`Frequency: ${frequencyLabel(sop.frequency)} | Owner: ${sop.owner} | Est. time: ${sop.estimatedMinutes} min`)
    lines.push('')
    lines.push('### Steps')
    for (const step of sop.steps) {
      lines.push(`${step.stepNumber}. **${step.action}** — ${step.detail}`)
      if (step.toolUsed) lines.push(`   Tool: ${step.toolUsed}`)
      if (step.notes) lines.push(`   Notes: ${step.notes}`)
    }
    lines.push('')
  }

  const content = lines.join('\n')
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'leenqup-sops.md'
  a.click()
  URL.revokeObjectURL(url)
  toast('SOPs exported as markdown', 'success')
}

// ── Print helper ──────────────────────────────────────────────────────────────

function printSOP(sop: SOP) {
  const content = `
    <html>
    <head>
      <title>${sop.title}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 32px; color: #1e293b; line-height: 1.6; }
        h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 4px; }
        .meta { font-size: 0.85rem; color: #64748b; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        th { background: #f1f5f9; text-align: left; padding: 8px 12px; border-bottom: 2px solid #e2e8f0; }
        td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        .badge { display: inline-block; background: #e2e8f0; border-radius: 9999px; padding: 2px 8px; font-size: 0.75rem; }
        @media print { body { padding: 16px; } }
      </style>
    </head>
    <body>
      <h1>${sop.title}</h1>
      <div class="meta">
        Frequency: ${frequencyLabel(sop.frequency)} &nbsp;|&nbsp;
        Owner: ${sop.owner} &nbsp;|&nbsp;
        Est. time: ${sop.estimatedMinutes} min
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Action</th>
            <th>Detail</th>
            <th>Tool</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${sop.steps.map(s => `
            <tr>
              <td>${s.stepNumber}</td>
              <td><strong>${s.action}</strong></td>
              <td>${s.detail}</td>
              <td>${s.toolUsed ? `<span class="badge">${s.toolUsed}</span>` : '—'}</td>
              <td>${s.notes ?? '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { toast('Could not open print window. Allow pop-ups.', 'error'); return }
  win.document.write(content)
  win.document.close()
  win.focus()
  win.print()
  win.close()
}

// ── SOP Accordion Card ────────────────────────────────────────────────────────

interface SOPCardProps {
  sop: SOP
  isCompleted: boolean
  onMarkComplete: (id: string) => void
}

function SOPCard({ sop, isCompleted, onMarkComplete }: SOPCardProps) {
  const [open, setOpen] = useState(false)
  const showCompletion = sop.frequency === 'daily' || sop.frequency === 'weekly'
  const completedLabel = sop.frequency === 'daily' ? 'Completed today ✓' : 'Completed this week ✓'

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Collapsed header */}
      <button
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <span className="text-base font-semibold text-navy leading-snug">{sop.title}</span>
          <Badge variant={frequencyVariant(sop.frequency)}>{frequencyLabel(sop.frequency)}</Badge>
          <Badge variant="secondary">{sop.owner}</Badge>
          <span className="text-xs text-slate-400">~{sop.estimatedMinutes} min</span>
          {showCompletion && isCompleted && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-green">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {completedLabel}
            </span>
          )}
        </div>
        <span className="shrink-0 text-slate-400">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-gray-100">
          {/* Steps table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3 w-10">#</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Detail</th>
                  <th className="px-5 py-3">Tool</th>
                  <th className="px-5 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sop.steps.map(step => (
                  <tr key={step.stepNumber} className="align-top">
                    <td className="px-5 py-3 text-slate-400 font-mono text-xs">{step.stepNumber}</td>
                    <td className="px-5 py-3 font-medium text-slate-800 whitespace-nowrap">{step.action}</td>
                    <td className="px-5 py-3 text-slate-600 leading-relaxed">{step.detail}</td>
                    <td className="px-5 py-3">
                      {step.toolUsed
                        ? <Badge variant="secondary" className="whitespace-nowrap">{step.toolUsed}</Badge>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs leading-relaxed">
                      {step.notes ?? <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer: Print + Mark Complete */}
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <div>
              {showCompletion && (
                isCompleted ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1.5 text-sm font-medium text-brand-green">
                    <CheckCircle2 className="h-4 w-4" />
                    {completedLabel}
                  </span>
                ) : (
                  <RoleGate roles={['admin', 'editor']}>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onMarkComplete(sop.id)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mark Complete
                    </Button>
                  </RoleGate>
                )
              )}
            </div>
            <Button variant="secondary" size="sm" onClick={() => printSOP(sop)}>
              <Printer className="h-3.5 w-3.5" />
              Print this SOP
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const ALL_FREQUENCIES: Array<{ value: SOPFrequency | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'as-needed', label: 'As-Needed' },
]

export default function SOPsPage() {
  const [sops, setSOPs] = useState<SOP[]>([])
  const [frequencyFilter, setFrequencyFilter] = useState<SOPFrequency | 'all'>('all')
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadedSOPs = getSOPs()
    setSOPs(loadedSOPs)
    const done = new Set<string>()
    loadedSOPs.forEach(s => {
      if (s.frequency === 'daily' && isSOPCompletedToday(s.id)) done.add(s.id)
      if (s.frequency === 'weekly' && isSOPCompletedThisWeek(s.id)) done.add(s.id)
    })
    setCompletedIds(done)
  }, [])

  function handleMarkComplete(id: string) {
    logSOPCompletion(id)
    setCompletedIds(prev => new Set([...prev, id]))
    const sop = sops.find(s => s.id === id)
    toast(`"${sop?.title ?? 'SOP'}" marked as complete`, 'success')
  }

  const filtered = frequencyFilter === 'all'
    ? sops
    : sops.filter(s => s.frequency === frequencyFilter)

  const dailySOPs = sops.filter(s => s.frequency === 'daily')
  const weeklySOPs = sops.filter(s => s.frequency === 'weekly')
  const dailyCompletedCount = dailySOPs.filter(s => completedIds.has(s.id)).length
  const weeklyCompletedCount = weeklySOPs.filter(s => completedIds.has(s.id)).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy">Standard Operating Procedures</h1>
          <p className="text-sm text-slate-500 mt-0.5">{sops.length} SOPs &mdash; expand to view steps</p>
        </div>
        <Button variant="secondary" onClick={() => exportMarkdown(sops)}>
          <Download className="h-4 w-4" />
          Export All
        </Button>
      </div>

      {/* Completion summary */}
      {(dailySOPs.length > 0 || weeklySOPs.length > 0) && (
        <div className="flex items-center gap-4 flex-wrap rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
          {dailySOPs.length > 0 && (
            <span className={cn(
              'text-sm font-medium',
              dailyCompletedCount === dailySOPs.length ? 'text-brand-green' : 'text-slate-600'
            )}>
              {dailyCompletedCount}/{dailySOPs.length} daily SOPs completed today
            </span>
          )}
          {dailySOPs.length > 0 && weeklySOPs.length > 0 && (
            <span className="text-slate-200">·</span>
          )}
          {weeklySOPs.length > 0 && (
            <span className={cn(
              'text-sm font-medium',
              weeklyCompletedCount === weeklySOPs.length ? 'text-brand-green' : 'text-slate-600'
            )}>
              {weeklyCompletedCount}/{weeklySOPs.length} weekly SOPs completed this week
            </span>
          )}
        </div>
      )}

      {/* Frequency Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {ALL_FREQUENCIES.map(f => (
          <button
            key={f.value}
            onClick={() => setFrequencyFilter(f.value)}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition-colors',
              frequencyFilter === f.value
                ? 'bg-navy text-white'
                : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400">
          Showing {filtered.length} of {sops.length}
        </span>
      </div>

      {/* SOP List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-sm">No SOPs found for this frequency.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(sop => (
            <SOPCard
              key={sop.id}
              sop={sop}
              isCompleted={completedIds.has(sop.id)}
              onMarkComplete={handleMarkComplete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
