import { getMerchants, getScripts, getPosts, getGoals } from '@/lib/storage'
import { computeMerchantHealth } from '@/lib/merchant-health'
import type { Merchant } from '@/types'

export interface DigestReport {
  generatedAt: string
  period: { from: string; to: string }
  merchantsAdded: number
  merchantsContacted: number
  postsReady: number
  goalsOnTrack: number
  goalsAtRisk: number
  topOpportunities: Array<{ id: string; name: string; score: number }>
  flaggedMerchants: Array<{ id: string; name: string; score: number }>
  highlights: string[]
}

/** Returns the Monday 00:00 UTC of the ISO week containing `date`. */
function weekStart(date: Date): Date {
  const d = new Date(date)
  // getUTCDay() — 0=Sun, 1=Mon … 6=Sat
  const dayOfWeek = d.getUTCDay()
  const diff = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek)
  d.setUTCDate(d.getUTCDate() + diff)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export function generateDigest(weekOffset: number = 0): DigestReport {
  const now = new Date()

  // Compute Monday of the target week
  const monday = weekStart(now)
  monday.setUTCDate(monday.getUTCDate() + weekOffset * 7)

  // Sunday 23:59:59.999 UTC of that same week
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  sunday.setUTCHours(23, 59, 59, 999)

  const from = monday.toISOString()
  const to = sunday.toISOString()

  const fromTime = monday.getTime()
  const toTime = sunday.getTime()

  const inRange = (iso: string | undefined): boolean => {
    if (!iso) return false
    const t = new Date(iso).getTime()
    return t >= fromTime && t <= toTime
  }

  // ── Data ──────────────────────────────────────────────────────
  const merchants = getMerchants()
  const posts = getPosts()
  const goals = getGoals()

  const merchantsAdded = merchants.filter(m => inRange(m.createdAt)).length

  const merchantsContacted = merchants.filter(m =>
    inRange((m as Merchant & { lastContactDate?: string }).lastContactDate)
  ).length

  const postsReady = posts.filter(p => p.status === 'ready').length

  const goalsOnTrack = goals.filter(g => g.status === 'on-track').length
  const goalsAtRisk = goals.filter(g => g.status === 'at-risk' || g.status === 'behind').length

  // ── Health scores ─────────────────────────────────────────────
  const scored = merchants.map(m => {
    const { total } = computeMerchantHealth(m)
    return { id: m.id, name: m.name, score: total }
  })

  const topOpportunities = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const flaggedMerchants = scored.filter(s => s.score < 40)

  // ── Highlights ────────────────────────────────────────────────
  const highlights: string[] = [
    `${merchantsAdded} new merchant${merchantsAdded !== 1 ? 's' : ''} added this week`,
    `${merchantsContacted} merchant${merchantsContacted !== 1 ? 's' : ''} contacted or followed up`,
    `${postsReady} post${postsReady !== 1 ? 's' : ''} ready for publishing`,
    `${goalsOnTrack} goal${goalsOnTrack !== 1 ? 's' : ''} on track, ${goalsAtRisk} need${goalsAtRisk === 1 ? 's' : ''} attention`,
  ]

  if (topOpportunities.length > 0) {
    highlights.push(
      `Top prospect: ${topOpportunities[0].name} (health score: ${topOpportunities[0].score})`
    )
  }

  if (flaggedMerchants.length > 0) {
    highlights.push(
      `${flaggedMerchants.length} merchant${flaggedMerchants.length !== 1 ? 's' : ''} flagged for low engagement`
    )
  }

  return {
    generatedAt: new Date().toISOString(),
    period: { from, to },
    merchantsAdded,
    merchantsContacted,
    postsReady,
    goalsOnTrack,
    goalsAtRisk,
    topOpportunities,
    flaggedMerchants,
    highlights,
  }
}
