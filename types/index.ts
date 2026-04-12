// ============================================================
// LeenqUp Ops — Central Type Definitions
// ============================================================

export type Platform = 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'whatsapp'
export type Audience = 'buyer' | 'seller' | 'diaspora' | 'community' | 'general'
export type Pillar = 'trust' | 'discovery' | 'education' | 'proof' | 'community' | 'launch' | 'feature' | 'announcement'
export type Phase = 'pre-launch' | 'launch' | 'post-launch' | 'evergreen'
export type PostStatus = 'ready' | 'needs-review' | 'scheduled' | 'published'

export interface Post {
  id: string
  title: string
  body: string
  platform: Platform
  audience: Audience
  pillar: Pillar
  phase: Phase
  tags: string[]
  characterCount: number
  status: PostStatus
  scheduledFor?: string
  bufferPostId?: string
  notes?: string
  createdAt: string
  updatedAt: string
  publishedUrl?: string
  impressions?: number
  engagements?: number
}

export type ScriptChannel = 'whatsapp' | 'instagram-dm' | 'facebook-messenger' | 'email' | 'sms'
export type ScriptType = 'cold-outreach' | 'warm-intro' | 'follow-up' | 'objection-handling' | 'close'
export type ScriptPersona = 'fashion-seller' | 'food-vendor' | 'beauty-business' | 'service-provider' | 'event-organizer' | 'hospitality' | 'general-merchant' | 'diaspora-buyer' | 'local-buyer'
export type ScriptStage = 'first-contact' | 'second-touch' | 'third-touch' | 'objection' | 'close'

export interface Script {
  id: string
  title: string
  body: string
  channel: ScriptChannel
  type: ScriptType
  persona: ScriptPersona
  stage: ScriptStage
  tags: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export type SequenceAudience = 'buyer' | 'seller' | 'dormant' | 're-engagement'
export type SequenceStatus = 'draft' | 'ready' | 'active' | 'paused'

export interface Email {
  position: number
  subject: string
  body: string
  delayDays: number
  tags: string[]
}

export interface EmailSequence {
  id: string
  name: string
  audience: SequenceAudience
  triggerEvent: string
  emails: Email[]
  status: SequenceStatus
  brevoListId?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type CampaignPhase = 'pre-launch' | 'launch-day' | 'post-launch-30'
export type CampaignStatus = 'draft' | 'ready' | 'active' | 'complete'

export interface CampaignAssets {
  posts: string[]
  emails: string[]
  whatsappBroadcast?: string
}

export interface Campaign {
  id: string
  name: string
  phase: CampaignPhase
  description: string
  assets: CampaignAssets
  whatsappBroadcast?: string
  deploymentSchedule: string
  status: CampaignStatus
  createdAt: string
  updatedAt: string
  executedPosts?: Array<{ postId: string; platform: string; postedAt: string; url?: string }>
}

export type SOPFrequency = 'daily' | 'weekly' | 'monthly' | 'as-needed'

export interface SOPStep {
  stepNumber: number
  action: string
  detail: string
  toolUsed?: string
  notes?: string
}

export interface SOP {
  id: string
  title: string
  frequency: SOPFrequency
  owner: string
  estimatedMinutes: number
  steps: SOPStep[]
  createdAt: string
  updatedAt: string
  lastCompletedAt?: string
  completionLog?: Array<{ date: string; completedBy: string }>
}

export type ResponseAudience = 'buyer' | 'seller' | 'general' | 'skeptic'
export type ResponseChannel = 'social-comment' | 'dm' | 'email' | 'in-app' | 'any'

export interface BrandResponse {
  id: string
  trigger: string
  response: string
  audience: ResponseAudience
  channel: ResponseChannel
  tags: string[]
  notes?: string
  createdAt: string
  updatedAt: string
  triggerKeywords?: string[]
}

export type MerchantSegment =
  | 'liberia'
  | 'us-diaspora'
  | 'us-diaspora-philadelphia'
  | 'us-diaspora-minneapolis'
  | 'us-diaspora-atlanta'
  | 'us-diaspora-nyc'
  | 'us-diaspora-dc'
  | 'us-diaspora-providence'
  | 'us-diaspora-boston'
  | 'us-diaspora-charlotte'
  | 'us-diaspora-houston'
  | 'us-diaspora-columbus'
  | 'us-diaspora-newark'
export type MaturityLevel = 'new-emerging' | 'established' | 'well-known'
export type MerchantTier = 1 | 2 | 3
export type OperatingStatus = 'active' | 'appears-active' | 'unclear'
export type DigitalPresence = 'yes' | 'partial' | 'none'
export type OutreachStatus = 'not-contacted' | 'contacted' | 'responded' | 'interested' | 'signed-up' | 'declined' | 'not-a-fit'
export type Priority = 'high' | 'medium' | 'low'

export interface OutreachLog {
  date: string
  channel: string
  note: string
  by?: string
}

export interface Merchant {
  id: string
  name: string
  segment: MerchantSegment
  category: string
  subcategory?: string
  city: string
  country: string
  operatingStatus: OperatingStatus
  digitalPresence: DigitalPresence
  instagram?: string
  facebook?: string
  whatsapp?: string
  website?: string
  phone?: string
  email?: string
  linkedinUrl?: string
  googleMapsUrl?: string
  recentNews?: string
  notes?: string
  outreachStatus: OutreachStatus
  lastContactDate?: string
  contactChannel?: string
  assignedScript?: string
  outreachLog?: OutreachLog[]
  tags: string[]
  priority: Priority
  createdAt: string
  onboardingStatus?: 'pending' | 'profile-sent' | 'listing-live' | 'first-sale'
  profileCompleteness?: number
  // Intelligence fields from pre-launch research
  intelligenceId?: string           // Reference ID from research (e.g. "A-F01", "B-MN01")
  maturityLevel?: MaturityLevel     // Business maturity from research
  tripAdvisorRating?: number        // TripAdvisor rating (0-5)
  tripAdvisorReviews?: number       // Number of TripAdvisor reviews
  isLibdeliveryPartner?: boolean    // Whether on LIBdelivery platform
  shipsToLiberia?: boolean          // US diaspora: whether ships goods to Liberia
  yelpUrl?: string                  // Yelp business URL
  currentMarketplacePlatform?: string // e.g. "Ezee Market", "LIBdelivery", "Grubhub"
  ownershipSignal?: string          // How we know it's Liberian-owned (diaspora segment)
  tier?: MerchantTier               // Priority tier: 1=highest, 2=medium, 3=low
  // TrueLiberia import fields
  county?: string                   // Liberia county (Montserrado, Nimba, Margibi, etc.)
  address?: string                  // Physical street address
  trueliberiaUrl?: string           // Source URL on trueliberia.com
  // Integration fields
  notionPageId?: string             // Notion page ID stored after first sync (idempotent updates)
}

export interface AppSettings {
  bufferAccessToken?: string
  brevoApiKey?: string
  brevoSenderEmail?: string
  notionToken?: string
  notionDatabaseId?: string
  slackWebhookUrl?: string
  makeWebhookUrl?: string
  // Google Sheets
  googleSheetsCredentials?: string  // Service account credentials JSON (never synced to Supabase)
  googleSheetsId?: string           // Spreadsheet ID from the Sheets URL
  // Make.com inbound
  makeInboundSecret?: string        // Shared secret for X-LeenqUp-Secret header validation
}

export interface ConnectionStatus {
  buffer: boolean
  brevo: boolean
  notion: boolean
}

export interface SOPCompletion {
  sopId: string
  date: string        // ISO date string (date only: "2026-04-10")
  completedAt: string // ISO datetime
  completedBy: string
}

// ============================================================
// Project Management (Trello-style Kanban)
// ============================================================

export type CardPriority = 'urgent' | 'high' | 'medium' | 'low'
export type CardStatus   = 'todo' | 'in-progress' | 'blocked' | 'done'
export type ProjectView  = 'kanban' | 'list' | 'calendar'

export interface CardChecklist {
  id: string
  text: string
  done: boolean
}

export interface CardComment {
  id: string
  text: string
  by: string
  createdAt: string
}

export interface CardLabel {
  id: string
  text: string
  color: string
}

export interface ProjectCard {
  id: string
  listId: string
  boardId: string
  title: string
  description?: string
  status: CardStatus
  priority: CardPriority
  dueDate?: string
  assignee?: string
  labels: CardLabel[]
  checklist: CardChecklist[]
  comments: CardComment[]
  attachments: Array<{ label: string; url: string }>
  linkedMerchantId?: string
  linkedCampaignId?: string
  linkedPostId?: string
  position: number
  createdAt: string
  updatedAt: string
}

export interface ProjectList {
  id: string
  boardId: string
  title: string
  position: number
  color?: string
}

export interface ProjectBoard {
  id: string
  title: string
  description?: string
  color: string
  icon?: string
  lists: ProjectList[]
  archivedAt?: string
  createdAt: string
  updatedAt: string
}

// ============================================================
// CRM Deal Pipeline
// ============================================================

export type DealStage =
  | 'prospecting'
  | 'qualified'
  | 'demo-sent'
  | 'negotiating'
  | 'verbal-yes'
  | 'contract-sent'
  | 'closed-won'
  | 'closed-lost'
  | 'on-hold'

export interface DealActivity {
  id: string
  type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'note' | 'stage-change'
  note: string
  by: string
  createdAt: string
  oldStage?: DealStage
  newStage?: DealStage
}

export interface Deal {
  id: string
  merchantId: string
  title: string
  stage: DealStage
  dealValueUSD: number
  probability: number       // 0-100
  weightedValue: number     // computed: dealValueUSD * (probability / 100)
  expectedCloseDate?: string
  assignedTo?: string
  activities: DealActivity[]
  tags: string[]
  notes?: string
  gmvActual?: number
  createdAt: string
  updatedAt: string
}

export interface MerchantAccount {
  id: string
  name: string
  merchantIds: string[]
  country: string
  website?: string
  notes?: string
  createdAt: string
}

export interface CRMActivity {
  id: string
  merchantId: string
  dealId?: string
  type: 'outreach' | 'follow-up' | 'stage-change' | 'note' | 'signed-up' | 'listing-live'
  description: string
  by: string
  createdAt: string
}

export interface DiasporaLink {
  id: string
  buyerName: string
  buyerCity: string
  buyerCountry: string
  linkedMerchantId: string
  strength: 'strong' | 'moderate' | 'weak'
  notes?: string
  createdAt: string
}

// ============================================================
// Seller Dashboard
// ============================================================

export type OnboardingStep =
  | 'profile-photo'
  | 'first-listing'
  | 'payment-method'
  | 'bank-details'
  | 'first-sale'
  | 'review-collected'

export interface OnboardingChecklistItem {
  step: OnboardingStep
  completed: boolean
  completedAt?: string
  notes?: string
}

export interface ProductListing {
  id: string
  merchantId: string
  title: string
  category: string
  priceUSD: number
  priceLRD?: number
  status: 'draft' | 'live' | 'paused' | 'sold-out'
  photosCount: number
  hasDescription: boolean
  hasPrice: boolean
  qualityScore?: number
  createdAt: string
  updatedAt: string
}

export interface PayoutRecord {
  id: string
  merchantId: string
  amountUSD: number
  method: 'mobile-money' | 'bank-transfer' | 'cash' | 'wave' | 'orange-money'
  date: string
  reference?: string
  notes?: string
  recordedBy: string
  createdAt: string
}

export interface SellerPerformance {
  merchantId: string
  estimatedOrders: number
  returnRate: number
  responseRate: number
  avgDeliveryDays?: number
  reviewCount: number
  avgRating?: number
  lastUpdated: string
}

export interface SellerProfile {
  id: string
  merchantId: string
  onboardingChecklist: OnboardingChecklistItem[]
  listings: ProductListing[]
  payouts: PayoutRecord[]
  performance: SellerPerformance
  createdAt: string
  updatedAt: string
}

// ============================================================
// Market Intelligence
// ============================================================

export interface PriceBenchmark {
  id: string
  category: string
  productName: string
  ourPrice?: number
  competitorName: string
  competitorPrice: number
  currency: 'USD' | 'LRD'
  notes?: string
  recordedAt: string
}

export type TrendDirection = 'rising' | 'stable' | 'declining'

export interface CategoryTrend {
  id: string
  category: string
  direction: TrendDirection
  signal: string
  diasporaCities: string[]
  confidenceLevel: 'high' | 'medium' | 'low'
  sourceNote?: string
  recordedAt: string
}

export interface DiasporaDemandSignal {
  id: string
  city: string
  category: string
  demandLevel: 'high' | 'medium' | 'low'
  signalSource: string
  notes?: string
  recordedAt: string
}

// ============================================================
// Finance Tracker
// ============================================================

export type ExpenseCategory =
  | 'salaries'
  | 'tools-software'
  | 'marketing'
  | 'hosting-infra'
  | 'office-ops'
  | 'legal-compliance'
  | 'travel'
  | 'other'

export interface ExpenseEntry {
  id: string
  category: ExpenseCategory
  description: string
  amountUSD: number
  month: string // 'YYYY-MM'
  recurring: boolean
  vendor?: string
  notes?: string
  createdAt: string
}

export type RevenueType = 'gmv-commission' | 'subscription' | 'listing-fee' | 'sponsorship' | 'grant' | 'investment' | 'other'

export interface RevenueEntry {
  id: string
  type: RevenueType
  description: string
  amountUSD: number
  month: string // 'YYYY-MM'
  notes?: string
  createdAt: string
}

export interface CashPosition {
  id: string
  amountUSD: number
  recordedAt: string // 'YYYY-MM-DD'
  notes?: string
}

// ─── Investor KPIs (manually entered) ────────────────────────────────────────
export interface InvestorKPIs {
  month: string // 'YYYY-MM'
  activeSellers?: number
  activeBuyers?: number
  gmvUSD?: number
  newListings?: number
  cacUSD?: number
  notes?: string
  updatedAt: string
}
