import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { SupabaseProvider } from '@/components/supabase-provider'
import { GlobalCommandPalette } from '@/components/global-command-palette'
import { AuthProvider } from '@/components/auth-provider'
import { AppShell } from '@/components/app-shell'

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
              <AppShell>
                {children}
              </AppShell>
            </SupabaseProvider>
          </AuthProvider>
          <GlobalCommandPalette />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
