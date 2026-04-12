import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-brevo-key')
  if (!apiKey) {
    return NextResponse.json({ error: 'Brevo API key not configured' }, { status: 401 })
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/account', {
      headers: { 'api-key': apiKey },
    })
    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.message || 'Invalid Brevo API key' }, { status: res.status })
    }
    const account = await res.json()
    return NextResponse.json({
      connected: true,
      email: account.email,
      firstName: account.firstName,
      plan: account.plan?.[0]?.type,
      emailCredits: account.plan?.[0]?.credits,
    })
  } catch {
    return NextResponse.json({ error: 'Could not reach Brevo API' }, { status: 500 })
  }
}
