import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { type, data } = await req.json()

  if (!type || !data) {
    return NextResponse.json({ error: 'type and data are required' }, { status: 400 })
  }

  // Column header maps per data type for clean Google Sheets import
  const headerMaps: Record<string, string[]> = {
    merchants: ['Name', 'Segment', 'Category', 'City', 'Country', 'Operating Status', 'Digital Presence', 'Instagram', 'Facebook', 'WhatsApp', 'Email', 'Website', 'Outreach Status', 'Priority', 'Last Contact Date', 'Notes', 'Tags'],
    posts: ['ID', 'Title', 'Platform', 'Audience', 'Pillar', 'Phase', 'Status', 'Character Count', 'Scheduled For', 'Tags', 'Notes'],
    scripts: ['ID', 'Title', 'Channel', 'Type', 'Persona', 'Stage', 'Tags', 'Notes'],
  }

  const fieldMaps: Record<string, (row: Record<string, unknown>) => string[]> = {
    merchants: (m) => [
      String(m.name ?? ''), String(m.segment ?? ''), String(m.category ?? ''), String(m.city ?? ''), String(m.country ?? ''),
      String(m.operatingStatus ?? ''), String(m.digitalPresence ?? ''), String(m.instagram ?? ''), String(m.facebook ?? ''),
      String(m.whatsapp ?? ''), String(m.email ?? ''), String(m.website ?? ''), String(m.outreachStatus ?? ''),
      String(m.priority ?? ''), String(m.lastContactDate ?? ''), String(m.notes ?? ''),
      Array.isArray(m.tags) ? (m.tags as string[]).join('; ') : '',
    ],
    posts: (p) => [
      String(p.id ?? ''), String(p.title ?? ''), String(p.platform ?? ''), String(p.audience ?? ''),
      String(p.pillar ?? ''), String(p.phase ?? ''), String(p.status ?? ''), String(p.characterCount ?? ''),
      String(p.scheduledFor ?? ''), Array.isArray(p.tags) ? (p.tags as string[]).join('; ') : '', String(p.notes ?? ''),
    ],
    scripts: (s) => [
      String(s.id ?? ''), String(s.title ?? ''), String(s.channel ?? ''), String(s.type ?? ''),
      String(s.persona ?? ''), String(s.stage ?? ''), Array.isArray(s.tags) ? (s.tags as string[]).join('; ') : '', String(s.notes ?? ''),
    ],
  }

  const headers = headerMaps[type]
  const mapper = fieldMaps[type]

  if (!headers || !mapper) {
    return NextResponse.json({ error: `Unsupported type: ${type}` }, { status: 400 })
  }

  const escape = (val: string) => `"${val.replace(/"/g, '""')}"`
  const rows = (data as Record<string, unknown>[]).map(row => mapper(row).map(escape).join(','))
  const csv = [headers.map(escape).join(','), ...rows].join('\n')
  const filename = `leenqup-${type}-sheets-${new Date().toISOString().split('T')[0]}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
