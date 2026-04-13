'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { getSettings, saveSettings } from '@/lib/storage'

function AcceptContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [step, setStep] = useState<'loading' | 'valid' | 'invalid' | 'accepting' | 'done' | 'error'>('loading')
  const [member, setMember] = useState<{ id: string; email: string; name: string; role: string } | null>(null)
  const [inputName, setInputName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) { setStep('invalid'); return }
    fetch(`/api/team/accept?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) { setMember(data.member); setInputName(data.member.name); setStep('valid') }
        else { setErrorMsg(data.error ?? 'Invalid invite'); setStep('invalid') }
      })
      .catch(() => { setErrorMsg('Could not reach server'); setStep('invalid') })
  }, [token])

  const handleAccept = async () => {
    if (!inputName.trim()) return
    setStep('accepting')
    try {
      const res = await fetch('/api/team/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (data.success) {
        // Save identity to local settings (device-local, never synced)
        const settings = getSettings()
        saveSettings({
          ...settings,
          teamMemberEmail: data.member.email,
          teamMemberName: inputName.trim(),
          teamMemberRole: data.member.role,
          teamInviteToken: token,
        })
        setMember(data.member)
        setStep('done')
      } else {
        setErrorMsg(data.error ?? 'Failed to accept')
        setStep('error')
      }
    } catch {
      setErrorMsg('Network error')
      setStep('error')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 bg-coral rounded-xl flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-navy dark:text-white">LeenqUp</span>
          <span className="text-sm text-slate-400 font-medium">Ops</span>
        </div>

        <Card>
          <CardContent className="pt-8 pb-8 px-8">
            {step === 'loading' && (
              <div className="text-center">
                <Loader2 className="h-8 w-8 text-coral animate-spin mx-auto mb-3" />
                <p className="text-slate-500">Validating invite…</p>
              </div>
            )}

            {step === 'valid' && member && (
              <div>
                <h1 className="text-xl font-bold text-navy dark:text-white mb-1">You're invited!</h1>
                <p className="text-sm text-slate-500 mb-6">
                  Join LeenqUp Ops as <strong className="text-navy dark:text-white capitalize">{member.role}</strong>
                </p>
                <div className="space-y-4">
                  <div>
                    <Label>Your name</Label>
                    <Input
                      value={inputName}
                      onChange={e => setInputName(e.target.value)}
                      placeholder="How should we call you?"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={member.email} disabled className="mt-1 opacity-60" />
                  </div>
                  <Button onClick={handleAccept} className="w-full bg-coral hover:bg-coral/90 text-white" disabled={!inputName.trim()}>
                    Accept invitation
                  </Button>
                </div>
              </div>
            )}

            {step === 'accepting' && (
              <div className="text-center">
                <Loader2 className="h-8 w-8 text-coral animate-spin mx-auto mb-3" />
                <p className="text-slate-500">Setting up your access…</p>
              </div>
            )}

            {step === 'done' && (
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 text-brand-green mx-auto mb-4" />
                <h2 className="text-lg font-bold text-navy dark:text-white mb-2">Welcome to the team!</h2>
                <p className="text-sm text-slate-500 mb-6">
                  You're set up as <strong className="capitalize">{member?.role}</strong>. Your identity is saved to this device.
                </p>
                <Button onClick={() => router.push('/')} className="bg-coral hover:bg-coral/90 text-white">
                  Go to dashboard
                </Button>
              </div>
            )}

            {(step === 'invalid' || step === 'error') && (
              <div className="text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-navy dark:text-white mb-2">Invalid invitation</h2>
                <p className="text-sm text-slate-500 mb-6">{errorMsg || 'This invite link is invalid or has expired.'}</p>
                <Button variant="secondary" onClick={() => router.push('/')}>Go to homepage</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AcceptPage() {
  return (
    <Suspense>
      <AcceptContent />
    </Suspense>
  )
}
