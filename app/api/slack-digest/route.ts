import { NextRequest, NextResponse } from 'next/server'
import type { DigestReport } from '@/lib/digest'

function formatWeekLabel(from: string): string {
  return new Date(from).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export async function POST(req: NextRequest) {
  let body: { webhookUrl: string; digest: DigestReport }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  const { webhookUrl, digest } = body

  if (!webhookUrl || typeof webhookUrl !== 'string') {
    return NextResponse.json({ success: false, error: 'webhookUrl is required' }, { status: 400 })
  }

  if (!digest || !digest.period) {
    return NextResponse.json({ success: false, error: 'digest payload is required' }, { status: 400 })
  }

  const weekLabel = formatWeekLabel(digest.period.from)

  const highlightsText = digest.highlights.map(h => `• ${h}`).join('\n')

  // Build Slack Block Kit message
  const blocks: object[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `LeenqUp Weekly Digest — Week of ${weekLabel}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Merchants Added*\n${digest.merchantsAdded}` },
        { type: 'mrkdwn', text: `*Contacted*\n${digest.merchantsContacted}` },
        { type: 'mrkdwn', text: `*Posts Ready*\n${digest.postsReady}` },
        { type: 'mrkdwn', text: `*Goals On Track*\n${digest.goalsOnTrack}` },
      ],
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Highlights*\n${highlightsText}`,
      },
    },
  ]

  if (digest.topOpportunities.length > 0) {
    const oppsText = digest.topOpportunities
      .map(o => `• ${o.name} (score: ${o.score})`)
      .join('\n')
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Top Opportunities*\n${oppsText}`,
      },
    })
  }

  if (digest.flaggedMerchants.length > 0) {
    const flagsText = digest.flaggedMerchants
      .map(f => `• ${f.name} (score: ${f.score})`)
      .join('\n')
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Needs Attention ⚠️*\n${flagsText}`,
      },
    })
  }

  const slackPayload = { blocks }

  try {
    const slackRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload),
    })

    if (!slackRes.ok) {
      const errorText = await slackRes.text().catch(() => 'Unknown error')
      return NextResponse.json(
        { success: false, error: `Slack returned ${slackRes.status}: ${errorText}` },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to reach Slack'
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}
