'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutGrid,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Archive,
  CheckSquare,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  getProjectBoards,
  getCardsForBoard,
  upsertProjectBoard,
  deleteProjectBoard,
  initializeStorage,
} from '@/lib/storage'
import type { ProjectBoard } from '@/types'
import { RoleGate } from '@/components/role-gate'

const BOARD_COLORS = [
  { label: 'Coral', value: '#F05A4A' },
  { label: 'Navy', value: '#1E2A4A' },
  { label: 'Green', value: '#2E7D52' },
  { label: 'Purple', value: '#7C6AE8' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Slate', value: '#64748b' },
]

const DEFAULT_LISTS = ['To Do', 'In Progress', 'Review', 'Done']

function formatRelativeDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Simple inline kebab menu
function BoardKebabMenu({
  onEdit,
  onArchive,
  onDelete,
}: {
  onEdit: () => void
  onArchive: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-navy-500 transition-opacity"
      >
        <MoreHorizontal className="h-4 w-4 text-slate-500" />
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-20 w-40 bg-white dark:bg-navy-600 border border-slate-200 dark:border-navy-500 rounded-lg shadow-lg py-1 text-sm">
          <button
            onClick={e => { e.stopPropagation(); onEdit(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-navy-700 text-left text-slate-700 dark:text-slate-200"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={e => { e.stopPropagation(); onArchive(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-navy-700 text-left text-slate-700 dark:text-slate-200"
          >
            <Archive className="h-3.5 w-3.5" /> Archive
          </button>
          <div className="border-t border-slate-100 dark:border-navy-500 my-1" />
          <button
            onClick={e => { e.stopPropagation(); onDelete(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-left text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default function ProjectsPage() {
  const router = useRouter()
  const [boards, setBoards] = useState<ProjectBoard[]>([])
  const [boardStats, setBoardStats] = useState<Record<string, { total: number; done: number; overdue: number }>>({})
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [editBoard, setEditBoard] = useState<ProjectBoard | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<ProjectBoard | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formColor, setFormColor] = useState(BOARD_COLORS[0].value)
  const [formLists, setFormLists] = useState(DEFAULT_LISTS.join(', '))

  useEffect(() => {
    initializeStorage()
    loadBoards()
  }, [])

  function loadBoards() {
    const all = getProjectBoards().filter(b => !b.archivedAt)
    setBoards(all)

    const today = new Date().toISOString().split('T')[0]
    const stats: Record<string, { total: number; done: number; overdue: number }> = {}
    all.forEach(board => {
      const cards = getCardsForBoard(board.id)
      stats[board.id] = {
        total: cards.length,
        done: cards.filter(c => c.status === 'done').length,
        overdue: cards.filter(c => c.dueDate && c.dueDate < today && c.status !== 'done').length,
      }
    })
    setBoardStats(stats)
  }

  function openNewDialog() {
    setFormTitle('')
    setFormDesc('')
    setFormColor(BOARD_COLORS[0].value)
    setFormLists(DEFAULT_LISTS.join(', '))
    setEditBoard(null)
    setShowNewDialog(true)
  }

  function openEditDialog(board: ProjectBoard) {
    setFormTitle(board.title)
    setFormDesc(board.description ?? '')
    setFormColor(board.color)
    setFormLists(board.lists.map(l => l.title).join(', '))
    setEditBoard(board)
    setShowNewDialog(true)
  }

  function saveBoard() {
    const now = new Date().toISOString()
    const listNames = formLists.split(',').map(s => s.trim()).filter(Boolean)

    if (editBoard) {
      const existingTitles = editBoard.lists.map(l => l.title)
      const newLists = [
        ...editBoard.lists,
        ...listNames
          .filter(n => !existingTitles.includes(n))
          .map((title, i) => ({
            id: `list-${Date.now()}-${i}`,
            boardId: editBoard.id,
            title,
            position: editBoard.lists.length + i,
          })),
      ]
      upsertProjectBoard({ ...editBoard, title: formTitle, description: formDesc || undefined, color: formColor, lists: newLists, updatedAt: now })
    } else {
      const boardId = `board-${Date.now()}`
      upsertProjectBoard({
        id: boardId,
        title: formTitle,
        description: formDesc || undefined,
        color: formColor,
        lists: listNames.map((title, i) => ({ id: `list-${Date.now()}-${i}`, boardId, title, position: i })),
        createdAt: now,
        updatedAt: now,
      })
    }
    setShowNewDialog(false)
    loadBoards()
  }

  function archiveBoard(board: ProjectBoard) {
    upsertProjectBoard({ ...board, archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    loadBoards()
  }

  function confirmDelete() {
    if (!deleteConfirm) return
    deleteProjectBoard(deleteConfirm.id)
    setDeleteConfirm(null)
    loadBoards()
  }

  const totalOpenCards = Object.values(boardStats).reduce((s, b) => s + b.total - b.done, 0)
  const totalOverdue = Object.values(boardStats).reduce((s, b) => s + b.overdue, 0)

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-purple/10 rounded-lg flex items-center justify-center">
            <LayoutGrid className="h-5 w-5 text-brand-purple" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-500 dark:text-white">Projects</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-sm text-slate-500">
                <CheckSquare className="h-3.5 w-3.5 inline mr-1 text-brand-green" />
                {totalOpenCards} open cards
              </span>
              {totalOverdue > 0 && (
                <span className="text-sm text-coral">
                  <Clock className="h-3.5 w-3.5 inline mr-1" />
                  {totalOverdue} overdue
                </span>
              )}
            </div>
          </div>
        </div>
        <RoleGate roles={['admin', 'editor']}>
          <Button onClick={openNewDialog} className="bg-coral hover:bg-coral/90 text-white gap-2">
            <Plus className="h-4 w-4" />
            New Board
          </Button>
        </RoleGate>
      </div>

      {/* Board grid */}
      {boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-navy-600 rounded-2xl flex items-center justify-center mb-4">
            <LayoutGrid className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">No boards yet</h3>
          <p className="text-slate-500 mb-6 max-w-sm">Create your first project board to start tracking tasks, seller onboarding, and campaigns.</p>
          <RoleGate roles={['admin', 'editor']}>
            <Button onClick={openNewDialog} className="bg-coral hover:bg-coral/90 text-white gap-2">
              <Plus className="h-4 w-4" />
              New Board
            </Button>
          </RoleGate>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map(board => {
            const stats = boardStats[board.id] ?? { total: 0, done: 0, overdue: 0 }
            const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

            return (
              <div
                key={board.id}
                className="group relative bg-white dark:bg-navy-600 rounded-xl border border-slate-200 dark:border-navy-500 hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                onClick={() => router.push(`/projects/${board.id}`)}
              >
                <div className="h-1.5 w-full" style={{ backgroundColor: board.color }} />

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-navy-500 dark:text-white text-base leading-tight line-clamp-1">
                      {board.title}
                    </h3>
                    <RoleGate roles={['admin', 'editor']}>
                      <BoardKebabMenu
                        onEdit={() => openEditDialog(board)}
                        onArchive={() => archiveBoard(board)}
                        onDelete={() => setDeleteConfirm(board)}
                      />
                    </RoleGate>
                  </div>

                  {board.description && (
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{board.description}</p>
                  )}

                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs text-slate-400">{board.lists.length} lists</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-400">{stats.total} cards</span>
                    {stats.overdue > 0 && (
                      <>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-coral font-medium">{stats.overdue} overdue</span>
                      </>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Progress</span>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-navy-500 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progress}%`, backgroundColor: board.color }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-navy-500">
                    <div className="flex gap-1">
                      {board.lists.slice(0, 3).map(l => (
                        <Badge key={l.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {l.title}
                        </Badge>
                      ))}
                      {board.lists.length > 3 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          +{board.lists.length - 3}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{formatRelativeDate(board.updatedAt)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New / Edit Board Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editBoard ? 'Edit Board' : 'New Board'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Board Name</Label>
              <Input
                placeholder="e.g. Q2 Seller Onboarding"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="What is this board for?"
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2">
                {BOARD_COLORS.map(c => (
                  <button
                    key={c.value}
                    title={c.label}
                    onClick={() => setFormColor(c.value)}
                    className="w-7 h-7 rounded-full transition-all hover:scale-110"
                    style={{
                      backgroundColor: c.value,
                      outline: formColor === c.value ? `2px solid ${c.value}` : undefined,
                      outlineOffset: formColor === c.value ? '2px' : undefined,
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{editBoard ? 'Add Lists (comma-separated)' : 'Lists (comma-separated)'}</Label>
              <Input
                placeholder="To Do, In Progress, Done"
                value={formLists}
                onChange={e => setFormLists(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowNewDialog(false)}>Cancel</Button>
            <Button
              onClick={saveBoard}
              disabled={!formTitle.trim()}
              className="bg-coral hover:bg-coral/90 text-white"
            >
              {editBoard ? 'Save Changes' : 'Create Board'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={open => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Board?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This will permanently delete <strong>{deleteConfirm?.title}</strong> and all its cards. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete Board</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
