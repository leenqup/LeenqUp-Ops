'use client'

import type {
  Post, Script, EmailSequence, Campaign, SOP, BrandResponse, Merchant, AppSettings, SOPCompletion,
  ProjectBoard, ProjectCard, Deal, CRMActivity, MerchantAccount, DiasporaLink,
  SellerProfile, PriceBenchmark, CategoryTrend, DiasporaDemandSignal,
  ExpenseEntry, RevenueEntry, CashPosition, InvestorKPIs,
} from '@/types'
import { kvSet, kvSetBatch, kvGetAll } from '@/lib/supabase'
import { posts as seedPosts } from '@/data/posts'
import { scripts as seedScripts } from '@/data/scripts'
import { sequences as seedSequences } from '@/data/sequences'
import { campaigns as seedCampaigns } from '@/data/campaigns'
import { sops as seedSOPs } from '@/data/sops'
import { brandResponses as seedBrandResponses } from '@/data/brand'
import { merchants as seedMerchants } from '@/data/merchants'
import { projectBoards as seedProjectBoards, starterCards as seedProjectCards } from '@/data/projects'

const KEYS = {
  posts: 'leenqup_posts',
  scripts: 'leenqup_scripts',
  sequences: 'leenqup_sequences',
  campaigns: 'leenqup_campaigns',
  sops: 'leenqup_sops',
  brand: 'leenqup_brand',
  merchants: 'leenqup_merchants',
  settings: 'leenqup_settings',
  seeded: 'leenqup_seeded',
  // Project Management
  projects: 'leenqup_projects',
  cards: 'leenqup_cards',
  // CRM
  deals: 'leenqup_deals',
  merchantAccounts: 'leenqup_merchant_accounts',
  crmActivities: 'leenqup_crm_activities',
  diasporaLinks: 'leenqup_diaspora_links',
  // Seller
  sellerProfiles: 'leenqup_seller_profiles',
  // Market Intelligence
  priceBenchmarks: 'leenqup_price_benchmarks',
  categoryTrends: 'leenqup_category_trends',
  demandSignals: 'leenqup_demand_signals',
  // Finance
  expenses: 'leenqup_expenses',
  revenues: 'leenqup_revenues',
  cashPositions: 'leenqup_cash_positions',
  investorKpis: 'leenqup_investor_kpis',
}

function getItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

// Keys that should NOT be synced to Supabase (device-local only).
// Settings contains API keys, service account credentials, and tokens —
// all of which are personal/sensitive and must never leave the local device.
const LOCAL_ONLY_KEYS = new Set([KEYS.settings, KEYS.seeded])

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
  // Dual-write to Supabase for all shared keys (fire-and-forget)
  if (!LOCAL_ONLY_KEYS.has(key as typeof KEYS[keyof typeof KEYS])) {
    kvSet(key, value).catch(() => {
      // Supabase write failure is non-fatal — localStorage is the source of truth locally
    })
  }
}

// Schema version — bump this whenever new localStorage keys are added.
// On load, migrate() backfills any missing keys so existing users aren't left blank.
const SCHEMA_VERSION = '4'
const SCHEMA_VERSION_KEY = 'leenqup_schema_version'

const NEW_KEYS_V2 = [
  KEYS.projects,
  KEYS.cards,
  KEYS.deals,
  KEYS.merchantAccounts,
  KEYS.crmActivities,
  KEYS.diasporaLinks,
  KEYS.sellerProfiles,
  KEYS.priceBenchmarks,
  KEYS.categoryTrends,
  KEYS.demandSignals,
]

function migrate(): void {
  const version = localStorage.getItem(SCHEMA_VERSION_KEY)
  if (version === SCHEMA_VERSION) return

  // Backfill any v2 keys that don't exist yet (covers users seeded before v2)
  if (!localStorage.getItem(KEYS.projects)) setItem(KEYS.projects, seedProjectBoards)
  if (!localStorage.getItem(KEYS.cards))    setItem(KEYS.cards, seedProjectCards)
  if (!localStorage.getItem(KEYS.deals))            setItem(KEYS.deals, [])
  if (!localStorage.getItem(KEYS.merchantAccounts)) setItem(KEYS.merchantAccounts, [])
  if (!localStorage.getItem(KEYS.crmActivities))    setItem(KEYS.crmActivities, [])
  if (!localStorage.getItem(KEYS.diasporaLinks))    setItem(KEYS.diasporaLinks, [])
  if (!localStorage.getItem(KEYS.sellerProfiles))   setItem(KEYS.sellerProfiles, [])
  if (!localStorage.getItem(KEYS.priceBenchmarks))  setItem(KEYS.priceBenchmarks, [])
  if (!localStorage.getItem(KEYS.categoryTrends))   setItem(KEYS.categoryTrends, [])
  if (!localStorage.getItem(KEYS.demandSignals))    setItem(KEYS.demandSignals, [])

  // v3: Merge TrueLiberia merchants (merchantsC) into existing data without overwriting user edits.
  // Only adds merchants whose IDs don't already exist in localStorage.
  const existingMerchants = getItem<Merchant[]>(KEYS.merchants) ?? []
  const existingMerchantIds = new Set(existingMerchants.map((m: Merchant) => m.id))
  const merchantsToAdd = seedMerchants.filter((m: Merchant) => !existingMerchantIds.has(m.id))
  if (merchantsToAdd.length > 0) {
    setItem(KEYS.merchants, [...existingMerchants, ...merchantsToAdd])
  }

  // v4: Merge new seed posts (post_031–post_050) into existing data without overwriting edits.
  // Only adds posts whose IDs don't already exist in localStorage.
  const existingPosts = getItem<Post[]>(KEYS.posts) ?? []
  const existingPostIds = new Set(existingPosts.map((p: Post) => p.id))
  const postsToAdd = seedPosts.filter((p: Post) => !existingPostIds.has(p.id))
  if (postsToAdd.length > 0) {
    setItem(KEYS.posts, [...existingPosts, ...postsToAdd])
  }

  localStorage.setItem(SCHEMA_VERSION_KEY, SCHEMA_VERSION)
}

export function initializeStorage(): void {
  if (typeof window === 'undefined') return

  // Always run migrations first (backfills new keys for existing users)
  migrate()

  const seeded = localStorage.getItem(KEYS.seeded)
  if (seeded) return

  // First-time seed
  setItem(KEYS.posts, seedPosts)
  setItem(KEYS.scripts, seedScripts)
  setItem(KEYS.sequences, seedSequences)
  setItem(KEYS.campaigns, seedCampaigns)
  setItem(KEYS.sops, seedSOPs)
  setItem(KEYS.brand, seedBrandResponses)
  setItem(KEYS.merchants, seedMerchants)
  setItem(KEYS.projects, seedProjectBoards)
  setItem(KEYS.cards, seedProjectCards)
  setItem(KEYS.deals, [])
  setItem(KEYS.merchantAccounts, [])
  setItem(KEYS.crmActivities, [])
  setItem(KEYS.diasporaLinks, [])
  setItem(KEYS.sellerProfiles, [])
  setItem(KEYS.priceBenchmarks, [])
  setItem(KEYS.categoryTrends, [])
  setItem(KEYS.demandSignals, [])
  localStorage.setItem(KEYS.seeded, 'true')
  localStorage.setItem(SCHEMA_VERSION_KEY, SCHEMA_VERSION)
}

export function resetSection(section: keyof typeof KEYS): void {
  const seedMap: Record<string, unknown> = {
    posts: seedPosts,
    scripts: seedScripts,
    sequences: seedSequences,
    campaigns: seedCampaigns,
    sops: seedSOPs,
    brand: seedBrandResponses,
    merchants: seedMerchants,
    projects: seedProjectBoards,
    cards: seedProjectCards,
    deals: [],
    merchantAccounts: [],
    crmActivities: [],
    diasporaLinks: [],
    sellerProfiles: [],
    priceBenchmarks: [],
    categoryTrends: [],
    demandSignals: [],
  }
  if (seedMap[section] !== undefined) {
    setItem(KEYS[section as keyof typeof KEYS], seedMap[section])
  }
}

// Posts
export function getPosts(): Post[] { return getItem<Post[]>(KEYS.posts) ?? [] }
export function savePosts(posts: Post[]): void { setItem(KEYS.posts, posts) }
export function upsertPost(post: Post): void {
  const all = getPosts()
  const idx = all.findIndex(p => p.id === post.id)
  if (idx >= 0) all[idx] = post
  else all.unshift(post)
  savePosts(all)
}
export function deletePost(id: string): void { savePosts(getPosts().filter(p => p.id !== id)) }

// Scripts
export function getScripts(): Script[] { return getItem<Script[]>(KEYS.scripts) ?? [] }
export function saveScripts(s: Script[]): void { setItem(KEYS.scripts, s) }
export function upsertScript(script: Script): void {
  const all = getScripts()
  const idx = all.findIndex(s => s.id === script.id)
  if (idx >= 0) all[idx] = script
  else all.unshift(script)
  saveScripts(all)
}

// Sequences
export function getSequences(): EmailSequence[] { return getItem<EmailSequence[]>(KEYS.sequences) ?? [] }
export function saveSequences(s: EmailSequence[]): void { setItem(KEYS.sequences, s) }
export function upsertSequence(seq: EmailSequence): void {
  const all = getSequences()
  const idx = all.findIndex(s => s.id === seq.id)
  if (idx >= 0) all[idx] = seq
  else all.unshift(seq)
  saveSequences(all)
}

// Campaigns
export function getCampaigns(): Campaign[] { return getItem<Campaign[]>(KEYS.campaigns) ?? [] }
export function saveCampaigns(c: Campaign[]): void { setItem(KEYS.campaigns, c) }
export function upsertCampaign(campaign: Campaign): void {
  const all = getCampaigns()
  const idx = all.findIndex(c => c.id === campaign.id)
  if (idx >= 0) all[idx] = campaign
  else all.unshift(campaign)
  saveCampaigns(all)
}

// SOPs
export function getSOPs(): SOP[] { return getItem<SOP[]>(KEYS.sops) ?? [] }
export function saveSOPs(s: SOP[]): void { setItem(KEYS.sops, s) }

// Brand
export function getBrandResponses(): BrandResponse[] { return getItem<BrandResponse[]>(KEYS.brand) ?? [] }
export function saveBrandResponses(b: BrandResponse[]): void { setItem(KEYS.brand, b) }
export function upsertBrandResponse(br: BrandResponse): void {
  const all = getBrandResponses()
  const idx = all.findIndex(b => b.id === br.id)
  if (idx >= 0) all[idx] = br
  else all.unshift(br)
  saveBrandResponses(all)
}
export function deleteBrandResponse(id: string): void { saveBrandResponses(getBrandResponses().filter(b => b.id !== id)) }

// Merchants
export function getMerchants(): Merchant[] { return getItem<Merchant[]>(KEYS.merchants) ?? [] }
export function saveMerchants(m: Merchant[]): void { setItem(KEYS.merchants, m) }
export function upsertMerchant(merchant: Merchant): void {
  const all = getMerchants()
  const idx = all.findIndex(m => m.id === merchant.id)
  if (idx >= 0) all[idx] = merchant
  else all.unshift(merchant)
  saveMerchants(all)
}
export function deleteMerchant(id: string): void { saveMerchants(getMerchants().filter(m => m.id !== id)) }

// Settings
export function getSettings(): AppSettings { return getItem<AppSettings>(KEYS.settings) ?? {} }
export function saveSettings(s: AppSettings): void { setItem(KEYS.settings, s) }

// ── Project Boards ────────────────────────────────────────────
export function getProjectBoards(): ProjectBoard[] { return getItem<ProjectBoard[]>(KEYS.projects) ?? [] }
export function saveProjectBoards(boards: ProjectBoard[]): void { setItem(KEYS.projects, boards) }
export function upsertProjectBoard(board: ProjectBoard): void {
  const all = getProjectBoards()
  const idx = all.findIndex(b => b.id === board.id)
  if (idx >= 0) all[idx] = board
  else all.unshift(board)
  saveProjectBoards(all)
}
export function deleteProjectBoard(id: string): void {
  saveProjectBoards(getProjectBoards().filter(b => b.id !== id))
  // Also remove all cards for this board
  saveProjectCards(getProjectCards().filter(c => c.boardId !== id))
}

// ── Project Cards ─────────────────────────────────────────────
export function getProjectCards(): ProjectCard[] { return getItem<ProjectCard[]>(KEYS.cards) ?? [] }
export function saveProjectCards(cards: ProjectCard[]): void { setItem(KEYS.cards, cards) }
export function getCardsForBoard(boardId: string): ProjectCard[] {
  return getProjectCards().filter(c => c.boardId === boardId)
}
export function upsertProjectCard(card: ProjectCard): void {
  const all = getProjectCards()
  const idx = all.findIndex(c => c.id === card.id)
  if (idx >= 0) all[idx] = card
  else all.push(card)
  saveProjectCards(all)
}
export function deleteProjectCard(id: string): void {
  saveProjectCards(getProjectCards().filter(c => c.id !== id))
}

// ── Deals ─────────────────────────────────────────────────────
export function getDeals(): Deal[] { return getItem<Deal[]>(KEYS.deals) ?? [] }
export function saveDeals(deals: Deal[]): void { setItem(KEYS.deals, deals) }
export function upsertDeal(deal: Deal): void {
  const all = getDeals()
  const idx = all.findIndex(d => d.id === deal.id)
  if (idx >= 0) all[idx] = deal
  else all.unshift(deal)
  saveDeals(all)
}
export function deleteDeal(id: string): void { saveDeals(getDeals().filter(d => d.id !== id)) }

// ── CRM Activities ────────────────────────────────────────────
export function getCRMActivities(): CRMActivity[] { return getItem<CRMActivity[]>(KEYS.crmActivities) ?? [] }
export function saveCRMActivities(activities: CRMActivity[]): void { setItem(KEYS.crmActivities, activities) }
export function logCRMActivity(activity: Omit<CRMActivity, 'id' | 'createdAt'>): void {
  const all = getCRMActivities()
  all.unshift({
    ...activity,
    id: `crm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  })
  saveCRMActivities(all)
}

// ── Merchant Accounts ─────────────────────────────────────────
export function getMerchantAccounts(): MerchantAccount[] { return getItem<MerchantAccount[]>(KEYS.merchantAccounts) ?? [] }
export function saveMerchantAccounts(accounts: MerchantAccount[]): void { setItem(KEYS.merchantAccounts, accounts) }
export function upsertMerchantAccount(account: MerchantAccount): void {
  const all = getMerchantAccounts()
  const idx = all.findIndex(a => a.id === account.id)
  if (idx >= 0) all[idx] = account
  else all.unshift(account)
  saveMerchantAccounts(all)
}
export function deleteMerchantAccount(id: string): void {
  saveMerchantAccounts(getMerchantAccounts().filter(a => a.id !== id))
}

// ── Diaspora Links ────────────────────────────────────────────
export function getDiasporaLinks(): DiasporaLink[] { return getItem<DiasporaLink[]>(KEYS.diasporaLinks) ?? [] }
export function saveDiasporaLinks(links: DiasporaLink[]): void { setItem(KEYS.diasporaLinks, links) }
export function upsertDiasporaLink(link: DiasporaLink): void {
  const all = getDiasporaLinks()
  const idx = all.findIndex(l => l.id === link.id)
  if (idx >= 0) all[idx] = link
  else all.unshift(link)
  saveDiasporaLinks(all)
}

// ── Seller Profiles ───────────────────────────────────────────
export function getSellerProfiles(): SellerProfile[] { return getItem<SellerProfile[]>(KEYS.sellerProfiles) ?? [] }
export function saveSellerProfiles(profiles: SellerProfile[]): void { setItem(KEYS.sellerProfiles, profiles) }
export function getSellerProfile(merchantId: string): SellerProfile | null {
  return getSellerProfiles().find(p => p.merchantId === merchantId) ?? null
}
export function upsertSellerProfile(profile: SellerProfile): void {
  const all = getSellerProfiles()
  const idx = all.findIndex(p => p.id === profile.id)
  if (idx >= 0) all[idx] = profile
  else all.unshift(profile)
  saveSellerProfiles(all)
}

// ── Price Benchmarks ──────────────────────────────────────────
export function getPriceBenchmarks(): PriceBenchmark[] { return getItem<PriceBenchmark[]>(KEYS.priceBenchmarks) ?? [] }
export function savePriceBenchmarks(b: PriceBenchmark[]): void { setItem(KEYS.priceBenchmarks, b) }
export function upsertPriceBenchmark(benchmark: PriceBenchmark): void {
  const all = getPriceBenchmarks()
  const idx = all.findIndex(b => b.id === benchmark.id)
  if (idx >= 0) all[idx] = benchmark
  else all.unshift(benchmark)
  savePriceBenchmarks(all)
}
export function deletePriceBenchmark(id: string): void {
  savePriceBenchmarks(getPriceBenchmarks().filter(b => b.id !== id))
}

// ── Category Trends ───────────────────────────────────────────
export function getCategoryTrends(): CategoryTrend[] { return getItem<CategoryTrend[]>(KEYS.categoryTrends) ?? [] }
export function saveCategoryTrends(t: CategoryTrend[]): void { setItem(KEYS.categoryTrends, t) }
export function upsertCategoryTrend(trend: CategoryTrend): void {
  const all = getCategoryTrends()
  const idx = all.findIndex(t => t.id === trend.id)
  if (idx >= 0) all[idx] = trend
  else all.unshift(trend)
  saveCategoryTrends(all)
}
export function deleteCategoryTrend(id: string): void {
  saveCategoryTrends(getCategoryTrends().filter(t => t.id !== id))
}

// ── Demand Signals ────────────────────────────────────────────
export function getDemandSignals(): DiasporaDemandSignal[] { return getItem<DiasporaDemandSignal[]>(KEYS.demandSignals) ?? [] }
export function saveDemandSignals(s: DiasporaDemandSignal[]): void { setItem(KEYS.demandSignals, s) }
export function upsertDemandSignal(signal: DiasporaDemandSignal): void {
  const all = getDemandSignals()
  const idx = all.findIndex(s => s.id === signal.id)
  if (idx >= 0) all[idx] = signal
  else all.unshift(signal)
  saveDemandSignals(all)
}
export function deleteDemandSignal(id: string): void {
  saveDemandSignals(getDemandSignals().filter(s => s.id !== id))
}

// SOP Completions
const SOP_COMPLETIONS_KEY = 'leenqup_sop_completions'

export function getSOPCompletions(): SOPCompletion[] {
  return getItem<SOPCompletion[]>(SOP_COMPLETIONS_KEY) ?? []
}

export function logSOPCompletion(sopId: string, completedBy: string = 'team'): void {
  const today = new Date().toISOString().split('T')[0]
  const completions = getSOPCompletions()
  completions.unshift({
    sopId,
    date: today,
    completedAt: new Date().toISOString(),
    completedBy,
  })
  setItem(SOP_COMPLETIONS_KEY, completions)
}

export function getSOPCompletionsForDate(date: string): SOPCompletion[] {
  return getSOPCompletions().filter(c => c.date === date)
}

export function isSOPCompletedToday(sopId: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return getSOPCompletions().some(c => c.sopId === sopId && c.date === today)
}

export function isSOPCompletedThisWeek(sopId: string): boolean {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  return getSOPCompletions().some(c => {
    const d = new Date(c.completedAt)
    return c.sopId === sopId && d >= weekStart
  })
}

// ──────────────────────────────────────────────────────────────
// Finance
// ──────────────────────────────────────────────────────────────

// ── Expenses ──────────────────────────────────────────────────
export function getExpenses(): ExpenseEntry[] { return getItem<ExpenseEntry[]>(KEYS.expenses) ?? [] }
export function saveExpenses(e: ExpenseEntry[]): void { setItem(KEYS.expenses, e) }
export function upsertExpense(entry: ExpenseEntry): void {
  const all = getExpenses()
  const idx = all.findIndex(e => e.id === entry.id)
  if (idx >= 0) all[idx] = entry
  else all.unshift(entry)
  saveExpenses(all)
}
export function deleteExpense(id: string): void {
  saveExpenses(getExpenses().filter(e => e.id !== id))
}

// ── Revenue ───────────────────────────────────────────────────
export function getRevenues(): RevenueEntry[] { return getItem<RevenueEntry[]>(KEYS.revenues) ?? [] }
export function saveRevenues(r: RevenueEntry[]): void { setItem(KEYS.revenues, r) }
export function upsertRevenue(entry: RevenueEntry): void {
  const all = getRevenues()
  const idx = all.findIndex(r => r.id === entry.id)
  if (idx >= 0) all[idx] = entry
  else all.unshift(entry)
  saveRevenues(all)
}
export function deleteRevenue(id: string): void {
  saveRevenues(getRevenues().filter(r => r.id !== id))
}

// ── Cash Positions ────────────────────────────────────────────
export function getCashPositions(): CashPosition[] { return getItem<CashPosition[]>(KEYS.cashPositions) ?? [] }
export function saveCashPositions(c: CashPosition[]): void { setItem(KEYS.cashPositions, c) }
export function upsertCashPosition(entry: CashPosition): void {
  const all = getCashPositions()
  const idx = all.findIndex(c => c.id === entry.id)
  if (idx >= 0) all[idx] = entry
  else all.unshift(entry)
  saveCashPositions(all)
}
export function deleteCashPosition(id: string): void {
  saveCashPositions(getCashPositions().filter(c => c.id !== id))
}

// ── Investor KPIs ─────────────────────────────────────────────
export function getInvestorKpis(): InvestorKPIs[] { return getItem<InvestorKPIs[]>(KEYS.investorKpis) ?? [] }
export function saveInvestorKpis(k: InvestorKPIs[]): void { setItem(KEYS.investorKpis, k) }
export function upsertInvestorKpi(entry: InvestorKPIs): void {
  const all = getInvestorKpis()
  const idx = all.findIndex(k => k.month === entry.month)
  if (idx >= 0) all[idx] = entry
  else all.unshift(entry)
  saveInvestorKpis(all)
}

// ──────────────────────────────────────────────────────────────
// Full Backup / Restore
// ──────────────────────────────────────────────────────────────

const BACKUP_KEYS = [
  KEYS.posts, KEYS.scripts, KEYS.sequences, KEYS.campaigns, KEYS.sops,
  KEYS.brand, KEYS.merchants, KEYS.settings,
  KEYS.projects, KEYS.cards,
  KEYS.deals, KEYS.merchantAccounts, KEYS.crmActivities, KEYS.diasporaLinks,
  KEYS.sellerProfiles,
  KEYS.priceBenchmarks, KEYS.categoryTrends, KEYS.demandSignals,
  KEYS.expenses, KEYS.revenues, KEYS.cashPositions, KEYS.investorKpis,
  SCHEMA_VERSION_KEY,
] as const

export function exportAllData(): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {
    _exportedAt: new Date().toISOString(),
    _version: SCHEMA_VERSION,
  }
  BACKUP_KEYS.forEach(key => {
    const raw = localStorage.getItem(key)
    if (raw !== null) {
      try { snapshot[key] = JSON.parse(raw) }
      catch { snapshot[key] = raw }
    }
  })
  return snapshot
}

export function importAllData(snapshot: Record<string, unknown>): { restored: number; errors: string[] } {
  const errors: string[] = []
  let restored = 0
  BACKUP_KEYS.forEach(key => {
    if (key in snapshot) {
      try {
        localStorage.setItem(key, JSON.stringify(snapshot[key]))
        restored++
      } catch (e) {
        errors.push(key)
      }
    }
  })
  // Mark as seeded so it doesn't re-seed on next load
  localStorage.setItem(KEYS.seeded, 'true')
  return { restored, errors }
}

// ──────────────────────────────────────────────────────────────
// Supabase Sync
// ──────────────────────────────────────────────────────────────

/**
 * hydrateFromSupabase — called once on app load.
 * Pulls all shared keys from Supabase into localStorage so this browser
 * is up to date with the rest of the team's work.
 * Settings (API keys) and seeded flag are intentionally excluded.
 */
export async function hydrateFromSupabase(): Promise<{ hydrated: number }> {
  if (typeof window === 'undefined') return { hydrated: 0 }
  try {
    const remote = await kvGetAll()
    let count = 0
    for (const [key, value] of Object.entries(remote)) {
      // Never overwrite local-only keys from remote
      if (LOCAL_ONLY_KEYS.has(key as typeof KEYS[keyof typeof KEYS])) continue
      if (value !== null && value !== undefined) {
        localStorage.setItem(key, JSON.stringify(value))
        count++
      }
    }
    // Ensure seeded flag is set so initializeStorage() won't re-seed over remote data
    if (count > 0) localStorage.setItem(KEYS.seeded, 'true')
    return { hydrated: count }
  } catch {
    // Network failure — fall back to local data silently
    return { hydrated: 0 }
  }
}

/**
 * pushLocalToSupabase — pushes ALL local data up to Supabase in one batch.
 * Use this from Settings to force-sync (e.g., first team member to set up).
 * Excludes local-only keys (settings, seeded flag).
 */
export async function pushLocalToSupabase(): Promise<{ pushed: number; failed: string[] }> {
  if (typeof window === 'undefined') return { pushed: 0, failed: [] }
  const batch: Record<string, unknown> = {}
  BACKUP_KEYS.forEach(key => {
    if (LOCAL_ONLY_KEYS.has(key as typeof KEYS[keyof typeof KEYS])) return
    const raw = localStorage.getItem(key)
    if (raw !== null) {
      try { batch[key] = JSON.parse(raw) } catch { /* skip malformed */ }
    }
  })
  const { succeeded, failed } = await kvSetBatch(batch)
  return { pushed: succeeded, failed }
}
