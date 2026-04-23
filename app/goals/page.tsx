'use client'

import { useEffect, useState } from 'react'
import {
  Target,
  Plus,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { toast } from '@/components/ui/toaster'
import {
  getGoals,
  upsertGoal,
  deleteGoal,
  initializeStorage,
} from '@/lib/storage'
import { generateId, cn } from '@/lib/utils'
import type { Goal, GoalKeyResult, GoalStatus, GoalPeriod } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_ORDER: GoalPeriod[] = ['weekly', 'monthly', 'quarterly']

const PERIOD_LABELS: Record<GoalPeriod, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
}

const STATUS_CONFIG: Record<GoalStatus, { label: string; classes: string }> = {
  'on-track': { label: 'On Track', classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  'at-risk':  { label: 'At Risk',  classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  'behind':   { label: 'Behind',   classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  'completed':{ label: 'Completed',classes: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function overallProgress(goal: Goal): number {
  const totalTarget = goal.keyResults.reduce((s, kr) => s + kr.targetValue, 0)
  const totalCurrent = goal.keyResults.reduce((s, kr) => s + kr.currentValue, 0)
  if (totalTarget === 0) return 0
  return Math.min(100, Math.round((totalCurrent / totalTarget) * 100))
}

function krProgress(kr: GoalKeyResult): number {
  if (kr.targetValue === 0) return 0
  return Math.min(100, (kr.currentValue / kr.targetValue) * 100)
}

function blankKr(): GoalKeyResult {
  return { id: generateId(), description: '', targetValue: 0, currentValue: 0, unit: '' }
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: GoalStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', cfg.classes)}>
      {cfg.label}
    </span>
  )
}

// ─── Goal Card (Board View) ───────────────────────────────────────────────────

function GoalCard({
  goal,
  onEdit,
  onDelete,
}: {
  goal: Goal
  onEdit: (g: Goal) => void
  onDelete: (g: Goal) => void
}) {
  return (
    <Card className="relative group">
      <CardHeader className="pb-2 pr-16">
        <div className="flex items-start gap-2 flex-wrap">
          <CardTitle className="text-sm font-bold text-navy dark:text-white leading-snug flex-1 min-w-0">
            {goal.title}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <span className="text-[11px] text-slate-400">{goal.owner}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {goal.periodLabel}
          </Badge>
          <StatusBadge status={goal.status} />
        </div>
      </CardHeader>

      {/* Edit / Delete */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(goal)}
          className="p-1 rounded text-slate-400 hover:text-brand-purple hover:bg-brand-purple/10 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(goal)}
          className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <CardContent className="pt-0 space-y-2">
        {goal.keyResults.map(kr => (
          <div key={kr.id} className="space-y-0.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate flex-1">
                {kr.description}
              </p>
              <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                {kr.currentValue}/{kr.targetValue} {kr.unit}
              </span>
            </div>
            <div className="h-1 w-full bg-gray-100 dark:bg-navy-500 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-purple/60 rounded-full transition-all"
                style={{ width: `${krProgress(kr)}%` }}
              />
            </div>
          </div>
        ))}

        {goal.notes && (
          <p
            className="text-[10px] text-slate-400 italic truncate"
            title={goal.notes}
          >
            {goal.notes}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Board View ───────────────────────────────────────────────────────────────

function BoardView({
  goals,
  onEdit,
  onDelete,
}: {
  goals: Goal[]
  onEdit: (g: Goal) => void
  onDelete: (g: Goal) => void
}) {
  const groups = PERIOD_ORDER.map(period => ({
    period,
    label: PERIOD_LABELS[period],
    goals: goals.filter(g => g.period === period),
  })).filter(g => g.goals.length > 0)

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Target className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm">No goals yet. Add one to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {groups.map(({ period, label, goals: groupGoals }) => (
        <div key={period}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            {label}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({
  goals,
  onEdit,
  onDelete,
}: {
  goals: Goal[]
  onEdit: (g: Goal) => void
  onDelete: (g: Goal) => void
}) {
  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Target className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm">No goals yet. Add one to get started.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-navy-500">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-navy-500/40 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Period</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-center">Key Results</th>
            <th className="px-4 py-3">Progress</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-navy-500">
          {goals.map(goal => {
            const pct = overallProgress(goal)
            return (
              <tr key={goal.id} className="hover:bg-gray-50 dark:hover:bg-navy-500/20 transition-colors">
                <td className="px-4 py-3 font-medium text-navy dark:text-white max-w-[200px] truncate">
                  {goal.title}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  <span className="capitalize">{PERIOD_LABELS[goal.period]}</span>
                  <span className="ml-1.5 text-xs text-slate-400">{goal.periodLabel}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{goal.owner}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={goal.status} />
                </td>
                <td className="px-4 py-3 text-center text-slate-500">
                  {goal.keyResults.length}
                </td>
                <td className="px-4 py-3 min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-navy-400 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-purple/60 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 tabular-nums w-8 text-right">{pct}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(goal)}
                      className="p-1 rounded text-slate-400 hover:text-brand-purple hover:bg-brand-purple/10 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(goal)}
                      className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

interface GoalFormData {
  title: string
  period: GoalPeriod
  periodLabel: string
  owner: string
  status: GoalStatus
  notes: string
  keyResults: GoalKeyResult[]
}

function blankForm(): GoalFormData {
  return {
    title: '',
    period: 'quarterly',
    periodLabel: '',
    owner: '',
    status: 'on-track',
    notes: '',
    keyResults: [blankKr()],
  }
}

function GoalModal({
  open,
  editing,
  onClose,
  onSave,
}: {
  open: boolean
  editing: Goal | null
  onClose: () => void
  onSave: (goal: Goal) => void
}) {
  const [form, setForm] = useState<GoalFormData>(blankForm())

  useEffect(() => {
    if (open) {
      setForm(
        editing
          ? {
              title: editing.title,
              period: editing.period,
              periodLabel: editing.periodLabel,
              owner: editing.owner,
              status: editing.status,
              notes: editing.notes ?? '',
              keyResults: editing.keyResults.map(kr => ({ ...kr })),
            }
          : blankForm()
      )
    }
  }, [open, editing])

  const setField = <K extends keyof GoalFormData>(key: K, value: GoalFormData[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  const updateKr = (idx: number, field: keyof GoalKeyResult, value: string | number) =>
    setForm(f => {
      const krs = f.keyResults.map((kr, i) => i === idx ? { ...kr, [field]: value } : kr)
      return { ...f, keyResults: krs }
    })

  const addKr = () => setForm(f => ({ ...f, keyResults: [...f.keyResults, blankKr()] }))

  const removeKr = (idx: number) =>
    setForm(f => ({ ...f, keyResults: f.keyResults.filter((_, i) => i !== idx) }))

  const handleSave = () => {
    if (!form.title.trim()) { toast('Title is required', 'error'); return }
    if (!form.periodLabel.trim()) { toast('Period label is required', 'error'); return }
    if (!form.owner.trim()) { toast('Owner is required', 'error'); return }
    if (form.keyResults.length === 0) { toast('At least one key result is required', 'error'); return }
    for (const kr of form.keyResults) {
      if (!kr.description.trim()) { toast('All key result descriptions are required', 'error'); return }
    }

    const now = new Date().toISOString()
    const goal: Goal = {
      id: editing?.id ?? generateId(),
      title: form.title.trim(),
      period: form.period,
      periodLabel: form.periodLabel.trim(),
      owner: form.owner.trim(),
      status: form.status,
      keyResults: form.keyResults,
      notes: form.notes.trim() || undefined,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    }
    onSave(goal)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Goal' : 'Add Goal'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Title *</Label>
            <Input
              placeholder="e.g. Grow merchant base in Q2"
              value={form.title}
              onChange={e => setField('title', e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Period + Period Label */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Period *</Label>
              <Select value={form.period} onValueChange={v => setField('period', v as GoalPeriod)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Period Label *</Label>
              <Input
                placeholder="e.g. Q2 2026, April 2026"
                value={form.periodLabel}
                onChange={e => setField('periodLabel', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Owner + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner *</Label>
              <Input
                placeholder="e.g. Jallah"
                value={form.owner}
                onChange={e => setField('owner', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status *</Label>
              <Select value={form.status} onValueChange={v => setField('status', v as GoalStatus)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="on-track">On Track</SelectItem>
                  <SelectItem value="at-risk">At Risk</SelectItem>
                  <SelectItem value="behind">Behind</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes (optional)</Label>
            <Textarea
              placeholder="Optional context or strategy notes…"
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              className="mt-1 min-h-[60px]"
            />
          </div>

          {/* Key Results */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Key Results *</Label>
              <Button size="sm" variant="ghost" onClick={addKr} className="h-7 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Key Result
              </Button>
            </div>

            <div className="space-y-2">
              {form.keyResults.map((kr, idx) => (
                <div
                  key={kr.id}
                  className="grid grid-cols-[1fr_80px_80px_72px_28px] gap-2 items-start p-2 rounded-lg bg-gray-50 dark:bg-navy-500/20"
                >
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">Description</p>
                    <Input
                      placeholder="e.g. Active merchants"
                      value={kr.description}
                      onChange={e => updateKr(idx, 'description', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">Current</p>
                    <Input
                      type="number"
                      min="0"
                      value={kr.currentValue}
                      onChange={e => updateKr(idx, 'currentValue', parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">Target</p>
                    <Input
                      type="number"
                      min="0"
                      value={kr.targetValue}
                      onChange={e => updateKr(idx, 'targetValue', parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">Unit</p>
                    <Input
                      placeholder="e.g. %"
                      value={kr.unit}
                      onChange={e => updateKr(idx, 'unit', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <button
                      onClick={() => removeKr(idx)}
                      disabled={form.keyResults.length === 1}
                      className="p-1 rounded text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            {editing ? <><Pencil className="h-4 w-4" /> Save Changes</> : <><Plus className="h-4 w-4" /> Add Goal</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete Confirmation Dialog ───────────────────────────────────────────────

function DeleteDialog({
  goal,
  onClose,
  onConfirm,
}: {
  goal: Goal | null
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={!!goal} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete this goal?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
          This cannot be undone.{goal && <> <span className="font-medium text-navy dark:text-white">"{goal.title}"</span> and all its key results will be permanently removed.</>}
        </p>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ViewMode = 'board' | 'list'

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('board')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Goal | null>(null)

  useEffect(() => {
    initializeStorage()
    setGoals(getGoals())
  }, [])

  const reload = () => setGoals(getGoals())

  const handleAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEdit = (goal: Goal) => {
    setEditing(goal)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const handleSave = (goal: Goal) => {
    upsertGoal(goal)
    reload()
    toast(editing ? 'Goal updated' : 'Goal added')
  }

  const handleDeleteRequest = (goal: Goal) => setPendingDelete(goal)

  const handleDeleteConfirm = () => {
    if (!pendingDelete) return
    deleteGoal(pendingDelete.id)
    reload()
    setPendingDelete(null)
    toast('Goal deleted', 'info')
  }

  const handleDeleteClose = () => setPendingDelete(null)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-brand-purple" />
            <h1 className="text-2xl font-bold text-navy dark:text-white">Goals & OKRs</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track objectives and key results by period.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 dark:border-navy-500 overflow-hidden">
            <button
              onClick={() => setViewMode('board')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'board'
                  ? 'bg-brand-purple text-white'
                  : 'text-slate-500 hover:bg-gray-50 dark:hover:bg-navy-500/40'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-brand-purple text-white'
                  : 'text-slate-500 hover:bg-gray-50 dark:hover:bg-navy-500/40'
              )}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
          </div>

          <Button size="sm" onClick={handleAdd} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Goal
          </Button>
        </div>
      </div>

      {/* Summary strip */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {(
            [
              { status: 'on-track'  as GoalStatus, label: 'On Track'  },
              { status: 'at-risk'   as GoalStatus, label: 'At Risk'   },
              { status: 'behind'    as GoalStatus, label: 'Behind'    },
              { status: 'completed' as GoalStatus, label: 'Completed' },
            ] as { status: GoalStatus; label: string }[]
          ).map(({ status, label }) => {
            const count = goals.filter(g => g.status === status).length
            const cfg = STATUS_CONFIG[status]
            return (
              <Card key={status}>
                <CardContent className="p-3 flex items-center justify-between">
                  <p className="text-xs text-slate-500">{label}</p>
                  <span className={cn('text-sm font-bold px-2 py-0.5 rounded-full', cfg.classes)}>
                    {count}
                  </span>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Content */}
      {viewMode === 'board' ? (
        <BoardView goals={goals} onEdit={handleEdit} onDelete={handleDeleteRequest} />
      ) : (
        <ListView goals={goals} onEdit={handleEdit} onDelete={handleDeleteRequest} />
      )}

      {/* Add / Edit Modal */}
      <GoalModal
        open={modalOpen}
        editing={editing}
        onClose={handleModalClose}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <DeleteDialog
        goal={pendingDelete}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
