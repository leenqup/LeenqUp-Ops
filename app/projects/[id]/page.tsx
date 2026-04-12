'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  LayoutGrid,
  List,
  Calendar,
  Plus,
  MoreHorizontal,
  Trash2,
  CheckSquare,
  MessageSquare,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Link as LinkIcon,
  X,
  GripVertical,
  Check,
  Flag,
} from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isPast,
  parseISO,
} from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  getProjectBoards,
  getCardsForBoard,
  upsertProjectBoard,
  upsertProjectCard,
  deleteProjectCard,
  getMerchants,
  getCampaigns,
  getPosts,
  initializeStorage,
} from '@/lib/storage'
import type { ProjectBoard, ProjectCard, ProjectList, CardPriority, CardStatus, CardLabel, CardChecklist } from '@/types'

type ViewMode = 'kanban' | 'list' | 'calendar'

const PRIORITY_CONFIG: Record<CardPriority, { label: string; color: string; icon: string }> = {
  urgent: { label: 'Urgent', color: 'text-red-600 bg-red-50 border-red-200', icon: '🔴' },
  high:   { label: 'High',   color: 'text-coral bg-coral/10 border-coral/20', icon: '🟠' },
  medium: { label: 'Medium', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: '🟡' },
  low:    { label: 'Low',    color: 'text-slate-500 bg-slate-50 border-slate-200', icon: '⚪' },
}

const STATUS_CONFIG: Record<CardStatus, { label: string; color: string }> = {
  'todo':        { label: 'To Do',       color: 'bg-slate-100 text-slate-600' },
  'in-progress': { label: 'In Progress', color: 'bg-brand-purple/10 text-brand-purple' },
  'blocked':     { label: 'Blocked',     color: 'bg-red-100 text-red-600' },
  'done':        { label: 'Done',        color: 'bg-brand-green/10 text-brand-green' },
}

function dueDateClass(dueDate: string | undefined, status: CardStatus): string {
  if (!dueDate || status === 'done') return 'text-slate-400'
  const today = new Date().toISOString().split('T')[0]
  if (dueDate < today) return 'text-red-600 font-medium'
  if (dueDate === today) return 'text-amber-600 font-medium'
  return 'text-slate-400'
}

// ── Sortable Card Chip ─────────────────────────────────────────
function SortableCardChip({
  card,
  onClick,
}: {
  card: ProjectCard
  onClick: (card: ProjectCard) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const doneChecks = card.checklist.filter(c => c.done).length
  const totalChecks = card.checklist.length

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-navy-500 rounded-lg border border-slate-200 dark:border-navy-400 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onClick(card)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-navy-500 dark:text-white leading-snug flex-1">{card.title}</p>
        <button
          {...attributes}
          {...listeners}
          className="p-0.5 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Labels */}
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {card.labels.map(lbl => (
            <span
              key={lbl.id}
              className="px-1.5 py-0.5 text-[10px] rounded font-medium text-white"
              style={{ backgroundColor: lbl.color }}
            >
              {lbl.text}
            </span>
          ))}
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <Badge
          variant="secondary"
          className={cn('text-[10px] px-1.5 py-0 border', PRIORITY_CONFIG[card.priority].color)}
        >
          {PRIORITY_CONFIG[card.priority].label}
        </Badge>

        {card.dueDate && (
          <span className={cn('text-[10px] flex items-center gap-0.5', dueDateClass(card.dueDate, card.status))}>
            <Clock className="h-2.5 w-2.5" />
            {format(parseISO(card.dueDate), 'MMM d')}
          </span>
        )}

        {totalChecks > 0 && (
          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
            <CheckSquare className="h-2.5 w-2.5" />
            {doneChecks}/{totalChecks}
          </span>
        )}

        {card.comments.length > 0 && (
          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
            <MessageSquare className="h-2.5 w-2.5" />
            {card.comments.length}
          </span>
        )}

        {card.assignee && (
          <span className="ml-auto w-5 h-5 rounded-full bg-brand-purple text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
            {card.assignee.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Card Detail Dialog ─────────────────────────────────────────
function CardDetailDialog({
  card,
  board,
  open,
  onClose,
  onSave,
  onDelete,
}: {
  card: ProjectCard | null
  board: ProjectBoard
  open: boolean
  onClose: () => void
  onSave: (card: ProjectCard) => void
  onDelete: (id: string) => void
}) {
  const merchants = getMerchants()
  const campaigns = getCampaigns()
  const posts = getPosts()

  const [local, setLocal] = useState<ProjectCard | null>(null)
  const [newCheckText, setNewCheckText] = useState('')
  const [newComment, setNewComment] = useState('')
  const [newAttachLabel, setNewAttachLabel] = useState('')
  const [newAttachUrl, setNewAttachUrl] = useState('')
  const [newLabelText, setNewLabelText] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#7C6AE8')

  useEffect(() => {
    if (card) setLocal({ ...card, checklist: [...card.checklist], comments: [...card.comments], labels: [...card.labels], attachments: [...card.attachments] })
  }, [card])

  if (!local) return null

  function patch(updates: Partial<ProjectCard>) {
    setLocal(prev => prev ? { ...prev, ...updates } : prev)
  }

  function addChecklist() {
    if (!newCheckText.trim()) return
    patch({
      checklist: [
        ...local!.checklist,
        { id: `chk-${Date.now()}`, text: newCheckText.trim(), done: false },
      ],
    })
    setNewCheckText('')
  }

  function toggleCheck(id: string) {
    patch({
      checklist: local!.checklist.map(c => c.id === id ? { ...c, done: !c.done } : c),
    })
  }

  function removeCheck(id: string) {
    patch({ checklist: local!.checklist.filter(c => c.id !== id) })
  }

  function addComment() {
    if (!newComment.trim()) return
    patch({
      comments: [
        ...local!.comments,
        { id: `cmt-${Date.now()}`, text: newComment.trim(), by: 'You', createdAt: new Date().toISOString() },
      ],
    })
    setNewComment('')
  }

  function addAttachment() {
    if (!newAttachUrl.trim()) return
    patch({
      attachments: [
        ...local!.attachments,
        { label: newAttachLabel.trim() || newAttachUrl, url: newAttachUrl.trim() },
      ],
    })
    setNewAttachLabel('')
    setNewAttachUrl('')
  }

  function addLabel() {
    if (!newLabelText.trim()) return
    patch({
      labels: [
        ...local!.labels,
        { id: `lbl-${Date.now()}`, text: newLabelText.trim(), color: newLabelColor },
      ],
    })
    setNewLabelText('')
  }

  function handleSave() {
    if (!local) return
    onSave({ ...local, updatedAt: new Date().toISOString() })
    onClose()
  }

  const doneChecks = local.checklist.filter(c => c.done).length

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel — main content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 min-w-0">
            <DialogHeader>
              <DialogTitle className="sr-only">Edit Card</DialogTitle>
            </DialogHeader>

            {/* Title */}
            <Textarea
              value={local.title}
              onChange={e => patch({ title: e.target.value })}
              className="text-base font-semibold resize-none border-0 shadow-none focus-visible:ring-0 p-0 dark:bg-transparent"
              rows={2}
            />

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 uppercase tracking-wider">Description</Label>
              <Textarea
                value={local.description ?? ''}
                onChange={e => patch({ description: e.target.value })}
                placeholder="Add a more detailed description…"
                rows={3}
                className="text-sm"
              />
            </div>

            {/* Labels */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-500 uppercase tracking-wider">Labels</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {local.labels.map(lbl => (
                  <span key={lbl.id} className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-white" style={{ backgroundColor: lbl.color }}>
                    {lbl.text}
                    <button onClick={() => patch({ labels: local.labels.filter(l => l.id !== lbl.id) })}>
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={newLabelColor}
                  onChange={e => setNewLabelColor(e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <Input
                  value={newLabelText}
                  onChange={e => setNewLabelText(e.target.value)}
                  placeholder="Label text"
                  className="text-sm h-8"
                  onKeyDown={e => e.key === 'Enter' && addLabel()}
                />
                <Button size="sm" variant="secondary" onClick={addLabel} className="h-8 px-2">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-500 uppercase tracking-wider">
                  Checklist {local.checklist.length > 0 && `(${doneChecks}/${local.checklist.length})`}
                </Label>
                {local.checklist.length > 0 && (
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-green rounded-full"
                      style={{ width: `${(doneChecks / local.checklist.length) * 100}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                {local.checklist.map(item => (
                  <div key={item.id} className="flex items-center gap-2 group/chk">
                    <button
                      onClick={() => toggleCheck(item.id)}
                      className={cn(
                        'w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                        item.done ? 'bg-brand-green border-brand-green' : 'border-slate-300 hover:border-brand-green'
                      )}
                    >
                      {item.done && <Check className="h-2.5 w-2.5 text-white" />}
                    </button>
                    <span className={cn('text-sm flex-1', item.done && 'line-through text-slate-400')}>{item.text}</span>
                    <button
                      onClick={() => removeCheck(item.id)}
                      className="opacity-0 group-hover/chk:opacity-100 text-slate-400 hover:text-red-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newCheckText}
                  onChange={e => setNewCheckText(e.target.value)}
                  placeholder="Add a checklist item"
                  className="text-sm h-8"
                  onKeyDown={e => e.key === 'Enter' && addChecklist()}
                />
                <Button size="sm" variant="secondary" onClick={addChecklist} className="h-8 px-2">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-500 uppercase tracking-wider">Comments</Label>
              <div className="space-y-2">
                {local.comments.map(cmt => (
                  <div key={cmt.id} className="bg-slate-50 dark:bg-navy-600 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-navy-500 dark:text-white">{cmt.by}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(cmt.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{cmt.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Write a comment…"
                  rows={2}
                  className="text-sm"
                />
              </div>
              <Button size="sm" variant="secondary" onClick={addComment} disabled={!newComment.trim()}>
                Add Comment
              </Button>
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-500 uppercase tracking-wider">Attachments</Label>
              {local.attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Paperclip className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <a href={att.url} target="_blank" rel="noreferrer" className="text-brand-purple hover:underline truncate flex-1">
                    {att.label}
                  </a>
                  <button onClick={() => patch({ attachments: local.attachments.filter((_, j) => j !== i) })}>
                    <X className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input value={newAttachLabel} onChange={e => setNewAttachLabel(e.target.value)} placeholder="Label" className="text-sm h-8 w-28" />
                <Input value={newAttachUrl} onChange={e => setNewAttachUrl(e.target.value)} placeholder="URL" className="text-sm h-8 flex-1" />
                <Button size="sm" variant="secondary" onClick={addAttachment} className="h-8 px-2">
                  <LinkIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right panel — metadata */}
          <div className="w-56 border-l border-slate-200 dark:border-navy-500 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-navy-600">
            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Status</Label>
              <Select value={local.status} onValueChange={v => patch({ status: v as CardStatus })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_CONFIG) as CardStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Priority</Label>
              <Select value={local.priority} onValueChange={v => patch({ priority: v as CardPriority })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_CONFIG) as CardPriority[]).map(p => (
                    <SelectItem key={p} value={p}>{PRIORITY_CONFIG[p].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Due Date</Label>
              <Input
                type="date"
                value={local.dueDate ?? ''}
                onChange={e => patch({ dueDate: e.target.value || undefined })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Assignee</Label>
              <Input
                value={local.assignee ?? ''}
                onChange={e => patch({ assignee: e.target.value || undefined })}
                placeholder="Initials or name"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Move to List</Label>
              <Select value={local.listId} onValueChange={v => patch({ listId: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {board.lists.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Linked Merchant</Label>
              <Select
                value={local.linkedMerchantId ?? '__none__'}
                onValueChange={v => patch({ linkedMerchantId: v === '__none__' ? undefined : v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {merchants.slice(0, 50).map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Linked Campaign</Label>
              <Select
                value={local.linkedCampaignId ?? '__none__'}
                onValueChange={v => patch({ linkedCampaignId: v === '__none__' ? undefined : v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {campaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-navy-500">
              <Button
                variant="destructive"
                size="sm"
                className="w-full text-xs"
                onClick={() => { onDelete(local.id); onClose() }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete Card
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t border-slate-200 dark:border-navy-500">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-coral hover:bg-coral/90 text-white">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Board Page ────────────────────────────────────────────
export default function BoardPage() {
  const params = useParams()
  const router = useRouter()
  const boardId = params.id as string

  const [board, setBoard] = useState<ProjectBoard | null>(null)
  const [cards, setCards] = useState<ProjectCard[]>([])
  const [view, setView] = useState<ViewMode>('kanban')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [activeCard, setActiveCard] = useState<ProjectCard | null>(null)
  const [detailCard, setDetailCard] = useState<ProjectCard | null>(null)
  const [newCardListId, setNewCardListId] = useState<string | null>(null)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterAssignee, setFilterAssignee] = useState('')
  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  // New list state
  const [addingList, setAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => {
    initializeStorage()
    loadData()
  }, [boardId])

  function loadData() {
    const boards = getProjectBoards()
    const found = boards.find(b => b.id === boardId)
    if (!found) return
    setBoard(found)
    setTitleDraft(found.title)
    setCards(getCardsForBoard(boardId))
  }

  function saveTitle() {
    if (!board || !titleDraft.trim()) return
    const updated = { ...board, title: titleDraft.trim(), updatedAt: new Date().toISOString() }
    upsertProjectBoard(updated)
    setBoard(updated)
    setEditingTitle(false)
  }

  function addList() {
    if (!board || !newListTitle.trim()) return
    const newList: ProjectList = {
      id: `list-${Date.now()}`,
      boardId: board.id,
      title: newListTitle.trim(),
      position: board.lists.length,
    }
    const updated = { ...board, lists: [...board.lists, newList], updatedAt: new Date().toISOString() }
    upsertProjectBoard(updated)
    setBoard(updated)
    setNewListTitle('')
    setAddingList(false)
  }

  function addCard(listId: string) {
    if (!newCardTitle.trim()) return
    const now = new Date().toISOString()
    const listCards = cards.filter(c => c.listId === listId)
    const newCard: ProjectCard = {
      id: `card-${Date.now()}`,
      listId,
      boardId: boardId,
      title: newCardTitle.trim(),
      status: 'todo',
      priority: 'medium',
      labels: [],
      checklist: [],
      comments: [],
      attachments: [],
      position: listCards.length,
      createdAt: now,
      updatedAt: now,
    }
    upsertProjectCard(newCard)
    setCards(prev => [...prev, newCard])
    setNewCardTitle('')
    setNewCardListId(null)
  }

  function saveCard(card: ProjectCard) {
    upsertProjectCard(card)
    setCards(prev => prev.map(c => c.id === card.id ? card : c))
    if (!board) return
    const updated = { ...board, updatedAt: new Date().toISOString() }
    upsertProjectBoard(updated)
    setBoard(updated)
  }

  function removeCard(id: string) {
    deleteProjectCard(id)
    setCards(prev => prev.filter(c => c.id !== id))
  }

  // DnD handlers
  function handleDragStart(event: DragStartEvent) {
    const card = cards.find(c => c.id === event.active.id)
    setActiveCard(card ?? null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeCard = cards.find(c => c.id === active.id)
    if (!activeCard) return

    // over could be a card or a list container
    const overCard = cards.find(c => c.id === over.id)
    const targetListId = overCard ? overCard.listId : (over.id as string)

    if (activeCard.listId !== targetListId) {
      setCards(prev => prev.map(c => c.id === activeCard.id ? { ...c, listId: targetListId } : c))
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCard(null)
    if (!over) return

    const now = new Date().toISOString()
    const movedCard = cards.find(c => c.id === active.id)
    if (!movedCard) return

    const overCard = cards.find(c => c.id === over.id)
    const targetListId = overCard ? overCard.listId : (over.id as string)

    // Rebuild positions within target list
    const updatedCards = cards.map(c => c.id === movedCard.id ? { ...c, listId: targetListId, updatedAt: now } : c)
    const listCards = updatedCards.filter(c => c.listId === targetListId).sort((a, b) => a.position - b.position)

    // Insert movedCard at overCard's position
    const reordered = listCards.filter(c => c.id !== movedCard.id)
    const overIdx = overCard ? reordered.findIndex(c => c.id === overCard.id) : reordered.length
    reordered.splice(overIdx >= 0 ? overIdx : reordered.length, 0, { ...movedCard, listId: targetListId, updatedAt: now })

    const finalCards = updatedCards.map(c => {
      const idx = reordered.findIndex(r => r.id === c.id)
      if (idx >= 0) return { ...c, listId: targetListId, position: idx, updatedAt: now }
      return c
    })

    setCards(finalCards)
    reordered.forEach((c, i) => upsertProjectCard({ ...c, position: i, updatedAt: now }))
  }

  // Filters
  const filteredCards = cards.filter(c => {
    if (filterPriority !== 'all' && c.priority !== filterPriority) return false
    if (filterAssignee && !c.assignee?.toLowerCase().includes(filterAssignee.toLowerCase())) return false
    return true
  })

  if (!board) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">Board not found.</p>
        <Button variant="secondary" onClick={() => router.push('/projects')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
        </Button>
      </div>
    )
  }

  // ── Kanban View ──────────────────────────────────────────────
  const KanbanView = () => (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-6 min-h-0 flex-1">
        {board.lists
          .slice()
          .sort((a, b) => a.position - b.position)
          .map(list => {
            const listCards = filteredCards
              .filter(c => c.listId === list.id)
              .sort((a, b) => a.position - b.position)

            return (
              <div key={list.id} className="flex-shrink-0 w-72">
                {/* Column header */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    {list.color && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: list.color }} />
                    )}
                    <span className="text-sm font-semibold text-navy-500 dark:text-white">{list.title}</span>
                    <span className="text-xs text-slate-400 bg-slate-100 dark:bg-navy-600 rounded px-1.5 py-0.5">
                      {listCards.length}
                    </span>
                  </div>
                </div>

                {/* Drop zone + cards */}
                <SortableContext
                  items={listCards.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                  id={list.id}
                >
                  <div className="bg-slate-50 dark:bg-navy-700 rounded-xl p-2 space-y-2 min-h-[120px]">
                    {listCards.map(card => (
                      <SortableCardChip
                        key={card.id}
                        card={card}
                        onClick={c => setDetailCard(c)}
                      />
                    ))}

                    {/* Inline add card */}
                    {newCardListId === list.id ? (
                      <div className="space-y-2">
                        <Textarea
                          autoFocus
                          value={newCardTitle}
                          onChange={e => setNewCardTitle(e.target.value)}
                          placeholder="Card title…"
                          rows={2}
                          className="text-sm resize-none"
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              addCard(list.id)
                            }
                            if (e.key === 'Escape') {
                              setNewCardListId(null)
                              setNewCardTitle('')
                            }
                          }}
                        />
                        <div className="flex gap-1.5">
                          <Button size="sm" onClick={() => addCard(list.id)} className="bg-coral hover:bg-coral/90 text-white text-xs h-7">
                            Add
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setNewCardListId(null); setNewCardTitle('') }} className="text-xs h-7">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setNewCardListId(list.id)}
                        className="w-full flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-600 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add card
                      </button>
                    )}
                  </div>
                </SortableContext>
              </div>
            )
          })}

        {/* Add new list */}
        <div className="flex-shrink-0 w-72">
          {addingList ? (
            <div className="bg-slate-50 dark:bg-navy-700 rounded-xl p-3 space-y-2">
              <Input
                autoFocus
                value={newListTitle}
                onChange={e => setNewListTitle(e.target.value)}
                placeholder="List title…"
                className="text-sm h-8"
                onKeyDown={e => {
                  if (e.key === 'Enter') addList()
                  if (e.key === 'Escape') { setAddingList(false); setNewListTitle('') }
                }}
              />
              <div className="flex gap-1.5">
                <Button size="sm" onClick={addList} className="bg-coral hover:bg-coral/90 text-white text-xs h-7">Add List</Button>
                <Button size="sm" variant="ghost" onClick={() => { setAddingList(false); setNewListTitle('') }} className="text-xs h-7">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingList(true)}
              className="w-full flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 border-2 border-dashed border-slate-200 dark:border-navy-600 rounded-xl p-4 hover:border-slate-300 dark:hover:border-navy-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add a list
            </button>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeCard && (
          <div className="bg-white dark:bg-navy-500 rounded-lg border border-slate-200 shadow-xl p-3 w-72 opacity-95 rotate-1">
            <p className="text-sm font-medium text-navy-500 dark:text-white">{activeCard.title}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )

  // ── List View ────────────────────────────────────────────────
  const ListView = () => (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-navy-600">
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">List</th>
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignee</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-navy-600">
          {filteredCards.sort((a, b) => {
            const pa = ['urgent','high','medium','low'].indexOf(a.priority)
            const pb = ['urgent','high','medium','low'].indexOf(b.priority)
            return pa - pb
          }).map(card => {
            const list = board.lists.find(l => l.id === card.listId)
            return (
              <tr
                key={card.id}
                className="hover:bg-slate-50 dark:hover:bg-navy-600 cursor-pointer transition-colors"
                onClick={() => setDetailCard(card)}
              >
                <td className="py-2.5 px-3 font-medium text-navy-500 dark:text-white max-w-[280px]">
                  <span className="truncate block">{card.title}</span>
                </td>
                <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{list?.title ?? '—'}</td>
                <td className="py-2.5 px-3">
                  <Badge variant="secondary" className={cn('text-[10px]', PRIORITY_CONFIG[card.priority].color)}>
                    {PRIORITY_CONFIG[card.priority].label}
                  </Badge>
                </td>
                <td className="py-2.5 px-3">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', STATUS_CONFIG[card.status].color)}>
                    {STATUS_CONFIG[card.status].label}
                  </span>
                </td>
                <td className={cn('py-2.5 px-3 text-xs whitespace-nowrap', dueDateClass(card.dueDate, card.status))}>
                  {card.dueDate ? format(parseISO(card.dueDate), 'MMM d, yyyy') : '—'}
                </td>
                <td className="py-2.5 px-3">
                  {card.assignee ? (
                    <span className="w-6 h-6 rounded-full bg-brand-purple text-white text-[9px] font-bold flex items-center justify-center">
                      {card.assignee.slice(0, 2).toUpperCase()}
                    </span>
                  ) : <span className="text-slate-400">—</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {filteredCards.length === 0 && (
        <div className="text-center py-12 text-slate-400">No cards match your filters.</div>
      )}
    </div>
  )

  // ── Calendar View ────────────────────────────────────────────
  const CalendarView = () => {
    const monthStart = startOfMonth(calendarMonth)
    const monthEnd = endOfMonth(calendarMonth)
    const calStart = startOfWeek(monthStart)
    const calEnd = endOfWeek(monthEnd)
    const days = eachDayOfInterval({ start: calStart, end: calEnd })
    const today = new Date()

    const scheduledCards = filteredCards.filter(c => c.dueDate)
    const unscheduled = filteredCards.filter(c => !c.dueDate)

    function cardsForDay(day: Date) {
      const dayStr = format(day, 'yyyy-MM-dd')
      return scheduledCards.filter(c => c.dueDate === dayStr)
    }

    return (
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Calendar grid */}
        <div className="flex-1 min-w-0">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCalendarMonth(m => subMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-600">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="text-base font-semibold text-navy-500 dark:text-white">
              {format(calendarMonth, 'MMMM yyyy')}
            </h3>
            <button onClick={() => setCalendarMonth(m => addMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-600">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-slate-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 border-l border-t border-slate-200 dark:border-navy-600">
            {days.map(day => {
              const dayCards = cardsForDay(day)
              const isCurrentMonth = isSameMonth(day, calendarMonth)
              const isToday_ = isToday(day)
              const visible = dayCards.slice(0, 3)
              const overflow = dayCards.length - visible.length

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'border-r border-b border-slate-200 dark:border-navy-600 p-1 min-h-[88px]',
                    !isCurrentMonth && 'bg-slate-50 dark:bg-navy-700/50',
                  )}
                >
                  <div className={cn(
                    'text-xs font-medium w-6 h-6 rounded-full flex items-center justify-center mb-1',
                    isToday_ ? 'bg-coral text-white' : isCurrentMonth ? 'text-navy-500 dark:text-white' : 'text-slate-300 dark:text-navy-500',
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {visible.map(card => (
                      <button
                        key={card.id}
                        onClick={() => setDetailCard(card)}
                        className={cn(
                          'w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate font-medium',
                          card.status === 'done'
                            ? 'bg-brand-green/10 text-brand-green'
                            : isPast(parseISO(card.dueDate!))
                            ? 'bg-red-50 text-red-600'
                            : 'text-white',
                        )}
                        style={card.status !== 'done' && !isPast(parseISO(card.dueDate!)) ? { backgroundColor: board.color } : undefined}
                      >
                        {card.title}
                      </button>
                    ))}
                    {overflow > 0 && (
                      <div className="text-[10px] text-slate-400 pl-1">+{overflow} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Unscheduled sidebar */}
        <div className="w-52 flex-shrink-0">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Unscheduled ({unscheduled.length})
          </h4>
          <div className="space-y-1.5 overflow-y-auto max-h-[500px]">
            {unscheduled.map(card => (
              <button
                key={card.id}
                onClick={() => setDetailCard(card)}
                className="w-full text-left bg-white dark:bg-navy-600 border border-slate-200 dark:border-navy-500 rounded-lg p-2 hover:shadow-sm transition-shadow"
              >
                <p className="text-xs font-medium text-navy-500 dark:text-white line-clamp-2">{card.title}</p>
                <Badge variant="secondary" className={cn('text-[10px] mt-1', PRIORITY_CONFIG[card.priority].color)}>
                  {PRIORITY_CONFIG[card.priority].label}
                </Badge>
              </button>
            ))}
            {unscheduled.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">All cards have due dates</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-4 max-w-full overflow-hidden">
      {/* Sticky top bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => router.push('/projects')}
          className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Projects
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-navy-600" />

        {/* Inline title edit */}
        {editingTitle ? (
          <Input
            autoFocus
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setEditingTitle(false); setTitleDraft(board.title) } }}
            className="text-xl font-bold border-b border-coral rounded-none shadow-none px-0 h-auto focus-visible:ring-0 w-64"
          />
        ) : (
          <h1
            className="text-xl font-bold text-navy-500 dark:text-white cursor-pointer hover:text-coral transition-colors"
            onClick={() => setEditingTitle(true)}
            title="Click to edit"
          >
            {board.title}
          </h1>
        )}

        {/* View switcher */}
        <div className="flex bg-slate-100 dark:bg-navy-700 rounded-lg p-1 ml-auto">
          {([
            { v: 'kanban' as ViewMode, icon: LayoutGrid, label: 'Kanban' },
            { v: 'list' as ViewMode, icon: List, label: 'List' },
            { v: 'calendar' as ViewMode, icon: Calendar, label: 'Calendar' },
          ]).map(({ v, icon: Icon, label }) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                view === v
                  ? 'bg-white dark:bg-navy-500 text-navy-500 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="h-8 text-xs w-32">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Input
          value={filterAssignee}
          onChange={e => setFilterAssignee(e.target.value)}
          placeholder="Filter assignee…"
          className="h-8 text-xs w-36"
        />
      </div>

      {/* View content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {view === 'kanban' && <KanbanView />}
        {view === 'list' && <ListView />}
        {view === 'calendar' && <CalendarView />}
      </div>

      {/* Card detail dialog */}
      <CardDetailDialog
        card={detailCard}
        board={board}
        open={!!detailCard}
        onClose={() => setDetailCard(null)}
        onSave={saveCard}
        onDelete={removeCard}
      />
    </div>
  )
}
