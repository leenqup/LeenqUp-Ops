'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Home,
  FileText,
  MessageSquare,
  Mail,
  Megaphone,
  ClipboardList,
  Palette,
  Users,
  Settings,
  Menu,
  X,
  Zap,
  Circle,
  TrendingUp,
  LayoutGrid,
  Sun,
  DollarSign,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSettings } from '@/lib/storage'

const navSections = [
  {
    label: null,
    items: [
      { href: '/', label: 'Home', icon: Home },
      { href: '/today', label: 'Today', icon: Sun },
      { href: '/guide', label: 'Employee Guide', icon: BookOpen },
    ],
  },
  {
    label: 'CONTENT',
    items: [
      { href: '/posts', label: 'Posts', icon: FileText },
      { href: '/scripts', label: 'Scripts', icon: MessageSquare },
      { href: '/sequences', label: 'Sequences', icon: Mail },
      { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { href: '/sops', label: 'SOPs', icon: ClipboardList },
      { href: '/brand', label: 'Brand', icon: Palette },
      { href: '/finance', label: 'Finance', icon: DollarSign },
    ],
  },
  {
    label: 'COMMERCE',
    items: [
      { href: '/merchants', label: 'Merchants', icon: Users },
      { href: '/crm', label: 'CRM Pipeline', icon: TrendingUp },
      { href: '/projects', label: 'Projects', icon: LayoutGrid },
    ],
  },
]

function ConnectionDot({ connected }: { connected: boolean }) {
  return (
    <Circle
      className={cn('h-2 w-2 fill-current', connected ? 'text-brand-green' : 'text-gray-400')}
    />
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [connections, setConnections] = useState({ buffer: false, brevo: false, notion: false })

  useEffect(() => {
    const s = getSettings()
    setConnections({
      buffer: !!s.bufferAccessToken,
      brevo: !!s.brevoApiKey,
      notion: !!s.notionToken,
    })
  }, [])

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-navy-500 text-white">
      {/* Wordmark */}
      <div className="px-6 py-5 border-b border-navy-600">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-coral rounded-lg flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white">LeenqUp</span>
            <span className="text-xs text-slate-300 ml-1 font-medium">Ops</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {navSections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.label && (
              <p className="text-[10px] font-semibold text-slate-400 tracking-widest px-3 pt-3 pb-1">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-coral text-white'
                        : 'text-slate-200 hover:bg-navy-600 hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Connection Status */}
      <div className="px-4 py-3 mx-3 mb-2 bg-navy-600 rounded-lg">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Integrations</p>
        <div className="space-y-1.5">
          {[
            { label: 'Buffer', connected: connections.buffer },
            { label: 'Brevo', connected: connections.brevo },
            { label: 'Notion', connected: connections.notion },
          ].map(({ label, connected }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-slate-300">{label}</span>
              <div className="flex items-center gap-1.5">
                <ConnectionDot connected={connected} />
                <span className={cn('text-xs', connected ? 'text-brand-green' : 'text-gray-400')}>
                  {connected ? 'Ready' : 'Not set'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="px-3 py-3 border-t border-navy-600">
        <Link
          href="/settings"
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
            pathname === '/settings'
              ? 'bg-coral text-white'
              : 'text-slate-200 hover:bg-navy-600 hover:text-white'
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-navy rounded-lg text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={cn(
        'lg:hidden fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 flex-shrink-0">
        <div className="w-full">
          <SidebarContent />
        </div>
      </div>
    </>
  )
}
