'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, Loader2, Eye, EyeOff, CheckCircle2, ShieldAlert, ArrowLeft } from 'lucide-react'

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

type SetupState = 'checking' | 'ready' | 'done' | 'already-exists' | 'env-error'

export default function SetupPage() {
  const router = useRouter()

  const [setupState, setSetupState] = useState<SetupState>('checking')
  const [adminEmail, setAdminEmail] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const strength = passwordStrength(password)

  // Check if setup is still needed
  useEffect(() => {
    fetch('/api/auth/setup')
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setSetupState('env-error')
          setError(data.error)
          return
        }
        setAdminEmail(data.adminEmail ?? '')
        setEmail(data.adminEmail ?? '')
        if (!data.setupNeeded) {
          setSetupState('already-exists')
        } else {
          setSetupState('ready')
        }
      })
      .catch(() => {
        setSetupState('env-error')
        setError('Could not reach the setup API.')
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok || data.error) {
      setError(data.error ?? 'Something went wrong.')
      if (res.status === 409) setSetupState('already-exists')
      return
    }

    setSetupState('done')
    setTimeout(() => router.push('/login'), 2000)
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

        {/* Checking */}
        {setupState === 'checking' && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
          </div>
        )}

        {/* Env error */}
        {setupState === 'env-error' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg p-3">
              <ShieldAlert className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 mb-1">Setup unavailable</p>
                <p className="text-xs text-red-600">{error}</p>
                <p className="text-xs text-red-500 mt-2">
                  Make sure <code className="bg-red-100 px-1 rounded">ADMIN_EMAIL</code> and{' '}
                  <code className="bg-red-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code>{' '}
                  are set in your Vercel environment variables.
                </p>
              </div>
            </div>
            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#E5573D]">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </Link>
          </div>
        )}

        {/* Already exists */}
        {setupState === 'already-exists' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-lg p-3">
              <ShieldAlert className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-700 mb-1">Admin account already exists</p>
                <p className="text-xs text-amber-600">
                  An account for <strong>{adminEmail}</strong> is already set up.
                  Please sign in instead.
                </p>
              </div>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-[#E5573D] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Go to sign in
            </Link>
          </div>
        )}

        {/* Success */}
        {setupState === 'done' && (
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <div>
              <h2 className="font-semibold text-slate-800 mb-1">Account created!</h2>
              <p className="text-sm text-slate-500">Taking you to sign in…</p>
            </div>
          </div>
        )}

        {/* Setup form */}
        {setupState === 'ready' && (
          <>
            <div className="mb-5">
              <h1 className="text-[15px] font-semibold text-slate-800 mb-1">Create your admin account</h1>
              <p className="text-sm text-slate-500">
                This is a one-time setup. Only the designated admin email can use this page.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email — pre-filled, locked */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Admin email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E5573D]/30 focus:border-[#E5573D] transition-colors bg-slate-50"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="pw" className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Password
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

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full flex items-center justify-center gap-2 bg-[#E5573D] hover:bg-[#d04c34] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors mt-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create account & sign in
              </button>
            </form>

            <div className="mt-5 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#E5573D] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
