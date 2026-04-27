'use client'

import { Lock } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import type { TeamRole } from '@/types'

interface RoleGateProps {
  /** Roles that ARE allowed to see the children */
  roles: TeamRole[]
  children: React.ReactNode
  /** What to show instead (default: nothing) */
  fallback?: React.ReactNode
}

/**
 * Hides children from users whose role is not in the `roles` list.
 * Use for action buttons, forms, and other interactive elements.
 *
 * Example:
 *   <RoleGate roles={['admin', 'editor']}>
 *     <Button>Add Merchant</Button>
 *   </RoleGate>
 */
export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const { role, loading } = useAuth()
  if (loading) return null
  if (!role || !roles.includes(role)) return <>{fallback}</>
  return <>{children}</>
}

/**
 * Full-page access restricted card.
 * Drop at the top of pages that are completely blocked for certain roles.
 */
export function AccessRestricted({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
        <Lock className="h-6 w-6 text-slate-400" />
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-700">Access Restricted</h2>
        <p className="text-sm text-slate-500 max-w-xs">
          {message ?? "Your current role doesn't have permission to view this page."}
        </p>
      </div>
    </div>
  )
}
