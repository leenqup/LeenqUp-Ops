import { NextRequest, NextResponse } from 'next/server'
import { createSign } from 'crypto'

// ── Google Sheets API v4 export route ────────────────────────────────────────
//
// POST /api/sheets/export
// Headers:
//   x-gsheets-credentials  — Service account credentials JSON (stringified)
//   x-gsheets-sheet-id     — Spreadsheet ID from the Google Sheets URL
// Body:
//   { type: 'merchants' | 'posts' | 'scripts', data: Array<...>, filters?: object }
//
// Behaviour:
//   - Authenticates using a service account JWT (RS256) exchanged for a Bearer token
//   - Finds or creates a sheet tab named "{type} {YYYY-MM-DD}"
//   - Writes column headers on row 1, then appends data rows
//   - Returns the range written and the spreadsheet URL

// ── JWT helper — signs a Google service account JWT using Node.js crypto ─────

function base64url(buf: Buffer | string): string {
  const b64 = Buffer.isBuffer(buf) ? buf.toString('base64') : Buffer.from(buf).toString('base64')
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function getGoogleAccessToken(credentialsJson: string): Promise<string> {
  let creds: { client_email: string; private_key: string }
  try {
    creds = JSON.parse(credentialsJson)
  } catch {
    throw new Error('Invalid service account credentials JSON')
  }

  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))

  const signingInput = `${header}.${payload}`
  // Normalise PEM line endings (service account JSON sometimes has escaped \n)
  const privateKey = creds.private_key.replace(/\\n/g, '\n')

  const sign = createSign('RSA-SHA256')
  sign.update(signingInput)
  const signature = base64url(sign.sign(privateKey))
  const jwt = `${signingInput}.${signature}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const tokenData = await tokenRes.json()
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || 'Failed to obtain Google access token')
  }
  return tokenData.access_token as string
}

// ── Column definitions ────────────────────────────────────────────────────────

const HEADERS: Record<string, string[]> = {
  merchants: ['ID', 'Name', 'Segment', 'Category', 'City', 'Country', 'Operating Status',
    'Digital Presence', 'Instagram', 'Facebook', 'WhatsApp', 'Email', 'Website',
    'Outreach Status', 'Priority', 'Last Contact Date', 'Notes', 'Tags'],
  posts: ['ID', 'Title', 'Platform', 'Audience', 'Pillar', 'Phase', 'Status',
    'Character Count', 'Scheduled For', 'Tags', 'Notes'],
  scripts: ['ID', 'Title', 'Channel', 'Type', 'Persona', 'Stage', 'Tags', 'Notes'],
}

type Row = Record<string, unknown>

const MAPPERS: Record<string, (r: Row) => string[]> = {
  merchants: (m) => [
    String(m.id ?? ''), String(m.name ?? ''), String(m.segment ?? ''), String(m.category ?? ''),
    String(m.city ?? ''), String(m.country ?? ''), String(m.operatingStatus ?? ''),
    String(m.digitalPresence ?? ''), String(m.instagram ?? ''), String(m.facebook ?? ''),
    String(m.whatsapp ?? ''), String(m.email ?? ''), String(m.website ?? ''),
    String(m.outreachStatus ?? ''), String(m.priority ?? ''), String(m.lastContactDate ?? ''),
    String(m.notes ?? ''), Array.isArray(m.tags) ? (m.tags as string[]).join('; ') : '',
  ],
  posts: (p) => [
    String(p.id ?? ''), String(p.title ?? ''), String(p.platform ?? ''), String(p.audience ?? ''),
    String(p.pillar ?? ''), String(p.phase ?? ''), String(p.status ?? ''),
    String(p.characterCount ?? ''), String(p.scheduledFor ?? ''),
    Array.isArray(p.tags) ? (p.tags as string[]).join('; ') : '', String(p.notes ?? ''),
  ],
  scripts: (s) => [
    String(s.id ?? ''), String(s.title ?? ''), String(s.channel ?? ''), String(s.type ?? ''),
    String(s.persona ?? ''), String(s.stage ?? ''),
    Array.isArray(s.tags) ? (s.tags as string[]).join('; ') : '', String(s.notes ?? ''),
  ],
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const credentialsJson = req.headers.get('x-gsheets-credentials')
  const sheetId = req.headers.get('x-gsheets-sheet-id')

  if (!credentialsJson || !sheetId) {
    return NextResponse.json(
      { error: 'x-gsheets-credentials and x-gsheets-sheet-id headers are required' },
      { status: 401 }
    )
  }

  const body = await req.json()
  const { type, data } = body as { type: string; data: Row[] }

  if (!type || !Array.isArray(data)) {
    return NextResponse.json({ error: 'type (string) and data (array) are required' }, { status: 400 })
  }

  const headers = HEADERS[type]
  const mapper = MAPPERS[type]
  if (!headers || !mapper) {
    return NextResponse.json({ error: `Unsupported type "${type}". Supported: merchants, posts, scripts` }, { status: 400 })
  }

  // Obtain access token
  let accessToken: string
  try {
    accessToken = await getGoogleAccessToken(credentialsJson)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 401 })
  }

  const sheetsBase = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`
  const authHeaders = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }

  // Get current spreadsheet metadata (list existing sheets)
  const metaRes = await fetch(sheetsBase, { headers: authHeaders })
  if (!metaRes.ok) {
    const e = await metaRes.json()
    return NextResponse.json({ error: e.error?.message || 'Could not read spreadsheet' }, { status: metaRes.status })
  }
  const meta = await metaRes.json()
  const today = new Date().toISOString().split('T')[0]
  const tabName = `${type} ${today}`

  const existingSheet = (meta.sheets as Array<{ properties: { sheetId: number; title: string } }>)
    .find(s => s.properties.title === tabName)

  let tabSheetId: number

  if (existingSheet) {
    tabSheetId = existingSheet.properties.sheetId
  } else {
    // Create a new tab
    const addRes = await fetch(`${sheetsBase}:batchUpdate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        requests: [{ addSheet: { properties: { title: tabName } } }],
      }),
    })
    if (!addRes.ok) {
      const e = await addRes.json()
      return NextResponse.json({ error: e.error?.message || 'Could not create sheet tab' }, { status: addRes.status })
    }
    const addData = await addRes.json()
    tabSheetId = addData.replies[0].addSheet.properties.sheetId as number
  }

  // Build rows: header row + data rows
  const rows: string[][] = [headers, ...data.map(mapper)]
  const range = `'${tabName}'!A1`

  const writeRes = await fetch(`${sheetsBase}/values/${encodeURIComponent(range)}?valueInputOption=RAW`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ range, majorDimension: 'ROWS', values: rows }),
  })
  if (!writeRes.ok) {
    const e = await writeRes.json()
    return NextResponse.json({ error: e.error?.message || 'Failed to write data' }, { status: writeRes.status })
  }

  const writeData = await writeRes.json()
  return NextResponse.json({
    success: true,
    tab: tabName,
    rowsWritten: rows.length - 1,
    range: writeData.updatedRange,
    sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit#gid=${tabSheetId}`,
  })
}
