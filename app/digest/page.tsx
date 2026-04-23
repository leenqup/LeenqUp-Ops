'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Copy,
  Send,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import { generateDigest, type DigestReport } from '@/lib/digest'
import { initializeStorage, getSettings } from '@/lib/storage'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatWeekLabel(from: string, to: string): string {
  const f = new Date(from)
  const t = new Date(to)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const fromStr = f.toLocaleDateString('en-US', opts)
  const toStr = t.toLocaleDateString('en-US', { ...opts, year: 'numeric' })
  return `${fromStr} – ${toStr}`
}

function buildPlainText(digest: DigestReport): string {
  const weekLabel = formatWeekLabel(digest.period.from, digest.period.to)

  const opps = digest.topOpportunities.length > 0
    ? digest.topOpportunities.map(o => `• ${o.name} (score: ${o.score})`).join('\n')
    : '• None'

  const flags = digest.flaggedMerchants.length > 0
    ? digest.flaggedMerchants.map(f => `• ${f.name} (score: ${f.score})`).join('\n')
    : '• None'

  return [
    `LeenqUp Weekly Digest — Week of ${weekLabel}`,
    `Generated: ${new Date(digest.generatedAt).toLocaleString('en-US')}`,
    '',
    'KPIs:',
    `• Merchants Added: ${digest.merchantsAdded}`,
    `• Merchants Contacted: ${digest.merchantsContacted}`,
    `• Posts Ready: ${digest.postsReady}`,
    `• Goals On Track: ${digest.goalsOnTrack}`,
    '',
    'Highlights:',
    ...digest.highlights.map(h => `• ${h}`),
    '',
    'Top Opportunities:',
    opps,
    '',
    'Needs Attention:',
    flags,
  ].join('\n')
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        <p className="text-3xl font-bold text-navy dark:text-white mt-1">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Score Badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score, danger }: { score: number; danger?: boolean }) {
  return (
    <Badge
      className={
        danger
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-semibold'
          : 'bg-brand-green/10 text-brand-green font-semibold'
      }
    >
      {score}
    </Badge>
  )
}

// ─── Slack Dialog ─────────────────────────────────────────────────────────────

function SlackDialog({
  open,
  onClose,
  digest,
  defaultWebhook,
}: {
  open: boolean
  onClose: () => void
  digest: DigestReport
  defaultWebhook: string
}) {
  const [webhookUrl, setWebhookUrl] = useState(defaultWebhook)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (open) setWebhookUrl(defaultWebhook)
  }, [open, defaultWebhook])

  const handleSend = async () => {
    if (!webhookUrl.trim()) {
      toast('Enter a Slack webhook URL', 'error')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/slack-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: webhookUrl.trim(), digest }),
      })
      const data = await res.json()
      if (data.success) {
        toast('Digest sent to Slack!')
        onClose()
      } else {
        toast(data.error ?? 'Failed to send to Slack', 'error')
      }
    } catch {
      toast('Network error — could not reach Slack', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send to Slack</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Webhook URL
            </Label>
            <Input
              className="mt-1"
              placeholder="https://hooks.slack.com/services/…"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">
              Create an incoming webhook in your Slack workspace settings.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending} className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            {sending ? 'Sending…' : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DigestPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [digest, setDigest] = useState<DigestReport | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showSlack, setShowSlack] = useState(false)
  const [slackWebhook, setSlackWebhook] = useState('')

  useEffect(() => {
    initializeStorage()
    const settings = getSettings()
    if (settings.slackWebhookUrl) setSlackWebhook(settings.slackWebhookUrl)
    setDigest(generateDigest(weekOffset))
    setMounted(true)
  }, [weekOffset])

  const handleCopy = () => {
    if (!digest) return
    const text = buildPlainText(digest)
    navigator.clipboard.writeText(text).then(
      () => toast('Copied to clipboard'),
      () => toast('Failed to copy', 'error')
    )
  }

  if (!mounted || !digest) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-slate-100 dark:bg-navy-500 animate-pulse rounded mb-2" />
        <div className="h-4 w-64 bg-slate-100 dark:bg-navy-500 animate-pulse rounded" />
      </div>
    )
  }

  const weekLabel = formatWeekLabel(digest.period.from, digest.period.to)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <FileText className="h-5 w-5 text-brand-purple" />
            <h1 className="text-2xl font-bold text-navy dark:text-white">Weekly Digest</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Auto-generated report from your ops data.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={handleCopy} className="gap-1.5">
            <Copy className="h-3.5 w-3.5" /> Copy as Text
          </Button>
          <Button size="sm" onClick={() => setShowSlack(true)} className="gap-1.5">
            <Send className="h-3.5 w-3.5" /> Send to Slack
          </Button>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setWeekOffset(o => o - 1)}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-navy dark:text-white min-w-[200px] text-center">
          Week of {weekLabel}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setWeekOffset(o => o + 1)}
          disabled={weekOffset === 0}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Merchants Added" value={digest.merchantsAdded} sub="this week" />
        <KpiCard label="Merchants Contacted" value={digest.merchantsContacted} sub="this week" />
        <KpiCard label="Posts Ready" value={digest.postsReady} sub="awaiting publish" />
        <KpiCard label="Goals On Track" value={digest.goalsOnTrack} sub={`${digest.goalsAtRisk} need attention`} />
      </div>

      {/* Opportunities + Flagged */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Top Opportunities */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-1.5">
              Top Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {digest.topOpportunities.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No merchant data available.</p>
            ) : (
              <ul className="space-y-2">
                {digest.topOpportunities.map(m => (
                  <li key={m.id} className="flex items-center justify-between gap-2">
                    <Link
                      href={`/merchants/${m.id}`}
                      className="text-sm font-medium text-navy dark:text-white hover:underline flex items-center gap-1 min-w-0 truncate"
                    >
                      {m.name}
                      <ExternalLink className="h-3 w-3 text-slate-400 shrink-0" />
                    </Link>
                    <ScoreBadge score={m.score} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Needs Attention */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {digest.flaggedMerchants.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No low-engagement merchants. Great job!</p>
            ) : (
              <ul className="space-y-2">
                {digest.flaggedMerchants.map(m => (
                  <li key={m.id} className="flex items-center justify-between gap-2">
                    <Link
                      href={`/merchants/${m.id}`}
                      className="text-sm font-medium text-navy dark:text-white hover:underline flex items-center gap-1 min-w-0 truncate"
                    >
                      {m.name}
                      <ExternalLink className="h-3 w-3 text-slate-400 shrink-0" />
                    </Link>
                    <ScoreBadge score={m.score} danger />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Highlights */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Highlights</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="space-y-2">
            {digest.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-brand-purple shrink-0 mt-1.5" />
                {h}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Slack dialog */}
      <SlackDialog
        open={showSlack}
        onClose={() => setShowSlack(false)}
        digest={digest}
        defaultWebhook={slackWebhook}
      />
    </div>
  )
}
