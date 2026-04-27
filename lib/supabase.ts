import { createBrowserClient } from '@supabase/ssr'
import type { Merchant } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton browser client — cookie-based session persistence for auth
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
})

// ─── KV Store helpers ─────────────────────────────────────────────────────────
// Each localStorage key maps to one row: { key, value (JSONB), updated_at }

export async function kvGet(key: string): Promise<unknown | null> {
  const { data, error } = await supabase
    .from('kv_store')
    .select('value')
    .eq('key', key)
    .single()
  if (error || !data) return null
  return data.value
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  const { error } = await supabase
    .from('kv_store')
    .upsert({ key, value }, { onConflict: 'key' })
  if (error) throw new Error(`kvSet(${key}): ${error.message}`)
}

export async function kvGetAll(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('kv_store')
    .select('key, value')
  if (error || !data) return {}
  return Object.fromEntries(data.map(row => [row.key, row.value]))
}

export async function kvSetBatch(
  entries: Record<string, unknown>
): Promise<{ succeeded: number; failed: string[] }> {
  const failed: string[] = []
  let succeeded = 0
  for (const [key, value] of Object.entries(entries)) {
    try {
      await kvSet(key, value)
      succeeded++
    } catch {
      failed.push(key)
    }
  }
  return { succeeded, failed }
}

// ─── Merchants Table helpers ──────────────────────────────────────────────────
// Converts a snake_case Supabase row to the camelCase Merchant interface

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMerchantRow(row: Record<string, any>): Merchant {
  return {
    id: row.id,
    name: row.name,
    segment: row.segment,
    category: row.category ?? '',
    subcategory: row.subcategory ?? undefined,
    city: row.city ?? '',
    country: row.country ?? 'Liberia',
    operatingStatus: row.operating_status ?? 'active',
    digitalPresence: row.digital_presence ?? 'none',
    instagram: row.instagram ?? undefined,
    facebook: row.facebook ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    website: row.website ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    linkedinUrl: row.linkedin_url ?? undefined,
    googleMapsUrl: row.google_maps_url ?? undefined,
    recentNews: row.recent_news ?? undefined,
    notes: row.notes ?? undefined,
    outreachStatus: row.outreach_status ?? 'not-contacted',
    lastContactDate: row.last_contact_date ?? undefined,
    contactChannel: row.contact_channel ?? undefined,
    assignedScript: row.assigned_script ?? undefined,
    outreachLog: row.outreach_log ?? [],
    tags: row.tags ?? [],
    priority: row.priority ?? 'medium',
    createdAt: row.created_at ?? new Date().toISOString(),
    onboardingStatus: row.onboarding_status ?? undefined,
    profileCompleteness: row.profile_completeness ?? undefined,
    intelligenceId: row.intelligence_id ?? undefined,
    maturityLevel: row.maturity_level ?? undefined,
    tripAdvisorRating: row.trip_advisor_rating ?? undefined,
    tripAdvisorReviews: row.trip_advisor_reviews ?? undefined,
    isLibdeliveryPartner: row.is_libdelivery_partner ?? false,
    shipsToLiberia: row.ships_to_liberia ?? false,
    yelpUrl: row.yelp_url ?? undefined,
    currentMarketplacePlatform: row.current_marketplace_platform ?? undefined,
    ownershipSignal: row.ownership_signal ?? undefined,
    tier: row.tier ?? undefined,
    county: row.county ?? undefined,
    address: row.address ?? undefined,
    trueliberiaUrl: row.trueliberia_url ?? undefined,
    notionPageId: row.notion_page_id ?? undefined,
  }
}

// Converts a camelCase Merchant to a snake_case row for Supabase inserts/updates
export function merchantToRow(m: Merchant): Record<string, unknown> {
  return {
    id: m.id,
    name: m.name,
    segment: m.segment,
    category: m.category,
    subcategory: m.subcategory ?? null,
    city: m.city,
    country: m.country,
    operating_status: m.operatingStatus,
    digital_presence: m.digitalPresence,
    instagram: m.instagram ?? null,
    facebook: m.facebook ?? null,
    whatsapp: m.whatsapp ?? null,
    website: m.website ?? null,
    phone: m.phone ?? null,
    email: m.email ?? null,
    linkedin_url: m.linkedinUrl ?? null,
    google_maps_url: m.googleMapsUrl ?? null,
    recent_news: m.recentNews ?? null,
    notes: m.notes ?? null,
    outreach_status: m.outreachStatus,
    last_contact_date: m.lastContactDate ?? null,
    contact_channel: m.contactChannel ?? null,
    assigned_script: m.assignedScript ?? null,
    outreach_log: m.outreachLog ?? [],
    tags: m.tags ?? [],
    priority: m.priority,
    created_at: m.createdAt,
    onboarding_status: m.onboardingStatus ?? null,
    profile_completeness: m.profileCompleteness ?? null,
    intelligence_id: m.intelligenceId ?? null,
    maturity_level: m.maturityLevel ?? null,
    trip_advisor_rating: m.tripAdvisorRating ?? null,
    trip_advisor_reviews: m.tripAdvisorReviews ?? null,
    is_libdelivery_partner: m.isLibdeliveryPartner ?? false,
    ships_to_liberia: m.shipsToLiberia ?? false,
    yelp_url: m.yelpUrl ?? null,
    current_marketplace_platform: m.currentMarketplacePlatform ?? null,
    ownership_signal: m.ownershipSignal ?? null,
    tier: m.tier ?? null,
    county: m.county ?? null,
    address: m.address ?? null,
    trueliberia_url: m.trueliberiaUrl ?? null,
    notion_page_id: m.notionPageId ?? null,
  }
}

/** Write a single merchant to the Supabase merchants table (fire-and-forget safe) */
export async function upsertMerchantDB(m: Merchant): Promise<void> {
  const { error } = await supabase
    .from('merchants')
    .upsert(merchantToRow(m), { onConflict: 'id' })
  if (error) throw new Error(`upsertMerchantDB(${m.id}): ${error.message}`)
}

/** Delete a merchant from the Supabase merchants table */
export async function deleteMerchantDB(id: string): Promise<void> {
  const { error } = await supabase.from('merchants').delete().eq('id', id)
  if (error) throw new Error(`deleteMerchantDB(${id}): ${error.message}`)
}
