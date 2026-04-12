import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-buffer-token')
  if (!token) {
    return NextResponse.json({ error: 'Buffer access token not configured. Add it in Settings.' }, { status: 401 })
  }

  const body = await req.json()
  // Support both old field names (body/platform) and new (postBody/platforms)
  const postBody: string = body.postBody ?? body.body ?? ''
  const platforms: string[] = body.platforms ?? (body.platform ? body.platform : [])
  const profileIds: string[] = body.profileIds ?? []
  const scheduledAt: string | undefined = body.scheduledAt // ISO string, optional

  if (!postBody || !platforms?.length) {
    return NextResponse.json({ error: 'postBody and platforms are required' }, { status: 400 })
  }

  // Convert ISO scheduledAt to Unix timestamp for Buffer API
  const scheduledTimestamp = scheduledAt ? Math.floor(new Date(scheduledAt).getTime() / 1000) : null

  try {
    // Get Buffer profiles first to find profile IDs for requested platforms
    const profilesRes = await fetch('https://api.bufferapp.com/1/profiles.json', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!profilesRes.ok) {
      const err = await profilesRes.json()
      return NextResponse.json({ error: err.message || 'Buffer API error' }, { status: profilesRes.status })
    }
    const profiles: Array<{ id: string; service: string; formatted_username: string }> = await profilesRes.json()

    // Filter profiles matching requested platforms (instagram, facebook, linkedin, twitter)
    const targetProfiles = profileIds?.length
      ? profiles.filter(p => profileIds.includes(p.id))
      : profiles.filter(p => platforms.includes(p.service))

    if (!targetProfiles.length) {
      return NextResponse.json({ error: 'No matching Buffer profiles found for the requested platforms' }, { status: 404 })
    }

    // Schedule to each profile
    const results = await Promise.all(
      targetProfiles.map(async (profile) => {
        const params = new URLSearchParams({
          text: postBody,
          'profile_ids[]': profile.id,
        })
        if (scheduledTimestamp) {
          params.set('scheduled_at', String(scheduledTimestamp))
        }
        const updateRes = await fetch('https://api.bufferapp.com/1/updates/create.json', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params,
        })
        const update = await updateRes.json()
        return { profileId: profile.id, service: profile.service, updateId: update.updates?.[0]?.id }
      })
    )

    return NextResponse.json({ success: true, results })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to schedule post. Check your Buffer token.' }, { status: 500 })
  }
}
