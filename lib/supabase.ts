import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton client — reused across the app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 10 } },
})

// ─── KV Store helpers ─────────────────────────────────────────────────────────
// Each localStorage key maps to one row: { key, value (JSONB), updated_at }

export async function kvGet(key: string): Promise<unknown | null> {
  const { data, error } = await supabase
    .from('kv_store')
    .select('value')
    .eq('key', key)
    .single()
  if (error || !data) return null
  return data.value
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  const { error } = await supabase
    .from('kv_store')
    .upsert({ key, value }, { onConflict: 'key' })
  if (error) throw new Error(`kvSet(${key}): ${error.message}`)
}

export async function kvGetAll(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('kv_store')
    .select('key, value')
  if (error || !data) return {}
  return Object.fromEntries(data.map(row => [row.key, row.value]))
}

export async function kvSetBatch(
  entries: Record<string, unknown>
): Promise<{ succeeded: number; failed: string[] }> {
  const failed: string[] = []
  let succeeded = 0
  for (const [key, value] of Object.entries(entries)) {
    try {
      await kvSet(key, value)
      succeeded++
    } catch {
      failed.push(key)
    }
  }
  return { succeeded, failed }
}
