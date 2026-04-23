import type { Merchant } from '@/types'

export interface MerchantHealthScore {
  total: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  breakdown: {
    contactCompleteness: number  // 0–25
    outreachActivity: number     // 0–25
    pipelineStage: number        // 0–25
    notesDepth: number           // 0–25
  }
  flags: string[]
}

export function computeMerchantHealth(merchant: Merchant): MerchantHealthScore {
  // ── contactCompleteness (0–25) ─────────────────────────────────
  let contactCompleteness = 0
  if (merchant.phone) contactCompleteness += 6
  if (merchant.email) contactCompleteness += 6
  if (merchant.website) contactCompleteness += 7
  if (merchant.instagram || merchant.facebook || merchant.whatsapp || merchant.linkedinUrl) {
    contactCompleteness += 6
  }

  // ── outreachActivity (0–25) ────────────────────────────────────
  let outreachActivity = 0
  if (merchant.lastContactDate) {
    const diffMs = Date.now() - new Date(merchant.lastContactDate).getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    if (diffDays <= 7) {
      outreachActivity = 25
    } else if (diffDays <= 30) {
      outreachActivity = 18
    } else if (diffDays <= 90) {
      outreachActivity = 10
    } else {
      outreachActivity = 3
    }
  }

  // ── pipelineStage (0–25) ───────────────────────────────────────
  const pipelineMap: Record<string, number> = {
    'not-contacted': 0,
    'contacted': 8,
    'responded': 13,
    'interested': 18,
    'signed-up': 25,
    'declined': 0,
    'not-a-fit': 0,
  }
  const pipelineStage = pipelineMap[merchant.outreachStatus] ?? 0

  // ── notesDepth (0–25) ─────────────────────────────────────────
  let notesDepth = 0
  const notesLen = merchant.notes?.length ?? 0
  if (notesLen > 200) {
    notesDepth = 25
  } else if (notesLen > 100) {
    notesDepth = 18
  } else if (notesLen > 50) {
    notesDepth = 10
  } else if (notesLen > 0) {
    notesDepth = 5
  }

  // ── Total & grade ─────────────────────────────────────────────
  const total = contactCompleteness + outreachActivity + pipelineStage + notesDepth

  let grade: MerchantHealthScore['grade']
  if (total >= 85) grade = 'A'
  else if (total >= 70) grade = 'B'
  else if (total >= 50) grade = 'C'
  else if (total >= 30) grade = 'D'
  else grade = 'F'

  // ── Flags ──────────────────────────────────────────────────────
  const flags: string[] = []

  if (!merchant.phone) flags.push('No phone number')
  if (!merchant.email) flags.push('No email address')
  if (!merchant.website) flags.push('No website')
  if (!merchant.instagram && !merchant.facebook && !merchant.whatsapp && !merchant.linkedinUrl) {
    flags.push('No social media')
  }
  if (outreachActivity === 0 && merchant.outreachStatus !== 'not-contacted') {
    flags.push('No contact recorded')
  }
  if (merchant.lastContactDate) {
    const diffMs = Date.now() - new Date(merchant.lastContactDate).getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    if (diffDays > 30) flags.push('Not contacted in 30+ days')
  }
  if (!merchant.notes || merchant.notes.length === 0) flags.push('No notes on file')
  if (merchant.outreachStatus === 'declined' || merchant.outreachStatus === 'not-a-fit') {
    flags.push('Marked declined or not a fit')
  }

  return {
    total,
    grade,
    breakdown: {
      contactCompleteness,
      outreachActivity,
      pipelineStage,
      notesDepth,
    },
    flags,
  }
}
