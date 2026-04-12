import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-buffer-token')
  if (!token) {
    return NextResponse.json({ error: 'Buffer access token not configured' }, { status: 401 })
  }

  try {
    const res = await fetch('https://api.bufferapp.com/1/profiles.json', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.message || 'Invalid Buffer token' }, { status: res.status })
    }
    const profiles: Array<{ id: string; service: string; formatted_username: string; default_profile: boolean }> = await res.json()
    return NextResponse.json({
      connected: true,
      profiles: profiles.map(p => ({
        id: p.id,
        service: p.service,
        username: p.formatted_username,
        isDefault: p.default_profile,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Could not reach Buffer API' }, { status: 500 })
  }
}
