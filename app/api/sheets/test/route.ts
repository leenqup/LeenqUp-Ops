import { NextRequest, NextResponse } from 'next/server'
import { createSign } from 'crypto'

// ── JWT helper (same as export route — kept self-contained) ──────────────────

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

// ── GET /api/sheets/test ──────────────────────────────────────────────────────
// Headers:
//   x-gsheets-credentials  — Service account credentials JSON (stringified)
//   x-gsheets-sheet-id     — Spreadsheet ID
//
// Returns the spreadsheet title and list of existing sheet tab names to confirm
// the service account has access.

export async function GET(req: NextRequest) {
  const credentialsJson = req.headers.get('x-gsheets-credentials')
  const sheetId = req.headers.get('x-gsheets-sheet-id')

  if (!credentialsJson || !sheetId) {
    return NextResponse.json(
      { success: false, error: 'x-gsheets-credentials and x-gsheets-sheet-id headers are required' },
      { status: 401 }
    )
  }

  let accessToken: string
  try {
    accessToken = await getGoogleAccessToken(credentialsJson)
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 401 })
  }

  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!metaRes.ok) {
    let errMsg = 'Could not access spreadsheet — check the Sheet ID and that the service account has been shared on the sheet'
    try { const e = await metaRes.json(); errMsg = e.error?.message || errMsg } catch {}
    return NextResponse.json({ success: false, error: errMsg }, { status: metaRes.status })
  }

  const meta = await metaRes.json()
  return NextResponse.json({
    success: true,
    title: meta.properties?.title ?? 'Unknown',
    sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
    tabs: (meta.sheets as Array<{ properties: { title: string } }>).map(s => s.properties.title),
  })
}
