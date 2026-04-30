'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { setCurrentUser } from '@/lib/storage'
import type { TeamRole } from '@/types'

interface AuthContextValue {
  user: User | null
  role: TeamRole | null
  isAdmin: boolean
  isEditor: boolean
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  isAdmin: false,
  isEditor: false,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }, [router])

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
      if (user?.email) {
        const name = (user.user_metadata?.name as string) || (user.user_metadata?.full_name as string) || ''
        setCurrentUser(user.email, name)
      }
    })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      setLoading(false)
      if (u?.email) {
        const name = (u.user_metadata?.name as string) || (u.user_metadata?.full_name as string) || ''
        setCurrentUser(u.email, name)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const role = (user?.user_metadata?.role as TeamRole) ?? null
  const isAdmin = role === 'admin'
  const isEditor = role === 'editor'

  return (
    <AuthContext.Provider value={{ user, role, isAdmin, isEditor, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
