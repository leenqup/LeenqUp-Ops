import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { merchantName, oldStatus, newStatus, webhookUrl } = body

  if (!webhookUrl) {
    return NextResponse.json({ error: 'Webhook URL is required' }, { status: 400 })
  }

  const payload = {
    event: 'merchant.status_updated',
    timestamp: new Date().toISOString(),
    data: {
      merchantName,
      oldStatus,
      newStatus,
      source: 'leenqup-ops',
    },
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return NextResponse.json({ success: true, status: res.status })
  } catch {
    return NextResponse.json({ error: 'Failed to deliver webhook' }, { status: 500 })
  }
}
