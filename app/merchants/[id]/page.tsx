'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Store,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  DollarSign,
  Package,
  Star,
  TrendingUp,
  BarChart2,
  Camera,
  FileText,
  Tag,
  Wifi,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { computeMerchantHealth } from '@/lib/merchant-health'
import {
  getMerchants,
  getSellerProfile,
  upsertSellerProfile,
  initializeStorage,
} from '@/lib/storage'
import type {
  Merchant,
  SellerProfile,
  OnboardingStep,
  OnboardingChecklistItem,
  ProductListing,
  PayoutRecord,
} from '@/types'

// ── Onboarding config ─────────────────────────────────────────
const ONBOARDING_STEPS: { step: OnboardingStep; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { step: 'profile-photo',    label: 'Profile Photo',    description: 'Upload a clear business or personal photo',  icon: Camera },
  { step: 'first-listing',    label: 'First Listing',    description: 'Create and publish at least one product',    icon: Package },
  { step: 'payment-method',   label: 'Payment Method',   description: 'Set up how customers can pay you',           icon: DollarSign },
  { step: 'bank-details',     label: 'Bank Details',     description: 'Add bank or mobile money for payouts',       icon: FileText },
  { step: 'first-sale',       label: 'First Sale',       description: 'Complete your first transaction on LeenqUp', icon: TrendingUp },
  { step: 'review-collected', label: 'Review Collected', description: 'Receive your first buyer review',            icon: Star },
]

// ── Quality score helper ──────────────────────────────────────
function computeQualityScore(listing: ProductListing): number {
  let score = 0
  if (listing.photosCount > 0) score += 25
  if (listing.hasDescription) score += 25
  if (listing.hasPrice) score += 25
  if (listing.status === 'live') score += 25
  return score
}

function QualityBadge({ score }: { score: number }) {
  const color = score >= 75 ? 'text-brand-green' : score >= 50 ? 'text-amber-600' : 'text-red-600'
  return <span className={cn('text-xs font-semibold', color)}>{score}%</span>
}

// ── Outreach status badge ─────────────────────────────────────
function OutreachBadge({ status }: { status: Merchant['outreachStatus'] }) {
  const config: Record<string, string> = {
    'signed-up': 'success',
    'interested': 'warning',
    'contacted': 'navy',
    'responded': 'purple',
    'not-contacted': 'secondary',
    'declined': 'danger',
    'not-a-fit': 'danger',
  }
  return (
    <Badge variant={(config[status] ?? 'secondary') as 'success' | 'warning' | 'navy' | 'purple' | 'secondary' | 'danger'} className="capitalize text-xs">
      {status.replace(/-/g, ' ')}
    </Badge>
  )
}

// ── Default SellerProfile factory ─────────────────────────────
function createDefaultProfile(merchantId: string): SellerProfile {
  const now = new Date().toISOString()
  return {
    id: `sp-${merchantId}`,
    merchantId,
    onboardingChecklist: ONBOARDING_STEPS.map(s => ({
      step: s.step,
      completed: false,
    })),
    listings: [],
    payouts: [],
    performance: {
      merchantId,
      estimatedOrders: 0,
      returnRate: 0,
      responseRate: 0,
      reviewCount: 0,
      lastUpdated: now,
    },
    createdAt: now,
    updatedAt: now,
  }
}

// ── Main Page ─────────────────────────────────────────────────
export default function SellerDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const merchantId = params.id as string

  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [profile, setProfile] = useState<SellerProfile | null>(null)

  // Listing dialog
  const [showListingDialog, setShowListingDialog] = useState(false)
  const [listingTitle, setListingTitle] = useState('')
  const [listingCategory, setListingCategory] = useState('')
  const [listingPrice, setListingPrice] = useState('')
  const [listingPhotos, setListingPhotos] = useState('0')
  const [listingHasDesc, setListingHasDesc] = useState(false)
  const [listingStatus, setListingStatus] = useState<ProductListing['status']>('draft')

  // Payout dialog
  const [showPayoutDialog, setShowPayoutDialog] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutMethod, setPayoutMethod] = useState<PayoutRecord['method']>('mobile-money')
  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().split('T')[0])
  const [payoutRef, setPayoutRef] = useState('')
  const [payoutNotes, setPayoutNotes] = useState('')

  // Performance edit
  const [editingPerf, setEditingPerf] = useState(false)
  const [perfOrders, setPerfOrders] = useState('0')
  const [perfResponse, setPerfResponse] = useState('0')
  const [perfReturn, setPerfReturn] = useState('0')
  const [perfRating, setPerfRating] = useState('')
  const [perfReviews, setPerfReviews] = useState('0')

  useEffect(() => {
    initializeStorage()
    const m = getMerchants().find(m => m.id === merchantId)
    if (!m) return
    setMerchant(m)

    let p = getSellerProfile(merchantId)
    if (!p) {
      p = createDefaultProfile(merchantId)
      upsertSellerProfile(p)
    }
    setProfile(p)
  }, [merchantId])

  function saveProfile(updated: SellerProfile) {
    const p = { ...updated, updatedAt: new Date().toISOString() }
    upsertSellerProfile(p)
    setProfile(p)
  }

  function toggleOnboarding(step: OnboardingStep) {
    if (!profile) return
    const checklist = profile.onboardingChecklist.map(item =>
      item.step === step
        ? { ...item, completed: !item.completed, completedAt: !item.completed ? new Date().toISOString() : undefined }
        : item
    )
    saveProfile({ ...profile, onboardingChecklist: checklist })
  }

  function addListing() {
    if (!profile || !listingTitle.trim()) return
    const now = new Date().toISOString()
    const listing: ProductListing = {
      id: `lst-${Date.now()}`,
      merchantId,
      title: listingTitle.trim(),
      category: listingCategory,
      priceUSD: Number(listingPrice) || 0,
      photosCount: Number(listingPhotos) || 0,
      hasDescription: listingHasDesc,
      hasPrice: Number(listingPrice) > 0,
      status: listingStatus,
      createdAt: now,
      updatedAt: now,
    }
    listing.qualityScore = computeQualityScore(listing)
    saveProfile({ ...profile, listings: [...profile.listings, listing] })
    setShowListingDialog(false)
    setListingTitle('')
    setListingCategory('')
    setListingPrice('')
    setListingPhotos('0')
    setListingHasDesc(false)
    setListingStatus('draft')
  }

  function removeListing(id: string) {
    if (!profile) return
    saveProfile({ ...profile, listings: profile.listings.filter(l => l.id !== id) })
  }

  function addPayout() {
    if (!profile || !payoutAmount) return
    const now = new Date().toISOString()
    const payout: PayoutRecord = {
      id: `pay-${Date.now()}`,
      merchantId,
      amountUSD: Number(payoutAmount),
      method: payoutMethod,
      date: payoutDate,
      reference: payoutRef || undefined,
      notes: payoutNotes || undefined,
      recordedBy: 'You',
      createdAt: now,
    }
    saveProfile({ ...profile, payouts: [...profile.payouts, payout] })
    setShowPayoutDialog(false)
    setPayoutAmount('')
    setPayoutRef('')
    setPayoutNotes('')
  }

  function savePerformance() {
    if (!profile) return
    saveProfile({
      ...profile,
      performance: {
        merchantId,
        estimatedOrders: Number(perfOrders),
        responseRate: Number(perfResponse),
        returnRate: Number(perfReturn),
        avgRating: perfRating ? Number(perfRating) : undefined,
        reviewCount: Number(perfReviews),
        lastUpdated: new Date().toISOString(),
      },
    })
    setEditingPerf(false)
  }

  if (!merchant || !profile) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">Merchant not found.</p>
        <Button variant="secondary" onClick={() => router.push('/merchants')} className="mt-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Merchants
        </Button>
      </div>
    )
  }

  const completedSteps = profile.onboardingChecklist.filter(s => s.completed).length
  const totalSteps = profile.onboardingChecklist.length
  const onboardingPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  const totalPaidOut = profile.payouts.reduce((s, p) => s + p.amountUSD, 0)
  const liveListings = profile.listings.filter(l => l.status === 'live').length
  const avgQuality = profile.listings.length > 0
    ? Math.round(profile.listings.reduce((s, l) => s + (l.qualityScore ?? 0), 0) / profile.listings.length)
    : 0

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back link */}
      <button
        onClick={() => router.push('/merchants')}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Merchants
      </button>

      {/* Merchant header */}
      <div className="bg-white dark:bg-navy-600 rounded-xl border border-slate-200 dark:border-navy-500 p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-coral/10 flex items-center justify-center flex-shrink-0">
            <Store className="h-6 w-6 text-coral" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-navy-500 dark:text-white">{merchant.name}</h1>
              <OutreachBadge status={merchant.outreachStatus} />
              {merchant.tier && (
                <Badge variant="outline" className="text-[10px]">Tier {merchant.tier}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
              <span>{merchant.category}</span>
              <span>·</span>
              <span>{merchant.city}, {merchant.country}</span>
              {merchant.instagram && (
                <>
                  <span>·</span>
                  <a href={`https://instagram.com/${merchant.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="text-brand-purple hover:underline flex items-center gap-1">
                    {merchant.instagram} <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex gap-4 text-center flex-shrink-0">
            <div>
              <p className="text-lg font-bold text-navy-500 dark:text-white">{liveListings}</p>
              <p className="text-[10px] text-slate-400">Live Listings</p>
            </div>
            <div>
              <p className="text-lg font-bold text-navy-500 dark:text-white">${totalPaidOut.toFixed(0)}</p>
              <p className="text-[10px] text-slate-400">Total Paid Out</p>
            </div>
            <div>
              <p className="text-lg font-bold text-navy-500 dark:text-white">{onboardingPct}%</p>
              <p className="text-[10px] text-slate-400">Onboarded</p>
            </div>
          </div>
        </div>
      </div>

      {/* Health Score card */}
      {(() => {
        const health = computeMerchantHealth(merchant)
        const gradeColors: Record<string, string> = {
          A: 'bg-emerald-100 text-emerald-800',
          B: 'bg-blue-100 text-blue-800',
          C: 'bg-amber-100 text-amber-800',
          D: 'bg-orange-100 text-orange-800',
          F: 'bg-red-100 text-red-800',
        }
        const breakdownRows = [
          { label: 'Contact Info',       value: health.breakdown.contactCompleteness },
          { label: 'Outreach Activity',  value: health.breakdown.outreachActivity },
          { label: 'Pipeline Stage',     value: health.breakdown.pipelineStage },
          { label: 'Notes',              value: health.breakdown.notesDepth },
        ]
        return (
          <div className="bg-white dark:bg-navy-600 rounded-xl border border-slate-200 dark:border-navy-500 p-5 space-y-4">
            {/* Header row */}
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-navy-500 dark:text-white text-base">Health Score</h2>
              <span className={cn('px-2 py-0.5 rounded text-sm font-bold', gradeColors[health.grade])}>
                {health.grade}
              </span>
            </div>

            {/* Overall score + bar */}
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-navy-500 dark:text-white">{health.total}</span>
                <span className="text-slate-400 text-sm">/100</span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-navy-400 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    health.total >= 70 ? 'bg-emerald-500' : health.total >= 50 ? 'bg-amber-500' : health.total >= 30 ? 'bg-orange-500' : 'bg-red-500',
                  )}
                  style={{ width: `${health.total}%` }}
                />
              </div>
            </div>

            {/* Breakdown table */}
            <div className="border border-slate-100 dark:border-navy-500 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-50 dark:divide-navy-500">
                  {breakdownRows.map(row => (
                    <tr key={row.label}>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.label}</td>
                      <td className="px-3 py-2 text-right font-semibold text-navy-500 dark:text-white tabular-nums">
                        {row.value}<span className="text-slate-400 font-normal">/25</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Flags */}
            {health.flags.length > 0 && (
              <div className="space-y-1">
                {health.flags.map(flag => (
                  <div key={flag} className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                    {flag}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {/* Tabs */}
      <Tabs defaultValue="onboarding">
        <TabsList>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="listings">Listings ({profile.listings.length})</TabsTrigger>
          <TabsTrigger value="payouts">Payouts ({profile.payouts.length})</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* ── Onboarding Tab ──────────────────────────────────── */}
        <TabsContent value="onboarding" className="mt-4">
          <div className="bg-white dark:bg-navy-600 rounded-xl border border-slate-200 dark:border-navy-500 p-5">
            {/* Progress ring area */}
            <div className="flex items-center gap-5 mb-5 pb-5 border-b border-slate-100 dark:border-navy-500">
              {/* Simple progress ring */}
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                  <circle
                    cx="32" cy="32" r="26" fill="none"
                    stroke={onboardingPct === 100 ? '#2E7D52' : '#F05A4A'}
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - onboardingPct / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-navy-500 dark:text-white">{onboardingPct}%</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-navy-500 dark:text-white">
                  {completedSteps}/{totalSteps} steps completed
                </h3>
                <p className="text-sm text-slate-500">
                  {onboardingPct === 100
                    ? 'Seller fully onboarded! 🎉'
                    : `${totalSteps - completedSteps} steps remaining`}
                </p>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              {profile.onboardingChecklist.map(item => {
                const config = ONBOARDING_STEPS.find(s => s.step === item.step)
                if (!config) return null
                const Icon = config.icon
                return (
                  <div
                    key={item.step}
                    onClick={() => toggleOnboarding(item.step)}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                      item.completed
                        ? 'bg-brand-green/5 border border-brand-green/20'
                        : 'bg-slate-50 dark:bg-navy-700 border border-transparent hover:border-slate-200 dark:hover:border-navy-500'
                    )}
                  >
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                      item.completed ? 'bg-brand-green' : 'bg-slate-200 dark:bg-navy-600'
                    )}>
                      {item.completed
                        ? <CheckCircle2 className="h-4 w-4 text-white" />
                        : <Circle className="h-4 w-4 text-slate-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-slate-400" />
                        <span className={cn(
                          'text-sm font-medium',
                          item.completed ? 'text-brand-green line-through' : 'text-navy-500 dark:text-white'
                        )}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{config.description}</p>
                      {item.completedAt && (
                        <p className="text-[10px] text-brand-green mt-0.5">
                          Completed {new Date(item.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>

        {/* ── Listings Tab ────────────────────────────────────── */}
        <TabsContent value="listings" className="mt-4">
          <div className="bg-white dark:bg-navy-600 rounded-xl border border-slate-200 dark:border-navy-500">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-navy-500">
              <div>
                <h3 className="font-semibold text-navy-500 dark:text-white">Product Listings</h3>
                {profile.listings.length > 0 && (
                  <p className="text-xs text-slate-500">Avg quality score: <span className="font-semibold">{avgQuality}%</span></p>
                )}
              </div>
              <Button onClick={() => setShowListingDialog(true)} className="bg-coral hover:bg-coral/90 text-white gap-2" size="sm">
                <Plus className="h-3.5 w-3.5" /> Add Listing
              </Button>
            </div>

            {profile.listings.length === 0 ? (
              <div className="text-center py-10">
                <Package className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No listings yet. Add the seller's first product.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-navy-500">
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quality</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Signals</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-navy-500">
                    {profile.listings.map(listing => (
                      <tr key={listing.id} className="hover:bg-slate-50 dark:hover:bg-navy-700">
                        <td className="py-2.5 px-4 font-medium text-navy-500 dark:text-white max-w-[200px]">
                          <span className="truncate block">{listing.title}</span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">{listing.category || '—'}</td>
                        <td className="py-2.5 px-4 font-medium">${listing.priceUSD}</td>
                        <td className="py-2.5 px-4">
                          <Badge
                            variant={listing.status === 'live' ? 'success' : listing.status === 'paused' ? 'warning' : 'secondary'}
                            className="text-[10px] capitalize"
                          >
                            {listing.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4">
                          <QualityBadge score={listing.qualityScore ?? computeQualityScore(listing)} />
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex gap-1">
                            {listing.photosCount > 0 && (
                              <span title={`${listing.photosCount} photos`} className="text-brand-green">
                                <Camera className="h-3.5 w-3.5" />
                              </span>
                            )}
                            {listing.hasDescription && (
                              <span title="Has description" className="text-brand-green">
                                <FileText className="h-3.5 w-3.5" />
                              </span>
                            )}
                            {listing.hasPrice && (
                              <span title="Has price" className="text-brand-green">
                                <Tag className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-2">
                          <button
                            onClick={() => removeListing(listing.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Payouts Tab ─────────────────────────────────────── */}
        <TabsContent value="payouts" className="mt-4">
          <div className="bg-white dark:bg-navy-600 rounded-xl border border-slate-200 dark:border-navy-500">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-navy-500">
              <div>
                <h3 className="font-semibold text-navy-500 dark:text-white">Payout Records</h3>
                <p className="text-xs text-slate-500">
                  Total paid out: <span className="font-semibold text-brand-green">${totalPaidOut.toFixed(2)}</span>
                </p>
              </div>
              <Button onClick={() => setShowPayoutDialog(true)} className="bg-coral hover:bg-coral/90 text-white gap-2" size="sm">
                <Plus className="h-3.5 w-3.5" /> Record Payout
              </Button>
            </div>

            {profile.payouts.length === 0 ? (
              <div className="text-center py-10">
                <DollarSign className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No payouts recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-navy-500">
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Method</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reference</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-navy-500">
                    {[...profile.payouts].reverse().map(payout => (
                      <tr key={payout.id} className="hover:bg-slate-50 dark:hover:bg-navy-700">
                        <td className="py-2.5 px-4 text-slate-500">
                          {new Date(payout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-brand-green">${payout.amountUSD.toFixed(2)}</td>
                        <td className="py-2.5 px-4">
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {payout.method.replace('-', ' ')}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 font-mono text-xs">{payout.reference ?? '—'}</td>
                        <td className="py-2.5 px-4 text-slate-500 max-w-[200px]">
                          <span className="truncate block">{payout.notes ?? '—'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Performance Tab ─────────────────────────────────── */}
        <TabsContent value="performance" className="mt-4">
          <div className="bg-white dark:bg-navy-600 rounded-xl border border-slate-200 dark:border-navy-500 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-navy-500 dark:text-white">Performance Signals</h3>
              {!editingPerf ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const p = profile.performance
                    setPerfOrders(String(p.estimatedOrders))
                    setPerfResponse(String(p.responseRate))
                    setPerfReturn(String(p.returnRate))
                    setPerfRating(p.avgRating ? String(p.avgRating) : '')
                    setPerfReviews(String(p.reviewCount))
                    setEditingPerf(true)
                  }}
                >
                  Edit Signals
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditingPerf(false)}>Cancel</Button>
                  <Button size="sm" onClick={savePerformance} className="bg-coral hover:bg-coral/90 text-white">Save</Button>
                </div>
              )}
            </div>

            {editingPerf ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Estimated Orders</Label>
                  <Input type="number" value={perfOrders} onChange={e => setPerfOrders(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Response Rate (%)</Label>
                  <Input type="number" value={perfResponse} onChange={e => setPerfResponse(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Return Rate (%)</Label>
                  <Input type="number" value={perfReturn} onChange={e => setPerfReturn(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Avg Rating (1-5)</Label>
                  <Input type="number" min="1" max="5" step="0.1" value={perfRating} onChange={e => setPerfRating(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Review Count</Label>
                  <Input type="number" value={perfReviews} onChange={e => setPerfReviews(e.target.value)} className="h-8 text-sm" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { icon: BarChart2, label: 'Est. Orders', value: String(profile.performance.estimatedOrders), color: 'text-brand-purple' },
                  { icon: Wifi, label: 'Response Rate', value: `${profile.performance.responseRate}%`, color: 'text-brand-green' },
                  { icon: TrendingUp, label: 'Return Rate', value: `${profile.performance.returnRate}%`, color: 'text-coral' },
                  { icon: Star, label: 'Avg Rating', value: profile.performance.avgRating ? `${profile.performance.avgRating}/5` : '—', color: 'text-amber-500' },
                  { icon: Star, label: 'Reviews', value: String(profile.performance.reviewCount), color: 'text-navy-500 dark:text-white' },
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-50 dark:bg-navy-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <stat.icon className={cn('h-4 w-4', stat.color)} />
                      <span className="text-xs text-slate-500">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-navy-500 dark:text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            )}

            {profile.performance.lastUpdated && (
              <p className="text-[10px] text-slate-400 mt-4">
                Last updated: {new Date(profile.performance.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Listing Dialog */}
      <Dialog open={showListingDialog} onOpenChange={setShowListingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Product Title</Label>
              <Input value={listingTitle} onChange={e => setListingTitle(e.target.value)} placeholder="e.g. Liberian Pepper Soup" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input value={listingCategory} onChange={e => setListingCategory(e.target.value)} placeholder="Food" />
              </div>
              <div className="space-y-1.5">
                <Label>Price (USD)</Label>
                <Input type="number" value={listingPrice} onChange={e => setListingPrice(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Photo Count</Label>
                <Input type="number" value={listingPhotos} onChange={e => setListingPhotos(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={listingStatus} onValueChange={v => setListingStatus(v as ProductListing['status'])}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="sold-out">Sold Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="has-description"
                checked={listingHasDesc}
                onChange={e => setListingHasDesc(e.target.checked)}
                className="rounded border-slate-300"
              />
              <Label htmlFor="has-description" className="cursor-pointer">Has product description</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowListingDialog(false)}>Cancel</Button>
            <Button onClick={addListing} disabled={!listingTitle.trim()} className="bg-coral hover:bg-coral/90 text-white">
              Add Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payout Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount (USD)</Label>
                <Input type="number" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={payoutDate} onChange={e => setPayoutDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={payoutMethod} onValueChange={v => setPayoutMethod(v as PayoutRecord['method'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile-money">Mobile Money</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="wave">Wave</SelectItem>
                  <SelectItem value="orange-money">Orange Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reference (optional)</Label>
              <Input value={payoutRef} onChange={e => setPayoutRef(e.target.value)} placeholder="Transaction ID" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea value={payoutNotes} onChange={e => setPayoutNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowPayoutDialog(false)}>Cancel</Button>
            <Button onClick={addPayout} disabled={!payoutAmount} className="bg-coral hover:bg-coral/90 text-white">
              Record Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
