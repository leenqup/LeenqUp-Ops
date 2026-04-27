'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getMerchants } from '@/lib/storage'

// Static label map — path segment → display label
const SEGMENT_LABELS: Record<string, string> = {
  posts: 'Posts',
  scripts: 'Scripts',
  sequences: 'Sequences',
  campaigns: 'Campaigns',
  brand: 'Brand Voice',
  sops: 'SOPs',
  finance: 'Finance',
  calendar: 'Calendar',
  reports: 'Reports',
  feed: 'Activity Feed',
  merchants: 'Merchants',
  crm: 'CRM Pipeline',
  accounts: 'Accounts',
  projects: 'Projects',
  intelligence: 'Market Intel',
  analytics: 'Analytics',
  goals: 'Goals & OKRs',
  digest: 'Weekly Digest',
  team: 'Team',
  settings: 'Settings',
  today: 'Today',
  guide: 'Employee Guide',
}

interface Crumb {
  label: string
  href: string
}

export function Breadcrumb() {
  const pathname = usePathname()
  const [crumbs, setCrumbs] = useState<Crumb[]>([])

  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length === 0) return // Home page — no breadcrumb needed

    const built: Crumb[] = []
    let accumulated = ''

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      accumulated += `/${seg}`

      const staticLabel = SEGMENT_LABELS[seg]

      if (staticLabel) {
        built.push({ label: staticLabel, href: accumulated })
      } else {
        // Dynamic segment (e.g. merchant ID) — try to resolve name from storage
        const parentSeg = segments[i - 1]
        if (parentSeg === 'merchants') {
          try {
            const merchants = getMerchants()
            const m = merchants.find(m => m.id === seg)
            built.push({ label: m?.name ?? seg, href: accumulated })
          } catch {
            built.push({ label: seg, href: accumulated })
          }
        } else if (parentSeg === 'projects') {
          built.push({ label: 'Project Detail', href: accumulated })
        } else {
          built.push({ label: seg, href: accumulated })
        }
      }
    }

    setCrumbs(built)
  }, [pathname])

  if (crumbs.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-slate-400 mb-1">
      <Link href="/" className="flex items-center hover:text-slate-600 transition-colors">
        <Home className="h-3 w-3" />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 flex-shrink-0" />
          {i === crumbs.length - 1 ? (
            <span className="text-slate-600 font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-slate-600 transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
