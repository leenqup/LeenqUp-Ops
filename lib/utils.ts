import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function getCharLimit(platform: string): number {
  const limits: Record<string, number> = {
    twitter: 280,
    instagram: 2200,
    facebook: 63206,
    linkedin: 3000,
    whatsapp: 1000,
  }
  return limits[platform] ?? 2200
}

export function getCharStatus(count: number, platform: string): 'green' | 'amber' | 'red' {
  const limit = getCharLimit(platform)
  if (count > limit) return 'red'
  if (count > limit * 0.85) return 'amber'
  return 'green'
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}
