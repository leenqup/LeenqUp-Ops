import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { webhookUrl, message } = body

  if (!webhookUrl) {
    return NextResponse.json({ error: 'Slack webhook URL is required' }, { status: 400 })
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message || 'LeenqUp Ops notification' }),
    })
    if (!res.ok) {
      return NextResponse.json({ error: `Slack returned ${res.status}` }, { status: res.status })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Could not reach Slack webhook URL' }, { status: 500 })
  }
}
