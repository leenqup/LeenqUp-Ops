import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-notion-token')
  const dbId = req.headers.get('x-notion-database-id')

  if (!token || !dbId) {
    return NextResponse.json({ error: 'Notion token and database ID are required' }, { status: 401 })
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
      },
    })
    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.message || 'Could not access Notion database. Check your token and database ID.' }, { status: res.status })
    }
    const db = await res.json()
    const title = db.title?.[0]?.plain_text || 'Untitled'

    // Get page count
    const queryRes = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({ page_size: 1 }),
    })
    const queryData = await queryRes.json()

    return NextResponse.json({
      connected: true,
      databaseTitle: title,
      hasMore: queryData.has_more,
      pageCount: queryData.results?.length,
    })
  } catch {
    return NextResponse.json({ error: 'Could not reach Notion API' }, { status: 500 })
  }
}
