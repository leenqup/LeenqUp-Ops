'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'

// Auth routes that get the full-screen login experience (no sidebar)
const AUTH_PATHS = ['/login', '/forgot-password', '/reset-password', '/setup']

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = AUTH_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (isAuthPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1628] px-4">
        {children}
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-brand-cream dark:bg-[#0F1423]">
        {children}
      </main>
    </div>
  )
}
