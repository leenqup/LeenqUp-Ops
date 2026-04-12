'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Toast = { id: string; message: string; type: 'success' | 'error' | 'info' }

let toastListeners: ((t: Toast) => void)[] = []

export function toast(message: string, type: Toast['type'] = 'success') {
  const id = Math.random().toString(36).slice(2)
  toastListeners.forEach(fn => fn({ id, message, type }))
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (t: Toast) => {
      setToasts(prev => [...prev, t])
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3500)
    }
    toastListeners.push(listener)
    return () => { toastListeners = toastListeners.filter(l => l !== listener) }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium text-white',
            t.type === 'success' && 'bg-brand-green',
            t.type === 'error' && 'bg-red-500',
            t.type === 'info' && 'bg-navy',
          )}
        >
          <span className="flex-1">{t.message}</span>
          <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>
            <X className="h-4 w-4 opacity-70" />
          </button>
        </div>
      ))}
    </div>
  )
}
