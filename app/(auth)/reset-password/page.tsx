'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Zap, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function passwordStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: '', color: '', width: '0%' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { label: 'Weak', color: 'bg-red-400', width: '25%' }
  if (score <= 2) return { label: 'Fair', color: 'bg-amber-400', width: '50%' }
  if (score <= 3) return { label: 'Good', color: 'bg-blue-400', width: '75%' }
  return { label: 'Strong', color: 'bg-emerald-500', width: '100%' }
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') ?? 'reset' // 'reset' | 'invite'

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const strength = passwordStrength(password)
  const isInvite = mode === 'invite'
  const heading = isInvite ? 'Set your password' : 'Choose a new password'
  const subheading = isInvite
    ? 'Create a password to activate your account.'
    : 'Enter a new password for your account.'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/'), 1500)
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
        <div>
          <h2 className="font-semibold text-slate-800 mb-1">Password set!</h2>
          <p className="text-sm text-slate-500">Taking you to the dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 bg-[#E5573D] rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div className="leading-none">
            <span className="text-xl font-bold tracking-tight text-[#0B1628]">LeenqUp</span>
            <span className="text-sm text-slate-400 ml-1.5 font-medium">Ops</span>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-[15px] font-semibold text-slate-800 mb-1">{heading}</h1>
          <p className="text-sm text-slate-500">{subheading}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New password */}
          <div className="space-y-1.5">
            <label htmlFor="pw" className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              New password
            </label>
            <div className="relative">
              <input
                id="pw"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E5573D]/30 focus:border-[#E5573D] transition-colors"
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Strength bar */}
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: strength.width }}
                  />
                </div>
                <p className={`text-xs ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <label htmlFor="confirm" className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E5573D]/30 focus:border-[#E5573D] transition-colors"
              placeholder="Repeat password"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="w-full flex items-center justify-center gap-2 bg-[#E5573D] hover:bg-[#d04c34] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors mt-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isInvite ? 'Activate account' : 'Set new password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
