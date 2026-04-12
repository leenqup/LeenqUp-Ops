'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  Eye,
  EyeOff,
  Rss,
  Mail,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Sun,
  Moon,
  RotateCcw,
  AlertTriangle,
  Bell,
  Webhook,
  Download,
  Upload,
  DatabaseBackup,
  Cloud,
  CloudDownload,
  CloudUpload,
  Wifi,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import {
  getSettings,
  saveSettings,
  resetSection,
  getPosts,
  getScripts,
  getSequences,
  getCampaigns,
  getSOPs,
  getBrandResponses,
  getMerchants,
  exportAllData,
  importAllData,
  pushLocalToSupabase,
  hydrateFromSupabase,
} from '@/lib/storage'
import type { AppSettings } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type TestStatus = 'idle' | 'loading' | 'success' | 'error'

interface BufferProfile {
  id: string
  name: string
  service: string
}

interface BufferTestResult {
  profiles?: BufferProfile[]
}

interface BrevoTestResult {
  email?: string
  plan?: string
}

interface NotionTestResult {
  title?: string
  pageCount?: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'connected' | 'disconnected' | 'unknown' }) {
  if (status === 'connected') return <Badge variant="success">Connected</Badge>
  if (status === 'disconnected') return <Badge variant="danger">Disconnected</Badge>
  return <Badge variant="secondary">Not configured</Badge>
}

function TestResultMessage({ status, message }: { status: TestStatus; message: string }) {
  if (status === 'idle') return null
  if (status === 'loading') return (
    <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
      <Loader2 className="h-4 w-4 animate-spin" /> Testing connection...
    </div>
  )
  if (status === 'success') return (
    <div className="flex items-start gap-2 text-sm text-brand-green mt-2">
      <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  )
  return (
    <div className="flex items-start gap-2 text-sm text-red-500 mt-2">
      <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  )
}

function PasswordInput({ value, onChange, placeholder }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

// ─── Buffer Integration Card ──────────────────────────────────────────────────

function BufferCard({ settings, onSettingsChange }: {
  settings: AppSettings
  onSettingsChange: (s: AppSettings) => void
}) {
  const [token, setToken] = useState(settings.bufferAccessToken ?? '')
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [profiles, setProfiles] = useState<BufferProfile[]>([])
  const connectionStatus = settings.bufferAccessToken ? (testStatus === 'success' ? 'connected' : 'unknown') : 'disconnected'

  useEffect(() => {
    setToken(settings.bufferAccessToken ?? '')
  }, [settings.bufferAccessToken])

  const handleSave = () => {
    const updated = { ...settings, bufferAccessToken: token }
    saveSettings(updated)
    onSettingsChange(updated)
    toast('Buffer settings saved')
    setTestStatus('idle')
    setProfiles([])
  }

  const handleClear = () => {
    setToken('')
    const updated = { ...settings, bufferAccessToken: undefined }
    saveSettings(updated)
    onSettingsChange(updated)
    setTestStatus('idle')
    setTestMessage('')
    setProfiles([])
    toast('Buffer token cleared')
  }

  const handleTest = async () => {
    if (!token.trim()) { toast('Enter an access token first', 'error'); return }
    setTestStatus('loading')
    setProfiles([])
    try {
      const res = await fetch('/api/buffer/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token }),
      })
      const data: { success: boolean; message?: string } & BufferTestResult = await res.json()
      if (data.success) {
        setTestStatus('success')
        setProfiles(data.profiles ?? [])
        setTestMessage(data.profiles?.length
          ? `Connected! Found ${data.profiles.length} channel${data.profiles.length !== 1 ? 's' : ''}.`
          : 'Connected successfully.')
      } else {
        setTestStatus('error')
        setTestMessage(data.message ?? 'Connection failed. Check your token.')
      }
    } catch {
      setTestStatus('error')
      setTestMessage('Network error. Could not reach Buffer API.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#168eea]/10 flex items-center justify-center">
              <Rss className="h-5 w-5 text-[#168eea]" />
            </div>
            <div>
              <CardTitle>Buffer</CardTitle>
              <CardDescription>Social media scheduling</CardDescription>
            </div>
          </div>
          <StatusBadge status={connectionStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Access Token</Label>
          <div className="mt-1">
            <PasswordInput value={token} onChange={setToken} placeholder="Your Buffer access token" />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
            Find your Buffer access token at{' '}
            <a href="https://buffer.com" target="_blank" rel="noopener noreferrer" className="text-coral hover:underline">buffer.com</a>
            {' '}→ Settings → Apps &amp; API → Your Access Token
          </p>
        </div>

        <TestResultMessage status={testStatus} message={testMessage} />

        {profiles.length > 0 && (
          <div className="rounded-lg border border-gray-100 dark:border-navy-500 divide-y divide-gray-100 dark:divide-navy-500 overflow-hidden">
            {profiles.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2">
                <div className="h-2 w-2 rounded-full bg-brand-green shrink-0" />
                <span className="text-sm font-medium text-navy dark:text-white">{p.name}</span>
                <Badge variant="secondary" className="ml-auto text-xs">{p.service}</Badge>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="secondary" onClick={handleTest} disabled={testStatus === 'loading'}>
            {testStatus === 'loading' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Test Connection
          </Button>
          <Button size="sm" onClick={handleSave}>Save</Button>
          <Button size="sm" variant="ghost" onClick={handleClear} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10">Clear</Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Brevo Integration Card ───────────────────────────────────────────────────

function BrevoCard({ settings, onSettingsChange }: {
  settings: AppSettings
  onSettingsChange: (s: AppSettings) => void
}) {
  const [apiKey, setApiKey] = useState(settings.brevoApiKey ?? '')
  const [senderEmail, setSenderEmail] = useState(settings.brevoSenderEmail ?? '')
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testMessage, setTestMessage] = useState('')
  const connectionStatus = settings.brevoApiKey ? (testStatus === 'success' ? 'connected' : 'unknown') : 'disconnected'

  useEffect(() => {
    setApiKey(settings.brevoApiKey ?? '')
    setSenderEmail(settings.brevoSenderEmail ?? '')
  }, [settings.brevoApiKey, settings.brevoSenderEmail])

  const handleSave = () => {
    const updated = { ...settings, brevoApiKey: apiKey, brevoSenderEmail: senderEmail }
    saveSettings(updated)
    onSettingsChange(updated)
    toast('Brevo settings saved')
    setTestStatus('idle')
  }

  const handleClear = () => {
    setApiKey('')
    setSenderEmail('')
    const updated = { ...settings, brevoApiKey: undefined, brevoSenderEmail: undefined }
    saveSettings(updated)
    onSettingsChange(updated)
    setTestStatus('idle')
    setTestMessage('')
    toast('Brevo settings cleared')
  }

  const handleTest = async () => {
    if (!apiKey.trim()) { toast('Enter an API key first', 'error'); return }
    setTestStatus('loading')
    try {
      const res = await fetch('/api/brevo/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      })
      const data: { success: boolean; message?: string } & BrevoTestResult = await res.json()
      if (data.success) {
        setTestStatus('success')
        const info = [data.email, data.plan].filter(Boolean).join(' · ')
        setTestMessage(`Connected! ${info || 'Account verified.'}`)
      } else {
        setTestStatus('error')
        setTestMessage(data.message ?? 'Connection failed. Check your API key.')
      }
    } catch {
      setTestStatus('error')
      setTestMessage('Network error. Could not reach Brevo API.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#0B996E]/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-[#0B996E]" />
            </div>
            <div>
              <CardTitle>Brevo</CardTitle>
              <CardDescription>Email marketing &amp; sequences</CardDescription>
            </div>
          </div>
          <StatusBadge status={connectionStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>API Key</Label>
          <div className="mt-1">
            <PasswordInput value={apiKey} onChange={setApiKey} placeholder="Your Brevo v3 API key" />
          </div>
        </div>
        <div>
          <Label>Sender Email</Label>
          <Input
            type="email"
            value={senderEmail}
            onChange={e => setSenderEmail(e.target.value)}
            placeholder="noreply@yourdomain.com"
            className="mt-1"
          />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
            Find your Brevo API key at{' '}
            <a href="https://app.brevo.com" target="_blank" rel="noopener noreferrer" className="text-coral hover:underline">app.brevo.com</a>
            {' '}→ Settings → API Keys → Create a v3 API Key
          </p>
        </div>

        <TestResultMessage status={testStatus} message={testMessage} />

        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="secondary" onClick={handleTest} disabled={testStatus === 'loading'}>
            {testStatus === 'loading' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Test Connection
          </Button>
          <Button size="sm" onClick={handleSave}>Save</Button>
          <Button size="sm" variant="ghost" onClick={handleClear} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10">Clear</Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Notion Integration Card ──────────────────────────────────────────────────

function NotionCard({ settings, onSettingsChange }: {
  settings: AppSettings
  onSettingsChange: (s: AppSettings) => void
}) {
  const [token, setToken] = useState(settings.notionToken ?? '')
  const [databaseId, setDatabaseId] = useState(settings.notionDatabaseId ?? '')
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [dbTitle, setDbTitle] = useState('')
  const [pageCount, setPageCount] = useState<number | null>(null)
  const connectionStatus = settings.notionToken ? (testStatus === 'success' ? 'connected' : 'unknown') : 'disconnected'

  useEffect(() => {
    setToken(settings.notionToken ?? '')
    setDatabaseId(settings.notionDatabaseId ?? '')
  }, [settings.notionToken, settings.notionDatabaseId])

  const handleSave = () => {
    const updated = { ...settings, notionToken: token, notionDatabaseId: databaseId }
    saveSettings(updated)
    onSettingsChange(updated)
    toast('Notion settings saved')
    setTestStatus('idle')
    setDbTitle('')
    setPageCount(null)
  }

  const handleClear = () => {
    setToken('')
    setDatabaseId('')
    const updated = { ...settings, notionToken: undefined, notionDatabaseId: undefined }
    saveSettings(updated)
    onSettingsChange(updated)
    setTestStatus('idle')
    setTestMessage('')
    setDbTitle('')
    setPageCount(null)
    toast('Notion settings cleared')
  }

  const handleTest = async () => {
    if (!token.trim()) { toast('Enter an integration token first', 'error'); return }
    setTestStatus('loading')
    setDbTitle('')
    setPageCount(null)
    try {
      const res = await fetch('/api/notion/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, databaseId }),
      })
      const data: { success: boolean; message?: string } & NotionTestResult = await res.json()
      if (data.success) {
        setTestStatus('success')
        setDbTitle(data.title ?? '')
        setPageCount(data.pageCount ?? null)
        const info = data.title ? `Database: "${data.title}"` : 'Connected successfully.'
        const count = data.pageCount !== undefined ? ` · ${data.pageCount} pages` : ''
        setTestMessage(info + count)
      } else {
        setTestStatus('error')
        setTestMessage(data.message ?? 'Connection failed. Check your token and database ID.')
      }
    } catch {
      setTestStatus('error')
      setTestMessage('Network error. Could not reach Notion API.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <FileText className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <CardTitle>Notion</CardTitle>
              <CardDescription>Merchant database sync</CardDescription>
            </div>
          </div>
          <StatusBadge status={connectionStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Integration Token</Label>
          <div className="mt-1">
            <PasswordInput value={token} onChange={setToken} placeholder="secret_..." />
          </div>
        </div>
        <div>
          <Label>Database ID</Label>
          <Input
            value={databaseId}
            onChange={e => setDatabaseId(e.target.value)}
            placeholder="32-character database ID from URL"
            className="mt-1"
          />
        </div>
        <div className="rounded-lg bg-blue-50 dark:bg-navy-500/50 p-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
          <p className="font-medium text-navy dark:text-white">Setup instructions</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to <a href="https://notion.so" target="_blank" rel="noopener noreferrer" className="text-coral hover:underline">notion.so</a> → Settings → Integrations → Create New Integration → copy the Internal Integration Token.</li>
            <li>Open the Notion database you want to sync merchants to → click <code className="bg-white/50 dark:bg-navy-600/50 px-1 rounded">···</code> menu → Add connections → select your integration.</li>
            <li>Copy the database ID from the URL (it&apos;s the 32-character string before the <code className="bg-white/50 dark:bg-navy-600/50 px-1 rounded">?</code>).</li>
          </ol>
        </div>

        <TestResultMessage status={testStatus} message={testMessage} />

        {testStatus === 'success' && (dbTitle || pageCount !== null) && (
          <div className="rounded-lg border border-gray-100 dark:border-navy-500 p-3 bg-gray-50 dark:bg-navy-500/30">
            {dbTitle && <p className="text-sm font-medium text-navy dark:text-white">{dbTitle}</p>}
            {pageCount !== null && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{pageCount} pages in database</p>}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="secondary" onClick={handleTest} disabled={testStatus === 'loading'}>
            {testStatus === 'loading' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Test Connection
          </Button>
          <Button size="sm" onClick={handleSave}>Save</Button>
          <Button size="sm" variant="ghost" onClick={handleClear} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10">Clear</Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Slack Notifications Card ─────────────────────────────────────────────────

function SlackCard({ settings, onSettingsChange }: {
  settings: AppSettings
  onSettingsChange: (s: AppSettings) => void
}) {
  const [webhookUrl, setWebhookUrl] = useState(settings.slackWebhookUrl ?? '')
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testMessage, setTestMessage] = useState('')
  const connectionStatus = settings.slackWebhookUrl ? (testStatus === 'success' ? 'connected' : 'unknown') : 'disconnected'

  useEffect(() => {
    setWebhookUrl(settings.slackWebhookUrl ?? '')
  }, [settings.slackWebhookUrl])

  const handleSave = () => {
    const updated = { ...settings, slackWebhookUrl: webhookUrl.trim() || undefined }
    saveSettings(updated)
    onSettingsChange(updated)
    toast('Slack settings saved')
    setTestStatus('idle')
  }

  const handleClear = () => {
    setWebhookUrl('')
    const updated = { ...settings, slackWebhookUrl: undefined }
    saveSettings(updated)
    onSettingsChange(updated)
    setTestStatus('idle')
    setTestMessage('')
    toast('Slack webhook cleared')
  }

  const handleTest = async () => {
    if (!webhookUrl.trim()) { toast('Enter a webhook URL first', 'error'); return }
    setTestStatus('loading')
    try {
      const res = await fetch('/api/notify/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: webhookUrl.trim(),
          message: '🧪 LeenqUp Ops connection test — Slack integration is working!',
        }),
      })
      const data: { success?: boolean; error?: string } = await res.json()
      if (data.success) {
        setTestStatus('success')
        setTestMessage('Test message sent to Slack successfully!')
      } else {
        setTestStatus('error')
        setTestMessage(data.error ?? 'Failed to send test message.')
      }
    } catch {
      setTestStatus('error')
      setTestMessage('Network error. Could not reach the Slack webhook.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#4A154B]/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-[#4A154B]" />
            </div>
            <div>
              <CardTitle>Slack Notifications</CardTitle>
              <CardDescription>Send alerts to a Slack channel</CardDescription>
            </div>
          </div>
          <StatusBadge status={connectionStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Webhook URL</Label>
          <Input
            type="text"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            className="mt-1"
          />
        </div>
        <div className="rounded-lg bg-blue-50 dark:bg-navy-500/50 p-3 text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <p className="font-medium text-navy dark:text-white">Setup instructions</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-coral hover:underline">api.slack.com/apps</a> → Create New App</li>
            <li>Add Incoming Webhooks → Activate Incoming Webhooks</li>
            <li>Click &ldquo;Add New Webhook to Workspace&rdquo; → select a channel → copy the webhook URL</li>
          </ol>
        </div>

        <TestResultMessage status={testStatus} message={testMessage} />

        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="secondary" onClick={handleTest} disabled={testStatus === 'loading'}>
            {testStatus === 'loading' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Test Connection
          </Button>
          <Button size="sm" onClick={handleSave}>Save</Button>
          <Button size="sm" variant="ghost" onClick={handleClear} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10">Clear</Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Make.com / Zapier Webhooks Card ──────────────────────────────────────────

function MakeWebhookCard({ settings, onSettingsChange }: {
  settings: AppSettings
  onSettingsChange: (s: AppSettings) => void
}) {
  const [webhookUrl, setWebhookUrl] = useState(settings.makeWebhookUrl ?? '')
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testMessage, setTestMessage] = useState('')
  const connectionStatus = settings.makeWebhookUrl ? (testStatus === 'success' ? 'connected' : 'unknown') : 'disconnected'

  useEffect(() => {
    setWebhookUrl(settings.makeWebhookUrl ?? '')
  }, [settings.makeWebhookUrl])

  const handleSave = () => {
    const updated = { ...settings, makeWebhookUrl: webhookUrl.trim() || undefined }
    saveSettings(updated)
    onSettingsChange(updated)
    toast('Make.com / Zapier webhook saved')
    setTestStatus('idle')
  }

  const handleClear = () => {
    setWebhookUrl('')
    const updated = { ...settings, makeWebhookUrl: undefined }
    saveSettings(updated)
    onSettingsChange(updated)
    setTestStatus('idle')
    setTestMessage('')
    toast('Make.com webhook cleared')
  }

  const handleTest = async () => {
    if (!webhookUrl.trim()) { toast('Enter a webhook URL first', 'error'); return }
    setTestStatus('loading')
    try {
      const res = await fetch('/api/webhooks/merchant-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: webhookUrl.trim(),
          merchantName: 'Test Merchant',
          oldStatus: 'not-contacted',
          newStatus: 'contacted',
        }),
      })
      const data: { success?: boolean; status?: number; error?: string } = await res.json()
      if (data.success) {
        setTestStatus('success')
        setTestMessage(`Test payload delivered (HTTP ${data.status}).`)
      } else {
        setTestStatus('error')
        setTestMessage(data.error ?? 'Failed to deliver test payload.')
      }
    } catch {
      setTestStatus('error')
      setTestMessage('Network error. Could not deliver webhook.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
              <Webhook className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Make.com / Zapier Webhooks</CardTitle>
              <CardDescription>Trigger automations on merchant updates</CardDescription>
            </div>
          </div>
          <StatusBadge status={connectionStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Webhook URL</Label>
          <Input
            type="text"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://hook.eu1.make.com/... or https://hooks.zapier.com/..."
            className="mt-1"
          />
        </div>
        <div className="rounded-lg bg-blue-50 dark:bg-navy-500/50 p-3 text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <p className="font-medium text-navy dark:text-white">Setup instructions</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Make.com:</strong> Create a scenario → add a Webhooks module → Custom webhook → copy the URL.</li>
            <li><strong>Zapier:</strong> Create a Zap → Trigger: Webhooks by Zapier → Catch Hook → copy the URL.</li>
          </ul>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
          When a merchant&apos;s status changes in the CRM, a POST is automatically sent to this URL with the merchant name, old status, and new status.
        </p>

        <TestResultMessage status={testStatus} message={testMessage} />

        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="secondary" onClick={handleTest} disabled={testStatus === 'loading'}>
            {testStatus === 'loading' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Test Connection
          </Button>
          <Button size="sm" onClick={handleSave}>Save</Button>
          <Button size="sm" variant="ghost" onClick={handleClear} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10">Clear</Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Backup / Restore Card ────────────────────────────────────────────────────

function BackupRestoreCard() {
  const [importing, setImporting] = useState(false)
  const [confirmImport, setConfirmImport] = useState(false)
  const [pendingFile, setPendingFile] = useState<Record<string, unknown> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const snapshot = exportAllData()
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const date = new Date().toISOString().slice(0, 10)
    a.download = `leenqup-ops-backup-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast('Backup downloaded — share this file with your team via Slack or email', 'success')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        if (typeof parsed !== 'object' || !parsed._exportedAt) {
          toast('Invalid backup file — make sure you\'re using a LeenqUp Ops backup', 'error')
          setImporting(false)
          return
        }
        setPendingFile(parsed)
        setConfirmImport(true)
      } catch {
        toast('Could not parse file — must be a valid JSON backup', 'error')
      } finally {
        setImporting(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  const handleConfirmImport = () => {
    if (!pendingFile) return
    const { restored, errors } = importAllData(pendingFile)
    setConfirmImport(false)
    setPendingFile(null)
    if (errors.length > 0) {
      toast(`Restored ${restored} collections. ${errors.length} errors. Refresh to see changes.`, 'error')
    } else {
      toast(`Restored ${restored} data collections. Refreshing…`, 'success')
      setTimeout(() => window.location.reload(), 1500)
    }
  }

  const exportedAt = pendingFile?._exportedAt
    ? new Date(pendingFile._exportedAt as string).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : null

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-brand-purple/10 flex items-center justify-center">
              <DatabaseBackup className="h-5 w-5 text-brand-purple" />
            </div>
            <div>
              <CardTitle>Team Backup &amp; Restore</CardTitle>
              <CardDescription>Export all data to share with teammates, or restore from a backup</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-slate-50 dark:bg-navy-500/30 border border-slate-200 dark:border-navy-500 p-3 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-semibold">Local backups are a safety net — Supabase is your primary sync</p>
            <p className="text-slate-500 dark:text-slate-400">Use Export to create a point-in-time snapshot for offline storage or disaster recovery. For day-to-day team sharing, use Cloud Sync above.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-100 dark:border-navy-500 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-brand-green" />
                <p className="text-sm font-semibold text-navy dark:text-white">Export Backup</p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Downloads all data as a single JSON file. Share this with teammates.</p>
              <Button size="sm" onClick={handleExport} className="w-full gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export All Data
              </Button>
            </div>

            <div className="rounded-lg border border-gray-100 dark:border-navy-500 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-coral" />
                <p className="text-sm font-semibold text-navy dark:text-white">Restore Backup</p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Select a backup JSON file to replace all local data. Cannot be undone.</p>
              <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={importing} className="w-full gap-1.5">
                {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Select Backup File
              </Button>
              <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFileSelect} className="hidden" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Confirm Dialog */}
      <Dialog open={confirmImport} onOpenChange={v => !v && setConfirmImport(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Replace all local data?
            </DialogTitle>
            <DialogDescription>
              This will overwrite <strong>all data</strong> on this device with the backup
              {exportedAt && <> from <strong>{exportedAt}</strong></>}. Your current data will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button variant="secondary" onClick={() => setConfirmImport(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmImport}>
              Yes, Restore Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Cloud Sync Card ──────────────────────────────────────────────────────────

function CloudSyncCard() {
  const [pushing, setPushing] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [lastPush, setLastPush] = useState<string | null>(null)
  const [lastPull, setLastPull] = useState<string | null>(null)

  const handlePush = async () => {
    setPushing(true)
    try {
      const { pushed, failed } = await pushLocalToSupabase()
      setLastPush(new Date().toLocaleTimeString())
      if (failed.length > 0) {
        toast(`Pushed ${pushed} collections. ${failed.length} failed: ${failed.join(', ')}`, 'error')
      } else if (pushed === 0) {
        toast('Nothing to push — localStorage appears empty', 'error')
      } else {
        toast(`Pushed ${pushed} collections to Supabase ✓`, 'success')
      }
    } catch (e) {
      toast(`Push failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error')
    } finally {
      setPushing(false)
    }
  }

  const handlePull = async () => {
    setPulling(true)
    try {
      const { hydrated } = await hydrateFromSupabase()
      setLastPull(new Date().toLocaleTimeString())
      toast(`Pulled ${hydrated} collections from Supabase. Refreshing…`, 'success')
      setTimeout(() => window.location.reload(), 1500)
    } catch {
      toast('Pull failed — check your connection', 'error')
    } finally {
      setPulling(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand-green/10 flex items-center justify-center">
            <Cloud className="h-5 w-5 text-brand-green" />
          </div>
          <div>
            <CardTitle>Supabase Cloud Sync</CardTitle>
            <CardDescription>Real-time shared database — all team members stay in sync automatically</CardDescription>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-brand-green font-medium">
            <Wifi className="h-3.5 w-3.5" />
            Connected
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-brand-green/5 border border-brand-green/20 p-3 text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <p className="font-semibold text-brand-green">Supabase is active — every change syncs automatically</p>
          <p>When you save a merchant, post, deal, or any other record, it is instantly written to Supabase so all teammates see it on their next page load. No more manual backup exports needed.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-100 dark:border-navy-500 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CloudUpload className="h-4 w-4 text-coral" />
              <p className="text-sm font-semibold text-navy dark:text-white">Push Local → Cloud</p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Force-upload all your local data to Supabase. Use this on day one to seed the shared database.
            </p>
            {lastPush && <p className="text-xs text-slate-400">Last pushed at {lastPush}</p>}
            <Button size="sm" onClick={handlePush} disabled={pushing} className="w-full gap-1.5">
              {pushing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudUpload className="h-3.5 w-3.5" />}
              Push to Cloud
            </Button>
          </div>

          <div className="rounded-lg border border-gray-100 dark:border-navy-500 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CloudDownload className="h-4 w-4 text-brand-green" />
              <p className="text-sm font-semibold text-navy dark:text-white">Pull Cloud → Local</p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Force-download the latest team data from Supabase. Page will reload after pull.
            </p>
            {lastPull && <p className="text-xs text-slate-400">Last pulled at {lastPull}</p>}
            <Button size="sm" variant="secondary" onClick={handlePull} disabled={pulling} className="w-full gap-1.5">
              {pulling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudDownload className="h-3.5 w-3.5" />}
              Pull from Cloud
            </Button>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          API keys and integration tokens are stored locally only — they are never synced to Supabase.
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Data Management Section ──────────────────────────────────────────────────

type SectionKey = 'posts' | 'scripts' | 'sequences' | 'campaigns' | 'sops' | 'brand' | 'merchants'

const DATA_SECTIONS: { key: SectionKey; label: string; getCount: () => unknown[] }[] = [
  { key: 'posts', label: 'Posts', getCount: getPosts },
  { key: 'scripts', label: 'Scripts', getCount: getScripts },
  { key: 'sequences', label: 'Sequences', getCount: getSequences },
  { key: 'campaigns', label: 'Campaigns', getCount: getCampaigns },
  { key: 'sops', label: 'SOPs', getCount: getSOPs },
  { key: 'brand', label: 'Brand Responses', getCount: getBrandResponses },
  { key: 'merchants', label: 'Merchants', getCount: getMerchants },
]

function DataManagementCard() {
  const [counts, setCounts] = useState<Record<SectionKey, number>>({
    posts: 0,
    scripts: 0,
    sequences: 0,
    campaigns: 0,
    sops: 0,
    brand: 0,
    merchants: 0,
  })
  const [confirmSection, setConfirmSection] = useState<SectionKey | null>(null)

  useEffect(() => {
    const updated: Record<SectionKey, number> = {
      posts: 0, scripts: 0, sequences: 0, campaigns: 0, sops: 0, brand: 0, merchants: 0,
    }
    DATA_SECTIONS.forEach(s => {
      try {
        updated[s.key] = s.getCount().length
      } catch {
        updated[s.key] = 0
      }
    })
    setCounts(updated)
  }, [])

  const handleReset = (key: SectionKey) => {
    resetSection(key)
    const section = DATA_SECTIONS.find(s => s.key === key)!
    setCounts(prev => ({ ...prev, [key]: section.getCount().length }))
    setConfirmSection(null)
    toast(`${section.label} reset to seed data`, 'success')
  }

  const confirmingSection = DATA_SECTIONS.find(s => s.key === confirmSection)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Reset individual sections back to the original seed data. This cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {DATA_SECTIONS.map(section => (
            <div
              key={section.key}
              className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-navy-500 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-navy dark:text-white">{section.label}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{counts[section.key]} items</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setConfirmSection(section.key)}
                className="gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to Seed Data
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!confirmSection} onOpenChange={v => !v && setConfirmSection(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Reset {confirmingSection?.label}?
            </DialogTitle>
            <DialogDescription>
              This will replace all your <strong>{confirmingSection?.label}</strong> data with the original seed data. Any changes you&apos;ve made will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button variant="secondary" onClick={() => setConfirmSection(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmSection && handleReset(confirmSection)}>
              Reset {confirmingSection?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Appearance Card ──────────────────────────────────────────────────────────

function AppearanceCard() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <Card>
        <CardContent className="p-5 h-16 animate-pulse bg-gray-50 dark:bg-navy-500 rounded-xl" />
      </Card>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-navy-500 flex items-center justify-center">
              {isDark ? <Moon className="h-5 w-5 text-slate-300" /> : <Sun className="h-5 w-5 text-amber-500" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-navy dark:text-white">Appearance</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{isDark ? 'Dark mode' : 'Light mode'} is active</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-slate-400" />
            <Switch
              checked={isDark}
              onCheckedChange={checked => setTheme(checked ? 'dark' : 'light')}
            />
            <Moon className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({})

  useEffect(() => {
    setSettings(getSettings())
  }, [])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Configure integrations and manage your data.</p>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">Appearance</h2>
          <AppearanceCard />
        </section>

        {/* Integrations */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">Integrations</h2>
          <div className="space-y-4">
            <BufferCard settings={settings} onSettingsChange={setSettings} />
            <BrevoCard settings={settings} onSettingsChange={setSettings} />
            <NotionCard settings={settings} onSettingsChange={setSettings} />
            <SlackCard settings={settings} onSettingsChange={setSettings} />
            <MakeWebhookCard settings={settings} onSettingsChange={setSettings} />
          </div>
        </section>

        {/* Cloud Sync */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">Cloud Sync</h2>
          <CloudSyncCard />
        </section>

        {/* Backup & Restore */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">Local Backup</h2>
          <BackupRestoreCard />
        </section>

        {/* Data Management */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">Data</h2>
          <DataManagementCard />
        </section>
      </div>
    </div>
  )
}
