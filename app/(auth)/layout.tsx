import type { Metadata } from 'next'
import '../globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'LeenqUp Ops — Sign In',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-[#0B1628] px-4">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  )
}
