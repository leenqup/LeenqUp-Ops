'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  Plus,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Users,
  Globe,
  X,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RoleGate } from '@/components/role-gate'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  getMerchantAccounts,
  upsertMerchantAccount,
  deleteMerchantAccount,
  getMerchants,
  initializeStorage,
} from '@/lib/storage'
import type { MerchantAccount, Merchant } from '@/types'

interface DuplicatePair {
  a: Merchant
  b: Merchant
  reason: string
}

export default function AccountsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<MerchantAccount[]>([])
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([])
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [editAccount, setEditAccount] = useState<MerchantAccount | null>(null)
  const [dismissedPairs, setDismissedPairs] = useState<Set<string>>(new Set())

  // Form state
  const [formName, setFormName] = useState('')
  const [formCountry, setFormCountry] = useState('')
  const [formWebsite, setFormWebsite] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formMerchantIds, setFormMerchantIds] = useState<string[]>([])
  const [merchantSearch, setMerchantSearch] = useState('')

  useEffect(() => {
    initializeStorage()
    const m = getMerchants()
    const a = getMerchantAccounts()
    setMerchants(m)
    setAccounts(a)
    detectDuplicates(m)
  }, [])

  function detectDuplicates(merchantList: Merchant[]) {
    const pairs: DuplicatePair[] = []
    const seen = new Set<string>()

    for (let i = 0; i < merchantList.length; i++) {
      for (let j = i + 1; j < merchantList.length; j++) {
        const a = merchantList[i]
        const b = merchantList[j]
        const key = `${a.id}-${b.id}`
        if (seen.has(key)) continue

        let reason = ''
        if (a.phone && b.phone && a.phone === b.phone) reason = `Same phone: ${a.phone}`
        else if (a.email && b.email && a.email.toLowerCase() === b.email.toLowerCase()) reason = `Same email: ${a.email}`
        else if (a.instagram && b.instagram && a.instagram.toLowerCase() === b.instagram.toLowerCase()) reason = `Same Instagram: ${a.instagram}`
        else {
          // Similar names (simple heuristic)
          const nameA = a.name.toLowerCase().replace(/[^a-z\s]/g, '').trim()
          const nameB = b.name.toLowerCase().replace(/[^a-z\s]/g, '').trim()
          if (nameA.length > 5 && nameB.length > 5 && (nameA.includes(nameB.split(' ')[0]) || nameB.includes(nameA.split(' ')[0]))) {
            reason = `Similar name: "${a.name}" and "${b.name}"`
          }
        }

        if (reason) {
          seen.add(key)
          pairs.push({ a, b, reason })
        }
      }
    }

    setDuplicates(pairs.slice(0, 20)) // cap at 20 pairs
  }

  function reload() {
    const a = getMerchantAccounts()
    setAccounts(a)
  }

  function toggleExpanded(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function openNewDialog() {
    setFormName('')
    setFormCountry('USA')
    setFormWebsite('')
    setFormNotes('')
    setFormMerchantIds([])
    setMerchantSearch('')
    setEditAccount(null)
    setShowNewDialog(true)
  }

  function openEditDialog(account: MerchantAccount) {
    setFormName(account.name)
    setFormCountry(account.country)
    setFormWebsite(account.website ?? '')
    setFormNotes(account.notes ?? '')
    setFormMerchantIds([...account.merchantIds])
    setMerchantSearch('')
    setEditAccount(account)
    setShowNewDialog(true)
  }

  function saveAccount() {
    const now = new Date().toISOString()
    if (editAccount) {
      upsertMerchantAccount({
        ...editAccount,
        name: formName,
        country: formCountry,
        website: formWebsite || undefined,
        notes: formNotes || undefined,
        merchantIds: formMerchantIds,
      })
    } else {
      upsertMerchantAccount({
        id: `acct-${Date.now()}`,
        name: formName,
        country: formCountry,
        website: formWebsite || undefined,
        notes: formNotes || undefined,
        merchantIds: formMerchantIds,
        createdAt: now,
      })
    }
    setShowNewDialog(false)
    reload()
  }

  function toggleMerchantInForm(id: string) {
    setFormMerchantIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const filteredMerchants = merchants.filter(m =>
    m.name.toLowerCase().includes(merchantSearch.toLowerCase())
  )

  const activeDuplicates = duplicates.filter(pair => {
    return !dismissedPairs.has(`${pair.a.id}-${pair.b.id}`)
  })

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/crm')}
          className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          CRM Pipeline
        </button>
        <div className="w-px h-5 bg-slate-200 dark:bg-navy-600" />
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 bg-navy-500/10 rounded-lg flex items-center justify-center">
            <Building2 className="h-4 w-4 text-navy-500 dark:text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-navy-500 dark:text-white">Accounts</h1>
            <p className="text-xs text-slate-500">{accounts.length} company accounts</p>
          </div>
        </div>
        <RoleGate roles={['admin', 'editor']}>
          <Button onClick={openNewDialog} className="bg-coral hover:bg-coral/90 text-white gap-2">
            <Plus className="h-4 w-4" />
            New Account
          </Button>
        </RoleGate>
      </div>

      {/* Duplicate Detection Panel */}
      {activeDuplicates.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400">
              {activeDuplicates.length} Potential Duplicate{activeDuplicates.length > 1 ? 's' : ''} Detected
            </h3>
          </div>
          <div className="space-y-2">
            {activeDuplicates.map(pair => (
              <div key={`${pair.a.id}-${pair.b.id}`} className="flex items-start gap-3 bg-white dark:bg-navy-700 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-navy-500 dark:text-white">{pair.a.name}</span>
                    <span className="text-xs text-slate-400">and</span>
                    <span className="text-xs font-semibold text-navy-500 dark:text-white">{pair.b.name}</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">{pair.reason}</p>
                </div>
                <button
                  onClick={() => setDismissedPairs(prev => new Set([...prev, `${pair.a.id}-${pair.b.id}`]))}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-navy-600 rounded text-slate-400 hover:text-slate-600 flex-shrink-0"
                  title="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accounts list */}
      {accounts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-navy-600 rounded-xl border border-slate-200 dark:border-navy-500">
          <Building2 className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-600 dark:text-slate-300 mb-2">No accounts yet</h3>
          <p className="text-sm text-slate-400 mb-4">Group merchants by parent company or organization.</p>
          <RoleGate roles={['admin', 'editor']}>
            <Button onClick={openNewDialog} className="bg-coral hover:bg-coral/90 text-white gap-2">
              <Plus className="h-4 w-4" />
              New Account
            </Button>
          </RoleGate>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(account => {
            const linkedMerchants = merchants.filter(m => account.merchantIds.includes(m.id))
            const isExpanded = expanded.has(account.id)

            return (
              <div key={account.id} className="bg-white dark:bg-navy-600 rounded-xl border border-slate-200 dark:border-navy-500">
                {/* Account header */}
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => toggleExpanded(account.id)}
                    className="p-0.5 text-slate-400 hover:text-slate-600"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <div className="w-8 h-8 bg-navy-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-4 w-4 text-navy-500 dark:text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-navy-500 dark:text-white">{account.name}</h3>
                      <Badge variant="secondary" className="text-[10px]">
                        <Users className="h-2.5 w-2.5 mr-1" />
                        {linkedMerchants.length} merchant{linkedMerchants.length !== 1 ? 's' : ''}
                      </Badge>
                      {account.country && (
                        <Badge variant="secondary" className="text-[10px]">
                          <Globe className="h-2.5 w-2.5 mr-1" />
                          {account.country}
                        </Badge>
                      )}
                    </div>
                    {account.notes && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{account.notes}</p>
                    )}
                  </div>
                  <RoleGate roles={['admin', 'editor']}>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEditDialog(account)} className="text-xs h-7">
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => { deleteMerchantAccount(account.id); reload() }}
                        className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </RoleGate>
                </div>

                {/* Expanded merchant rows */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-navy-500">
                    {linkedMerchants.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">No merchants linked</p>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-navy-500">
                        {linkedMerchants.map(m => (
                          <div key={m.id} className="flex items-center gap-3 px-6 py-3">
                            <div className="w-6 h-6 rounded-full bg-coral/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-coral">
                                {m.name.slice(0, 1)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-navy-500 dark:text-white">{m.name}</p>
                              <p className="text-xs text-slate-500">{m.category} · {m.city}</p>
                            </div>
                            <Badge
                              variant={
                                m.outreachStatus === 'signed-up' ? 'success' :
                                m.outreachStatus === 'interested' ? 'warning' :
                                'secondary'
                              }
                              className="text-[10px]"
                            >
                              {m.outreachStatus.replace('-', ' ')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* New / Edit Account Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editAccount ? 'Edit Account' : 'New Account'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Company Name</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Kaldi Group" />
              </div>
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input value={formCountry} onChange={e => setFormCountry(e.target.value)} placeholder="USA" />
              </div>
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input value={formWebsite} onChange={e => setFormWebsite(e.target.value)} placeholder="https://…" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Notes</Label>
                <Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Linked Merchants ({formMerchantIds.length} selected)</Label>
              <Input
                value={merchantSearch}
                onChange={e => setMerchantSearch(e.target.value)}
                placeholder="Search merchants…"
                className="h-8 text-sm"
              />
              <div className="max-h-48 overflow-y-auto border rounded-lg divide-y divide-slate-100 dark:divide-navy-500">
                {filteredMerchants.slice(0, 50).map(m => (
                  <button
                    key={m.id}
                    onClick={() => toggleMerchantInForm(m.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-navy-700 text-left"
                  >
                    <div className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                      formMerchantIds.includes(m.id) ? 'bg-coral border-coral' : 'border-slate-300'
                    )}>
                      {formMerchantIds.includes(m.id) && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-navy-500 dark:text-white truncate">{m.name}</p>
                      <p className="text-[10px] text-slate-400">{m.category} · {m.city}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowNewDialog(false)}>Cancel</Button>
            <Button
              onClick={saveAccount}
              disabled={!formName.trim()}
              className="bg-coral hover:bg-coral/90 text-white"
            >
              {editAccount ? 'Save Changes' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
