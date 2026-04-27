import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/sidebar'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { SupabaseProvider } from '@/components/supabase-provider'
import { GlobalCommandPalette } from '@/components/global-command-palette'
import { AuthProvider } from '@/components/auth-provider'

export const metadata: Metadata = {
  title: 'LeenqUp Ops',
  description: 'LeenqUp operations dashboard — content, merchants, and marketing command center',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthProvider>
            <SupabaseProvider>
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-auto bg-brand-cream dark:bg-[#0F1423]">
                  {children}
                </main>
              </div>
            </SupabaseProvider>
          </AuthProvider>
          <GlobalCommandPalette />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
