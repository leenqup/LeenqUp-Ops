import { NextRequest, NextResponse } from 'next/server'

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

  const results: Array<{ name: string; action: 'created' | 'updated' | 'error'; error?: string }> = []

  for (const merchant of merchants) {
    try {
      // Check if page exists by searching for the name
      const searchRes = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          filter: { property: 'Name', title: { equals: merchant.name } },
          page_size: 1,
        }),
      })
      const searchData = await searchRes.json()
      const existing = searchData.results?.[0]

      if (existing) {
        // Update
        await fetch(`https://api.notion.com/v1/pages/${existing.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ properties: merchantToNotionProperties(merchant) }),
        })
        results.push({ name: merchant.name, action: 'updated' })
      } else {
        // Create
        await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            parent: { database_id: dbId },
            properties: merchantToNotionProperties(merchant),
          }),
        })
        results.push({ name: merchant.name, action: 'created' })
      }
    } catch (err) {
      results.push({ name: merchant.name, action: 'error', error: String(err) })
    }
  }

  return NextResponse.json({ success: true, results })
}
