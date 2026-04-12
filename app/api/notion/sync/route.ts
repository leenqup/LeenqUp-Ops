import { NextRequest, NextResponse } from 'next/server'
import { kvGet, kvSet } from '@/lib/supabase'

interface NotionProperty {
  title?: Array<{ text: { content: string } }>
  rich_text?: Array<{ text: { content: string } }>
  select?: { name: string }
  url?: string | null
  phone_number?: string | null
  email?: string | null
  date?: { start: string } | null
  checkbox?: boolean
}

function merchantToNotionProperties(merchant: Record<string, unknown>): Record<string, NotionProperty> {
  return {
    Name: { title: [{ text: { content: String(merchant.name || '') } }] },
    Segment: { select: { name: String(merchant.segment || 'liberia') } },
    Category: { rich_text: [{ text: { content: String(merchant.category || '') } }] },
    City: { rich_text: [{ text: { content: String(merchant.city || '') } }] },
    Country: { rich_text: [{ text: { content: String(merchant.country || '') } }] },
    'Outreach Status': { select: { name: String(merchant.outreachStatus || 'not-contacted') } },
    Priority: { select: { name: String(merchant.priority || 'medium') } },
    'Digital Presence': { select: { name: String(merchant.digitalPresence || 'none') } },
    Instagram: { url: merchant.instagram ? String(merchant.instagram) : null },
    WhatsApp: { phone_number: merchant.whatsapp ? String(merchant.whatsapp) : null },
    Notes: { rich_text: [{ text: { content: String(merchant.notes || '') } }] },
    'Last Contact Date': merchant.lastContactDate
      ? { date: { start: String(merchant.lastContactDate) } }
      : { date: null },
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-notion-token')
  const dbId = req.headers.get('x-notion-database-id')

  if (!token || !dbId) {
    return NextResponse.json({ error: 'Notion token and database ID are required. Configure them in Settings.' }, { status: 401 })
  }

  const { merchants } = await req.json()
  if (!Array.isArray(merchants)) {
    return NextResponse.json({ error: 'merchants array is required' }, { status: 400 })
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
  }

  type SyncResult = { id: string; name: string; action: 'created' | 'updated' | 'error'; notionPageId?: string; error?: string }
  const results: SyncResult[] = []

  // Track which merchant IDs had their notionPageId set for the first time,
  // so we can write them back to Supabase in one batch after the loop.
  const newPageIds: Record<string, string> = {}

  for (const merchant of merchants) {
    try {
      const merchantId: string = merchant.id ?? ''

      // ── Idempotent lookup strategy ──────────────────────────────────────────
      // 1. If the merchant already has a notionPageId, update that page directly.
      //    This avoids name-collision bugs (two merchants named "Shoprite").
      // 2. If no notionPageId exists, fall back to name search to prevent creating
      //    duplicates on re-run. Then store the returned page ID on the merchant.
      // 3. If no name match either, create a new page and store the new ID.

      let pageId: string | null = merchant.notionPageId ?? null

      if (!pageId) {
        // Name-based fallback search
        const searchRes = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            filter: { property: 'Name', title: { equals: merchant.name } },
            page_size: 1,
          }),
        })
        const searchData = await searchRes.json()
        pageId = searchData.results?.[0]?.id ?? null
      }

      if (pageId) {
        // Update existing page
        const updateRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ properties: merchantToNotionProperties(merchant) }),
        })
        if (!updateRes.ok) {
          const e = await updateRes.json()
          results.push({ id: merchantId, name: merchant.name, action: 'error', error: e.message })
          continue
        }
        results.push({ id: merchantId, name: merchant.name, action: 'updated', notionPageId: pageId })
        // If the merchant didn't have a stored notionPageId yet, record it now
        if (!merchant.notionPageId && merchantId) {
          newPageIds[merchantId] = pageId
        }
      } else {
        // Create new page
        const createRes = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            parent: { database_id: dbId },
            properties: merchantToNotionProperties(merchant),
          }),
        })
        if (!createRes.ok) {
          const e = await createRes.json()
          results.push({ id: merchantId, name: merchant.name, action: 'error', error: e.message })
          continue
        }
        const created = await createRes.json()
        const newPageId: string = created.id
        results.push({ id: merchantId, name: merchant.name, action: 'created', notionPageId: newPageId })
        if (merchantId) {
          newPageIds[merchantId] = newPageId
        }
      }
    } catch (err) {
      results.push({ id: merchant.id ?? '', name: merchant.name, action: 'error', error: String(err) })
    }
  }

  // ── Write notionPageId back to Supabase ──────────────────────────────────
  // Update the merchant records in Supabase with the newly assigned Notion page IDs
  // so future syncs skip the name-search and update the correct page directly.
  if (Object.keys(newPageIds).length > 0) {
    try {
      const stored = (await kvGet('leenqup_merchants')) as Array<Record<string, unknown>> | null
      if (Array.isArray(stored)) {
        const updated = stored.map(m => {
          const id = String(m.id ?? '')
          return newPageIds[id] ? { ...m, notionPageId: newPageIds[id] } : m
        })
        await kvSet('leenqup_merchants', updated)
      }
    } catch {
      // Non-fatal — notionPageIds will be re-resolved by name on the next sync
    }
  }

  return NextResponse.json({
    success: true,
    results,
    newPageIdsWritten: Object.keys(newPageIds).length,
  })
}
