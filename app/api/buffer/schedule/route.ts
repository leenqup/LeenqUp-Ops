import { NextRequest, NextResponse } from 'next/server'

// Buffer GraphQL API — https://api.buffer.com
// Docs: https://developers.buffer.com
// Auth: Authorization: Bearer <api-key>
// All queries/mutations POST to https://api.buffer.com with { query, variables } JSON body

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

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-buffer-token')
  if (!token) {
    return NextResponse.json({ error: 'Buffer API key not configured. Add it in Settings.' }, { status: 401 })
  }

  const body = await req.json()
  // Support both old field names (body/platform) and new (postBody/platforms)
  const postBody: string = body.postBody ?? body.body ?? ''
  const platforms: string[] = body.platforms ?? (body.platform ? body.platform : [])
  // profileIds now accepted as channelIds (kept as profileIds for backward compat with UI)
  const channelIds: string[] = body.channelIds ?? body.profileIds ?? []
  const scheduledAt: string | undefined = body.scheduledAt // ISO string, optional

  if (!postBody || !platforms?.length) {
    return NextResponse.json({ error: 'postBody and platforms are required' }, { status: 400 })
  }

  try {
    // Step 1 — get organization ID
    const orgResult = await gql(token, `{ account { organizations { id } } }`)
    if (orgResult.errors?.length) {
      return NextResponse.json({ error: orgResult.errors[0].message || 'Invalid API key' }, { status: 401 })
    }
    const organizations = (orgResult.data?.account as { organizations?: Array<{ id: string }> })?.organizations ?? []
    const orgId = organizations[0]?.id
    if (!orgId) {
      return NextResponse.json({ error: 'No Buffer organization found for this API key' }, { status: 404 })
    }

    // Step 2 — list channels so we can filter by service/platform
    const channelsResult = await gql(
      token,
      `query GetChannels($orgId: OrganizationId!) {
        channels(input: { organizationId: $orgId }) {
          id
          name
          service
        }
      }`,
      { orgId },
    )
    if (channelsResult.errors?.length) {
      return NextResponse.json({ error: channelsResult.errors[0].message || 'Failed to fetch channels' }, { status: 400 })
    }
    const allChannels = (channelsResult.data?.channels as Array<{ id: string; name: string; service?: string }>) ?? []

    // Step 3 — filter to target channels
    const targetChannels = channelIds.length
      ? allChannels.filter(c => channelIds.includes(c.id))
      : allChannels.filter(c => platforms.includes(c.service ?? ''))

    if (!targetChannels.length) {
      return NextResponse.json(
        { error: 'No matching Buffer channels found for the requested platforms. Connect your social accounts in Buffer first.' },
        { status: 404 },
      )
    }

    // Step 4 — create post on each channel
    const CREATE_POST = `
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          ... on PostActionSuccess {
            post { id dueAt }
          }
          ... on MutationError {
            message
          }
        }
      }
    `

    const results = await Promise.all(
      targetChannels.map(async (channel) => {
        const input: Record<string, unknown> = {
          channelId: channel.id,
          text: postBody,
          schedulingType: 'automatic',
          mode: scheduledAt ? 'customScheduled' : 'addToQueue',
        }
        if (scheduledAt) {
          input.dueAt = scheduledAt // ISO 8601 UTC string
        }

        const result = await gql(token, CREATE_POST, { input })
        const createResult = result.data?.createPost as
          | { post?: { id: string; dueAt?: string } }
          | { message?: string }
          | undefined

        const postId = (createResult as { post?: { id: string } })?.post?.id
        const errorMsg = (createResult as { message?: string })?.message

        return {
          channelId: channel.id,
          channelName: channel.name,
          service: channel.service ?? '',
          postId: postId ?? null,
          error: errorMsg ?? (result.errors?.[0]?.message ?? null),
        }
      }),
    )

    const anyError = results.some(r => r.error)
    return NextResponse.json({ success: !anyError, results })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to schedule post. Check your Buffer API key.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
