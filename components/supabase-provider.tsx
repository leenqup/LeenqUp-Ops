'use client'

import { useEffect, useState } from 'react'
import { Zap, WifiOff, Loader2 } from 'lucide-react'
import { hydrateFromSupabase } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import { initializeStorage } from '@/lib/storage'

type SyncState = 'loading' | 'online' | 'offline'

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SyncState>('loading')
  const [hydrated, setHydrated] = useState(0)

  useEffect(() => {
    async function boot() {
      // 1. Hydrate from Supabase (pulls remote state into localStorage)
      const { hydrated: count } = await hydrateFromSupabase()
      setHydrated(count)

      // 2. Run local initialization (seeds if first time, runs migrations)
      initializeStorage()

      // 3. Check connection status
      const { error } = await supabase.from('kv_store').select('key').limit(1)
      setState(error ? 'offline' : 'online')
    }

    boot()
  }, [])

  // Subscribe to realtime updates from other team members
  useEffect(() => {
    if (state !== 'online') return

    const channel = supabase
      .channel('kv_store_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'kv_store' },
        (payload) => {
          // Another team member updated a key — apply it to our localStorage too
          const { key, value } = payload.new as { key: string; value: unknown }
          // Never overwrite settings or seeded from remote events
          const skipKeys = new Set(['leenqup_settings', 'leenqup_seeded'])
          if (!skipKeys.has(key)) {
            localStorage.setItem(key, JSON.stringify(value))
            // Dispatch a custom event so React components can re-render if needed
            window.dispatchEvent(new CustomEvent('leenqup_remote_update', { detail: { key } }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [state])

  // Show a brief loading splash while hydrating
  if (state === 'loading') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-brand-cream dark:bg-[#0F1423] z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 bg-coral rounded-2xl flex items-center justify-center shadow-lg">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Syncing team data…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Offline banner — shown when Supabase is unreachable */}
      {state === 'offline' && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-amber-500 text-white text-xs font-semibold py-1.5 px-4">
          <WifiOff className="h-3.5 w-3.5" />
          Working offline — changes will sync when connection is restored
        </div>
      )}
      {children}
    </>
  )
}
