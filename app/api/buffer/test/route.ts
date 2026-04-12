import { NextRequest, NextResponse } from 'next/server'

// Buffer Publish API — uses Bearer token auth against https://api.bufferapp.com/1/.
// Buffer no longer accepts new public developer applications but personal access tokens
// still authenticate against this endpoint.
// Verify current endpoints at: https://buffer.com/developers/api

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-buffer-token')
  if (!token) {
    return NextResponse.json({ success: false, error: 'Buffer access token not configured' }, { status: 401 })
  }

  try {
    const res = await fetch('https://api.bufferapp.com/1/profiles.json', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      let errMsg = 'Invalid Buffer token'
      try { const err = await res.json(); errMsg = err.message || errMsg } catch {}
      return NextResponse.json({ success: false, error: errMsg }, { status: res.status })
    }
    const profiles: Array<{ id: string; service: string; formatted_username: string; default_profile: boolean }> = await res.json()
    return NextResponse.json({
      success: true,
      profiles: profiles.map(p => ({
        id: p.id,
        service: p.service,
        // 'name' matches what the Settings page renders in the profile list
        name: p.formatted_username,
        isDefault: p.default_profile,
      })),
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Could not reach Buffer API' }, { status: 500 })
  }
}
