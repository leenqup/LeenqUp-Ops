import { NextRequest, NextResponse } from 'next/server'

// Buffer GraphQL API — https://api.buffer.com
// Auth: Bearer API key in Authorization header
// All requests are POST to https://api.buffer.com with JSON body { query, variables }

const BUFFER_GQL = 'https://api.buffer.com'

async function gql(
  token: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<{ data?: Record<string, unknown>; errors?: Array<{ message: string }> }> {
  const res = await fetch(BUFFER_GQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Buffer API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-buffer-token')
  if (!token) {
    return NextResponse.json({ success: false, error: 'Buffer API key not configured. Add it in Settings.' }, { status: 401 })
  }

  try {
    // Step 1 — get organization ID
    const orgResult = await gql(token, `{ account { organizations { id } } }`)
    if (orgResult.errors?.length) {
      return NextResponse.json(
        { success: false, error: orgResult.errors[0].message || 'Invalid API key' },
        { status: 401 },
      )
    }

    const organizations = (orgResult.data?.account as { organizations?: Array<{ id: string }> })?.organizations ?? []
    const orgId = organizations[0]?.id
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'No Buffer organization found for this API key' }, { status: 404 })
    }

    // Step 2 — list channels in the organization
    const channelsResult = await gql(
      token,
      `query GetChannels($orgId: String!) {
        channels(input: { organizationId: $orgId }) {
          id
          name
          service
        }
      }`,
      { orgId },
    )

    if (channelsResult.errors?.length) {
      return NextResponse.json(
        { success: false, error: channelsResult.errors[0].message || 'Failed to fetch channels' },
        { status: 400 },
      )
    }

    const rawChannels = (channelsResult.data?.channels as Array<{ id: string; name: string; service?: string }>) ?? []
    const channels = rawChannels.map(c => ({
      id: c.id,
      name: c.name,
      service: c.service ?? '',
    }))

    return NextResponse.json({ success: true, profiles: channels })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not reach Buffer API'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
