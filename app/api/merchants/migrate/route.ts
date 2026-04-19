/**
 * POST /api/merchants/migrate
 *
 * One-time migration that reads the merchants JSON blob from the Supabase
 * kv_store table and upserts each record into the proper `merchants` table.
 *
 * Protected by X-Migrate-Secret header to prevent accidental re-runs.
 * Safe to run multiple times — uses upsert with onConflict: 'id'.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase, merchantToRow } from '@/lib/supabase'
import type { Merchant } from '@/types'

const MIGRATE_SECRET = process.env.MIGRATE_SECRET ?? 'leenqup-migrate-2026'

export async function POST(req: NextRequest) {
  // Basic protection against accidental runs
  const secret = req.headers.get('x-migrate-secret')
  if (secret !== MIGRATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Read merchants from kv_store
    const { data: kvRow, error: kvError } = await supabase
      .from('kv_store')
      .select('value')
      .eq('key', 'leenqup_merchants')
      .single()

    if (kvError || !kvRow) {
      return NextResponse.json({ error: 'No merchants found in kv_store' }, { status: 404 })
    }

    const merchants = kvRow.value as Merchant[]
    if (!Array.isArray(merchants) || merchants.length === 0) {
      return NextResponse.json({ migrated: 0, message: 'No merchants to migrate' })
    }

    // 2. Convert to snake_case rows
    const rows = merchants.map(merchantToRow)

    // 3. Batch upsert (Supabase supports up to 1000 rows per call)
    const BATCH = 200
    const errors: string[] = []
    let migrated = 0

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH)
      const { error } = await supabase
        .from('merchants')
        .upsert(batch, { onConflict: 'id' })
      if (error) {
        errors.push(`batch ${i}–${i + BATCH}: ${error.message}`)
      } else {
        migrated += batch.length
      }
    }

    return NextResponse.json({
      migrated,
      total: merchants.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Show current merchant count in the Supabase table (diagnostic)
  const { count, error } = await supabase
    .from('merchants')
    .select('*', { count: 'exact', head: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ merchantsInSupabase: count ?? 0 })
}
