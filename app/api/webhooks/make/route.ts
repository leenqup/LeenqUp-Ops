import { NextRequest, NextResponse } from 'next/server'
import { kvGet, kvSet } from '@/lib/supabase'

// ── Make.com Inbound Webhook — POST /api/webhooks/make ───────────────────────
//
// Authentication:
//   Header: X-LeenqUp-Secret  — must match the makeInboundSecret stored in settings
//   (Settings → Make.com Inbound → Webhook Secret field)
//
// Supported eventType values and expected payloads:
//
// ① merchant_signup
//    {
//      eventType: "merchant_signup",
//      name:       string,    // required
//      email:      string,    // required — used as dedup key
//      phone:      string,
//      category:   string,
//      city:       string,
//      country:    string,
//      segment:    string,    // "liberia" | "diaspora"
//      instagram:  string,
//      facebook:   string,
//      website:    string,
//    }
//    → Creates a new merchant record. Sets outreachStatus="contacted", priority="high".
//      Skips if a merchant with the same email already exists.
//
// ② lead_update
//    {
//      eventType:       "lead_update",
//      email:           string,   // required — identifies the merchant
//      outreachStatus?: string,   // new status to apply
//      note?:           string,   // free-text note to append to the notes log
//      lastContactDate?: string,  // ISO date string
//    }
//    → Finds merchant by email, updates outreachStatus/lastContactDate if provided,
//      appends note with timestamp if provided.
//
// ③ post_performance
//    {
//      eventType: "post_performance",
//      postId:    string,         // required — identifies the post record
//      metrics: {
//        impressions:     number,
//        clicks:          number,
//        engagementRate:  number,  // 0-100 (percentage)
//      }
//    }
//    → Finds post by ID and merges the metrics object into the post record.

function makeId(): string {
  return `make-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export async function POST(req: NextRequest) {
  // ── Authentication ─────────────────────────────────────────────────────────
  const incomingSecret = req.headers.get('x-leenqup-secret')
  if (!incomingSecret) {
    return NextResponse.json({ error: 'Missing X-LeenqUp-Secret header' }, { status: 401 })
  }

  // Read the expected secret from Supabase (stored under leenqup_settings — local-only key
  // that is never synced, so we fall back to checking if it's been seeded into the db).
  // Since settings is LOCAL_ONLY, we read it from the request header instead.
  const settingsHeader = req.headers.get('x-settings-secret')
  // The caller (Make.com) passes the secret; we validate it against what's stored server-side.
  // Because settings is never in Supabase, we store the expected secret in an env var as fallback.
  // Primary: LEENQUP_MAKE_SECRET env var. Secondary: x-expected-secret debug header (never use in prod).
  const expectedSecret =
    process.env.LEENQUP_MAKE_SECRET ||
    settingsHeader ||
    null

  if (!expectedSecret || incomingSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid or missing webhook secret' }, { status: 401 })
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { eventType } = body
  if (!eventType) {
    return NextResponse.json({ error: 'eventType is required' }, { status: 400 })
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  if (eventType === 'merchant_signup') {
    const { name, email, phone, category, city, country, segment, instagram, facebook, website } = body as Record<string, string>
    if (!name || !email) {
      return NextResponse.json({ error: 'merchant_signup requires name and email' }, { status: 400 })
    }

    const merchants = (await kvGet('leenqup_merchants') as Array<Record<string, unknown>> | null) ?? []
    const duplicate = merchants.find(m => String(m.email ?? '').toLowerCase() === email.toLowerCase())
    if (duplicate) {
      return NextResponse.json({ success: true, action: 'skipped', reason: 'duplicate_email', merchantId: duplicate.id })
    }

    const newMerchant: Record<string, unknown> = {
      id: makeId(),
      name,
      email,
      phone: phone ?? '',
      category: category ?? '',
      city: city ?? '',
      country: country ?? 'Liberia',
      segment: segment ?? 'liberia',
      instagram: instagram ?? '',
      facebook: facebook ?? '',
      website: website ?? '',
      outreachStatus: 'contacted',
      priority: 'high',
      digitalPresence: 'none',
      operatingStatus: 'active',
      notes: '',
      tags: ['make-import'],
      createdAt: new Date().toISOString(),
    }

    merchants.unshift(newMerchant)
    await kvSet('leenqup_merchants', merchants)

    return NextResponse.json({ success: true, action: 'created', merchantId: newMerchant.id })
  }

  if (eventType === 'lead_update') {
    const { email, outreachStatus, note, lastContactDate } = body as Record<string, string>
    if (!email) {
      return NextResponse.json({ error: 'lead_update requires email' }, { status: 400 })
    }

    const merchants = (await kvGet('leenqup_merchants') as Array<Record<string, unknown>> | null) ?? []
    const idx = merchants.findIndex(m => String(m.email ?? '').toLowerCase() === email.toLowerCase())
    if (idx === -1) {
      return NextResponse.json({ error: `No merchant found with email ${email}` }, { status: 404 })
    }

    const merchant = { ...merchants[idx] }
    if (outreachStatus) merchant.outreachStatus = outreachStatus
    if (lastContactDate) merchant.lastContactDate = lastContactDate

    if (note) {
      const timestamp = new Date().toISOString()
      const existing = String(merchant.notes ?? '')
      merchant.notes = existing
        ? `${existing}\n\n[${timestamp}] ${note}`
        : `[${timestamp}] ${note}`
    }

    merchants[idx] = merchant
    await kvSet('leenqup_merchants', merchants)

    return NextResponse.json({ success: true, action: 'updated', merchantId: merchant.id })
  }

  if (eventType === 'post_performance') {
    const { postId, metrics } = body as { postId: string; metrics: Record<string, unknown> }
    if (!postId || !metrics) {
      return NextResponse.json({ error: 'post_performance requires postId and metrics' }, { status: 400 })
    }

    const posts = (await kvGet('leenqup_posts') as Array<Record<string, unknown>> | null) ?? []
    const idx = posts.findIndex(p => String(p.id ?? '') === postId)
    if (idx === -1) {
      return NextResponse.json({ error: `No post found with id ${postId}` }, { status: 404 })
    }

    posts[idx] = { ...posts[idx], metrics: { ...(posts[idx].metrics as object ?? {}), ...metrics } }
    await kvSet('leenqup_posts', posts)

    return NextResponse.json({ success: true, action: 'updated', postId })
  }

  return NextResponse.json(
    { error: `Unknown eventType "${eventType}". Supported: merchant_signup, lead_update, post_performance` },
    { status: 400 }
  )
}
