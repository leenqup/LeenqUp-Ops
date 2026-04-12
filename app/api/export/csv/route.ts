import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { dataType, data } = await req.json()

  if (!dataType || !data) {
    return NextResponse.json({ error: 'dataType and data are required' }, { status: 400 })
  }

  // Convert to CSV manually (server-side, no papaparse)
  function toCSV(rows: Record<string, unknown>[]): string {
    if (!rows.length) return ''
    const headers = Object.keys(rows[0])
    const escape = (val: unknown) => {
      const str = val === null || val === undefined ? '' : typeof val === 'object' ? JSON.stringify(val) : String(val)
      return `"${str.replace(/"/g, '""')}"`
    }
    const lines = [
      headers.join(','),
      ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
    ]
    return lines.join('\n')
  }

  const csv = toCSV(data as Record<string, unknown>[])
  const filename = `leenqup-${dataType}-${new Date().toISOString().split('T')[0]}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
