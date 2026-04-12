'use client'

import { useState } from 'react'
import {
  BookOpen,
  Sun,
  Users,
  FileText,
  MessageCircle,
  Mail,
  Megaphone,
  ClipboardList,
  DollarSign,
  TrendingUp,
  LayoutGrid,
  Settings,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Download,
  Zap,
  AlertTriangle,
  Globe,
  Phone,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step {
  text: string
  tip?: string
}

interface Section {
  id: string
  icon: React.ReactNode
  title: string
  subtitle: string
  color: string
  badge?: string
  intro: string
  steps: Step[]
  keyTerms?: { term: string; def: string }[]
  caution?: string
}

// ─── Guide Content ────────────────────────────────────────────────────────────

const sections: Section[] = [
  {
    id: 'overview',
    icon: <Zap className="h-5 w-5" />,
    title: 'What Is LeenqUp Ops?',
    subtitle: 'Start here — 2 minutes',
    color: 'bg-coral text-white',
    badge: 'Start Here',
    intro:
      'LeenqUp Ops is the internal operations dashboard for the LeenqUp team. It is NOT the buyer/seller marketplace app — it is the tool the team uses to run the company: find merchants, reach out, track deals, plan content, manage projects, and monitor finances. Think of it as your company command center.',
    steps: [
      {
        text: 'LeenqUp Ops lives entirely in your browser. Data is saved locally in this browser. Use Settings → Export Backup to save a snapshot, and share it with teammates so everyone stays in sync.',
        tip: 'Until we migrate to a shared database, the nightly backup habit is critical.',
      },
      {
        text: 'The sidebar on the left is your main navigation. It is organized into four areas: Home & Today (daily priorities), Content (posts, scripts, campaigns), Operations (SOPs, brand, finance), and Commerce (merchants, CRM, projects).',
      },
      {
        text: 'The two most important pages to open every morning are /today (your daily briefing) and /merchants (the seller pipeline). Everything else supports these two.',
      },
    ],
    keyTerms: [
      { term: 'Merchant', def: 'A Liberian or diaspora business we are trying to onboard as a seller on LeenqUp.' },
      { term: 'Outreach Status', def: 'Where a merchant is in the pipeline: Not Contacted → Contacted → Responded → Interested → Signed Up.' },
      { term: 'Script', def: 'A pre-written message template for WhatsApp, email, or DM outreach.' },
      { term: 'SOP', def: 'Standard Operating Procedure — a checklist of recurring tasks (daily, weekly, monthly).' },
      { term: 'Campaign', def: 'A coordinated launch effort combining posts, emails, and outreach in a sequence.' },
    ],
  },
  {
    id: 'today',
    icon: <Sun className="h-5 w-5" />,
    title: 'The Today Page',
    subtitle: 'Your daily starting point',
    color: 'bg-amber-500 text-white',
    badge: 'Daily',
    intro:
      'Open /today every morning. It shows everything that needs your attention today in one view — no digging through other pages required.',
    steps: [
      {
        text: 'Pipeline Pulse (top of page): Shows a count of merchants by outreach status. Glance at this to know how the seller pipeline is moving — are merchants progressing from "contacted" to "interested"?',
      },
      {
        text: 'SOPs Section: Any recurring tasks (daily/weekly checklists) that are due today appear here. Click "Complete" to mark them done. If a daily SOP is not completed by end of day, it resets tomorrow.',
        tip: 'Daily SOPs include things like checking merchant DMs, posting content, and reviewing deal pipeline.',
      },
      {
        text: 'Follow-Ups Section: Merchants who were contacted 3+ days ago with no update appear here. Each has a WhatsApp button pre-loaded with their outreach script. Tap it, review the message, send.',
      },
      {
        text: 'Project Cards Section: Any project tasks with today as their due date appear here. Click a card to open the full project board.',
      },
      {
        text: 'Posts Section: Posts scheduled to go out today are listed. Click a post to open it in the Posts page where you can schedule it to Buffer.',
      },
      {
        text: 'Campaigns Section: Active campaigns with outstanding deployment tasks appear here. The progress bar shows how many campaign assets have been executed.',
      },
    ],
    caution: 'The Today page reads live data — if you mark a merchant as contacted, it disappears from Follow-Ups immediately. This is by design.',
  },
  {
    id: 'merchants',
    icon: <Users className="h-5 w-5" />,
    title: 'Merchants',
    subtitle: 'The seller pipeline — most important page',
    color: 'bg-navy text-white',
    badge: 'Core',
    intro:
      'The Merchants page is your seller acquisition CRM. Every business we are trying to onboard lives here — currently 565+ businesses across Liberia and the US diaspora. Your job is to move merchants from "Not Contacted" to "Signed Up."',
    steps: [
      {
        text: 'Filter the list: Use the filter bar to narrow by Category, Outreach Status, Tier, County, or Source (TrueLiberia Import vs. hand-researched). For daily outreach, filter to Status = "Not Contacted" + Tier = "1" to find the highest-priority targets.',
        tip: 'TL badge = imported from TrueLiberia.com. These all have real phone numbers. Hand-researched merchants (no TL badge) may have richer intel like Instagram handles and outreach history.',
      },
      {
        text: 'Open a merchant: Click any row to open the slide-over panel on the right. This is where you see all their contact info, notes, outreach history, assigned script, and quick-action buttons.',
      },
      {
        text: 'Send WhatsApp: In the slide-over Contact section, the green "Send WhatsApp Message" button opens wa.me with the best-matched script pre-filled. Review the message, personalize if needed, then hit send from WhatsApp.',
        tip: 'The script is auto-selected based on the merchant\'s category. You can manually change the Assigned Script in the Outreach section.',
      },
      {
        text: 'Log the outreach: After sending, scroll to "Outreach Log" in the slide-over and click "+ Add Entry". Select the channel (WhatsApp, Instagram DM, etc.) and write a brief note on what happened. This keeps the team in sync.',
      },
      {
        text: 'Update the status: Change "Current Status" in the Outreach section as the conversation progresses. When a merchant is ready to sign up, change status to "Signed Up" — this auto-closes any linked CRM deal.',
      },
      {
        text: 'Bulk Outreach: For systematic campaigns, click "Bulk Outreach" in the page header. Filter the batch, pick a WhatsApp script, and either open wa.me links one-by-one or export an HTML file to work through a list.',
      },
    ],
    keyTerms: [
      { term: 'Tier 1', def: 'Highest-priority merchants — verified, with email + website + social. Work these first.' },
      { term: 'Tier 2', def: 'Medium priority — some contact info, may or may not be verified.' },
      { term: 'Tier 3', def: 'Lower priority — phone only, unverified. Still contactable via WhatsApp.' },
      { term: 'TL Badge', def: 'Merchant was imported from TrueLiberia.com. Has a real phone number and TrueLiberia listing link.' },
      { term: 'County Filter', def: 'Filter Liberian merchants by county (Montserrado, Nimba, Margibi, etc.).' },
    ],
    caution: 'Never mark a merchant "Signed Up" until they have actually created their seller account on the LeenqUp marketplace app. "Interested" means they said yes in principle — "Signed Up" means the account exists.',
  },
  {
    id: 'scripts',
    icon: <MessageCircle className="h-5 w-5" />,
    title: 'Scripts',
    subtitle: 'Pre-written outreach messages',
    color: 'bg-brand-purple text-white',
    intro:
      'Scripts are message templates for WhatsApp, Instagram DM, Facebook Messenger, email, and SMS. They are organized by persona (who you are writing to), type (cold outreach vs. follow-up), and stage (first contact, second touch, etc.).',
    steps: [
      {
        text: 'Browse scripts by channel: Use the tabs at the top to filter by WhatsApp, Instagram DM, Email, etc. Most seller outreach uses WhatsApp.',
      },
      {
        text: 'Read before using: Each script has placeholders like [Merchant Name] and [City]. When used from a merchant\'s slide-over, these are auto-filled. If copying manually, replace all placeholders before sending.',
      },
      {
        text: 'Create new scripts: Click "+ Add Script". Fill in the title, body, channel, persona, type, and stage. Good scripts are short, specific, and conversational — avoid corporate language.',
        tip: 'The best-performing scripts sound like a real person reaching out, not a company announcement.',
      },
      {
        text: 'Assign a script to a merchant: In the merchant slide-over, use the "Assigned Script" dropdown. This script will be used as the default for that merchant\'s WhatsApp deep link.',
      },
    ],
    keyTerms: [
      { term: 'Persona', def: 'The type of seller you are targeting: fashion-seller, food-vendor, beauty-business, hospitality, etc.' },
      { term: 'Stage', def: 'First Contact = cold intro. Second Touch = follow-up after no reply. Third Touch = final attempt. Objection = responding to hesitation. Close = asking for commitment.' },
      { term: 'Channel', def: 'Where the message is sent: whatsapp, instagram-dm, facebook-messenger, email, sms.' },
    ],
  },
  {
    id: 'posts',
    icon: <FileText className="h-5 w-5" />,
    title: 'Posts',
    subtitle: 'Social media content library',
    color: 'bg-coral text-white',
    intro:
      'The Posts page is the content library for all social media posts across Instagram, Facebook, LinkedIn, Twitter, and WhatsApp. Posts are written here and then scheduled to Buffer (our social media scheduler) for publishing.',
    steps: [
      {
        text: 'Browse content: Posts are organized by platform, pillar (trust, discovery, education, etc.), audience (buyer, seller, diaspora), and status (ready, needs-review, scheduled, published).',
      },
      {
        text: 'Create a post: Click "+ New Post". Write the caption in the body field — the character counter turns red if you exceed the platform limit. Add tags, choose the platform and audience, and set status to "Ready" when done.',
      },
      {
        text: 'Schedule to Buffer: Open any ready post → click "Schedule to Buffer". A dialog appears showing your connected Buffer profiles. Check the profiles you want to post to, pick a date/time, and click "Schedule". The post status changes to "Scheduled" and a Buffer ID is saved.',
        tip: 'You can also click "Add to Queue" to let Buffer place it in the next available slot without picking a specific time.',
      },
      {
        text: 'Track publishing: Once Buffer publishes a post, manually update its status to "Published" and paste in the post URL. This keeps the library accurate.',
      },
    ],
    keyTerms: [
      { term: 'Pillar', def: 'The content theme: trust, discovery, education, proof, community, launch, feature, announcement.' },
      { term: 'Buffer', def: 'The social media scheduler we use. Connect your Buffer account in Settings → Buffer Access Token.' },
      { term: 'Phase', def: 'Where in the launch timeline this post fits: pre-launch, launch, post-launch, evergreen.' },
    ],
  },
  {
    id: 'campaigns',
    icon: <Megaphone className="h-5 w-5" />,
    title: 'Campaigns & Sequences',
    subtitle: 'Coordinated launch efforts',
    color: 'bg-brand-green text-white',
    intro:
      'Campaigns are coordinated marketing efforts that combine posts, emails, and WhatsApp broadcasts in a deployment schedule. Sequences are automated email drip series managed through Brevo (our email platform).',
    steps: [
      {
        text: 'View campaign status: Each campaign card shows its phase (pre-launch, launch-day, post-launch), status (draft, ready, active, complete), and a progress bar of how many assets have been executed.',
      },
      {
        text: 'Track execution: When you publish a post that is part of a campaign, open the campaign and log it as executed in "Executed Posts". This advances the progress bar visible on /today.',
      },
      {
        text: 'Sequences: Go to /sequences to see email drip campaigns. Each sequence has a trigger event (e.g., "seller signs up"), a list of emails with delay days, and a Brevo list ID for sending. To enroll a merchant, use the Brevo integration from their CRM record.',
        tip: 'Sequences require the Brevo API key to be set in Settings.',
      },
    ],
  },
  {
    id: 'sops',
    icon: <ClipboardList className="h-5 w-5" />,
    title: 'SOPs',
    subtitle: 'Standard operating procedures',
    color: 'bg-slate-700 text-white',
    intro:
      'SOPs (Standard Operating Procedures) are step-by-step checklists for recurring tasks. They ensure consistency — every team member follows the same process regardless of experience level.',
    steps: [
      {
        text: 'View SOPs by frequency: Daily SOPs reset every morning. Weekly SOPs reset Monday. Monthly SOPs reset on the 1st. "As Needed" SOPs are reference checklists without a schedule.',
      },
      {
        text: 'Complete a SOP: Expand any SOP card by clicking it. Work through each step in order, then click "Mark as Complete Today" at the bottom. Your name and timestamp are recorded.',
      },
      {
        text: 'Create a SOP: Click "+ New SOP". Give it a title, frequency, owner, and estimated time. Then add steps — each step has an Action (short) and Detail (expanded instructions). The step-by-step format is intentional: it removes ambiguity.',
        tip: 'Good SOPs are specific enough that a new hire on day one could follow them without asking questions.',
      },
    ],
    keyTerms: [
      { term: 'Frequency', def: 'How often the SOP is due: Daily (every day), Weekly (once per week), Monthly (once per month), As Needed (reference only).' },
      { term: 'Owner', def: 'The team role responsible for this SOP (e.g., "Content Team", "Growth Team", "Finance").' },
    ],
  },
  {
    id: 'crm',
    icon: <TrendingUp className="h-5 w-5" />,
    title: 'CRM Pipeline',
    subtitle: 'Deal tracking for signed merchants',
    color: 'bg-navy text-white',
    intro:
      'The CRM Pipeline tracks merchants who are in active deal conversations — from first verbal interest all the way to signed and onboarded. It mirrors a sales pipeline: each deal has a stage, a value estimate, and an activity log.',
    steps: [
      {
        text: 'Create a deal: When a merchant moves to "Interested" status, go to /crm and click "+ New Deal". Link it to the merchant, estimate the deal value, and set the stage to "Lead".',
        tip: 'A deal is automatically closed as "Won" when you mark the merchant as "Signed Up" in the Merchants page.',
      },
      {
        text: 'Move deals through stages: Stages are Lead → Qualified → Verbal Yes → Negotiating → Contract Sent → Closed Won / Closed Lost. Update the stage as conversations progress.',
      },
      {
        text: 'Log activities: Every call, message, and meeting should be logged in the deal\'s activity feed. This is your paper trail and helps other team members pick up where you left off.',
      },
      {
        text: 'Merchant Accounts: The "Accounts" tab is where signed-up merchants get their seller account details recorded (account ID, listing count, first sale date, etc.).',
      },
    ],
  },
  {
    id: 'projects',
    icon: <LayoutGrid className="h-5 w-5" />,
    title: 'Projects',
    subtitle: 'Kanban task boards',
    color: 'bg-brand-purple text-white',
    intro:
      'Projects is a Trello-style kanban board for managing internal work. Each board represents a workstream (e.g., "Seller Onboarding", "Content Calendar", "Tech Development"). Cards within boards represent individual tasks.',
    steps: [
      {
        text: 'Navigate boards: Click a board name in the left panel or at the top to switch boards. Each board has lists (columns like "To Do", "In Progress", "Blocked", "Done").',
      },
      {
        text: 'Create a card: Click "+ Add Card" in any list. Give it a title, description, due date, assignee, priority, and optional labels. Cards can be linked to a merchant, campaign, or post.',
      },
      {
        text: 'Move cards: Drag cards between columns or use the status dropdown inside the card to update status. Cards due today appear on /today automatically.',
      },
      {
        text: 'Use checklists: Inside any card, add a checklist for subtasks. The card shows completion percentage based on checked items.',
        tip: 'For seller onboarding, create one card per signed merchant in the "Onboarding" board and use checklists for each onboarding step.',
      },
    ],
  },
  {
    id: 'finance',
    icon: <DollarSign className="h-5 w-5" />,
    title: 'Finance',
    subtitle: 'Burn rate, revenue, runway',
    color: 'bg-brand-green text-white',
    intro:
      'The Finance page tracks company financials: monthly expenses by category, revenue by type, cash on hand, and calculated runway. This is the founders\' financial dashboard — not merchant payouts (those are in the app admin).',
    steps: [
      {
        text: 'Log expenses: Click "+ Add Expense". Select the category (salaries, tools/software, marketing, hosting, etc.), enter the amount in USD, the month it applies to, and whether it\'s recurring.',
      },
      {
        text: 'Log revenue: Click "+ Add Revenue". Select the revenue type (GMV commission, subscription, grant, investment, etc.), enter the amount, and the month.',
      },
      {
        text: 'Update cash position: The runway calculator needs to know your current cash on hand. Click "+ Update Cash" and enter the current balance. Runway = Cash ÷ (Monthly Burn − Monthly Revenue).',
      },
      {
        text: 'Investor KPIs: The KPIs section lets you log monthly metrics for investor updates: active sellers, active buyers, GMV, new listings, CAC. These are manual inputs — they come from the app admin dashboard.',
        tip: 'Update investor KPIs at the end of each month. Export to CSV for board reports.',
      },
    ],
    keyTerms: [
      { term: 'Burn Rate', def: 'How much cash the company spends per month. Calculated as the 3-month average of total expenses.' },
      { term: 'Runway', def: 'How many months until cash runs out. Formula: Cash ÷ (Burn − Revenue). Green = 6+ months. Red = under 3.' },
      { term: 'CAC', def: 'Customer Acquisition Cost — how much you spend to onboard one seller. Total marketing ÷ new sellers.' },
    ],
  },
  {
    id: 'settings',
    icon: <Settings className="h-5 w-5" />,
    title: 'Settings & Integrations',
    subtitle: 'Connect your tools + backup data',
    color: 'bg-slate-600 text-white',
    intro:
      'Settings is where you connect external tools (Buffer, Brevo, Notion, Slack) and manage data backups. Every new team member needs to complete the integrations setup on their first day.',
    steps: [
      {
        text: 'Buffer (Social Media): Go to buffer.com → Settings → API → copy your Access Token. Paste it in Settings → Buffer Access Token → Save. Test the connection — you should see your Buffer profiles listed.',
      },
      {
        text: 'Brevo (Email): Go to app.brevo.com → API Keys → create a new key. Paste it in Settings → Brevo API Key. Set your Sender Email to the address you want emails sent from.',
      },
      {
        text: 'Notion (Merchant Sync): Create a Notion integration at developers.notion.com and share your merchant database with it. Paste the integration token and database ID in Settings → Notion.',
      },
      {
        text: 'Team Backup — CRITICAL: At the end of each working day, go to Settings → Team Backup → Export Backup. A JSON file downloads to your computer. Share this file in the team Slack channel so everyone can restore from the same data.',
        tip: 'To restore from a backup: Settings → Team Backup → Restore from Backup → select the JSON file → confirm. The page reloads with all data restored.',
      },
      {
        text: 'Restore on a new device: On a new computer or for a new team member, open the app, go to Settings, and use "Restore from Backup" with the latest backup file from Slack. This populates all merchants, scripts, SOPs, campaigns, and history.',
      },
    ],
    caution: 'Each person has their own local copy of the data. If two people make changes simultaneously, the last person to restore overwrites the other\'s changes. Establish a clear backup rotation — one person exports the "master" backup each evening.',
  },
  {
    id: 'dayinlife',
    icon: <BookOpen className="h-5 w-5" />,
    title: 'Day in the Life: New Employee',
    subtitle: 'What a typical day looks like',
    color: 'bg-coral text-white',
    badge: 'Workflow',
    intro:
      'A structured daily routine makes the difference between reactive and systematic growth. Here is the recommended daily workflow for a new team member using LeenqUp Ops.',
    steps: [
      {
        text: '8:30 AM — Restore today\'s backup: Someone on the team exports a backup each evening. Download the latest one from Slack and restore it in Settings so you are working with the most current data.',
      },
      {
        text: '8:45 AM — Open /today: Work through the page top to bottom. Complete any due SOPs. Send follow-ups to merchants flagged as overdue. Note what campaigns are active today.',
      },
      {
        text: '9:00 AM — Outreach session (60–90 min): Go to /merchants. Filter to Tier 1 + Status "Not Contacted". Open each merchant, click the green WhatsApp button, review and personalize the pre-filled message, send. Log each outreach immediately.',
        tip: 'Target 15–20 new outreach messages per day per person. Quality matters — read the merchant\'s notes before sending.',
      },
      {
        text: '11:00 AM — Check responses: Anyone who replied gets their status updated and a logged response. Interested merchants get a deal created in /crm.',
      },
      {
        text: '1:00 PM — Content tasks: Check /posts for any posts due today. Schedule them to Buffer. If any new content needs writing, create drafts in the Posts page.',
      },
      {
        text: '3:00 PM — Project tasks: Open /projects and work through any cards due today. Update card statuses. Leave comments on blocked items.',
      },
      {
        text: '5:00 PM — End-of-day backup: Go to Settings → Export Backup. Share the file in the team Slack #ops-backup channel. This is the master backup for tomorrow.',
      },
    ],
    keyTerms: [
      { term: 'First week goal', def: 'Restore backup, send 50+ outreach messages, log every response, complete all daily SOPs 5 days in a row.' },
      { term: 'First month goal', def: '5+ merchants moved to "Interested" status, 2+ deals created in CRM, all weekly SOPs completed every week.' },
    ],
  },
  {
    id: 'quickref',
    icon: <Globe className="h-5 w-5" />,
    title: 'Quick Reference',
    subtitle: 'Common tasks at a glance',
    color: 'bg-slate-800 text-white',
    intro: 'The most common tasks and exactly where to do them.',
    steps: [
      { text: 'Reach out to a new merchant → /merchants → find merchant → slide-over → green WhatsApp button' },
      { text: 'Log a conversation → /merchants → merchant slide-over → Outreach Log → Add Entry' },
      { text: 'Mark merchant as interested → /merchants → slide-over → Outreach → Current Status → Interested' },
      { text: 'Create a deal for an interested merchant → /crm → + New Deal → link to merchant' },
      { text: 'Schedule a social media post → /posts → open post → Schedule to Buffer → pick profiles + time' },
      { text: 'Complete a daily checklist → /today → SOPs section → Mark as Complete' },
      { text: 'Add a project task → /projects → open board → Add Card in the right list' },
      { text: 'Log an expense → /finance → + Add Expense' },
      { text: 'Export all data → /settings → Team Backup → Export Backup' },
      { text: 'Restore from backup → /settings → Team Backup → Restore from Backup → select JSON file' },
      { text: 'Send a bulk WhatsApp campaign → /merchants → Bulk Outreach button → filter + pick script → Generate Links or Export HTML' },
      { text: 'Find merchants by county (Liberia) → /merchants → County filter → select county' },
      { text: 'See only TrueLiberia-imported merchants → /merchants → Source filter → TrueLiberia Import' },
    ],
  },
]

// ─── Section Card ─────────────────────────────────────────────────────────────

function GuideSection({ section }: { section: Section }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-gray-100 dark:border-navy-500 bg-white dark:bg-navy-600 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-navy-500/50 transition-colors"
      >
        <div className={cn('flex items-center justify-center w-10 h-10 rounded-lg shrink-0', section.color)}>
          {section.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-navy dark:text-white">{section.title}</h2>
            {section.badge && (
              <span className="text-[10px] font-semibold bg-coral/10 text-coral px-2 py-0.5 rounded-full uppercase tracking-wide">
                {section.badge}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{section.subtitle}</p>
        </div>
        {open
          ? <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
          : <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
        }
      </button>

      {/* Body */}
      {open && (
        <div className="px-5 pb-6 space-y-5 border-t border-gray-100 dark:border-navy-500">
          {/* Intro */}
          <p className="text-sm text-slate-600 dark:text-slate-300 pt-4 leading-relaxed">{section.intro}</p>

          {/* Steps */}
          <div className="space-y-3">
            {section.steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center pt-0.5 shrink-0">
                  <div className="w-6 h-6 rounded-full bg-navy/10 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-navy dark:text-white">
                    {i + 1}
                  </div>
                  {i < section.steps.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-100 dark:bg-navy-500 mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-3">
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{step.text}</p>
                  {step.tip && (
                    <div className="mt-2 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2">
                      <span className="text-amber-600 dark:text-amber-400 text-xs font-semibold shrink-0 mt-0.5">TIP</span>
                      <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{step.tip}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Key Terms */}
          {section.keyTerms && section.keyTerms.length > 0 && (
            <div className="rounded-lg bg-slate-50 dark:bg-navy-500/30 border border-slate-100 dark:border-navy-500 p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Key Terms</p>
              <div className="space-y-2">
                {section.keyTerms.map((kt, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-xs font-semibold text-navy dark:text-white shrink-0 w-32">{kt.term}</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{kt.def}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Caution */}
          {section.caution && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">{section.caution}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Quick Reference Table (last section) ─────────────────────────────────────

function QuickRefSection({ section }: { section: Section }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-gray-100 dark:border-navy-500 bg-white dark:bg-navy-600 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-navy-500/50 transition-colors"
      >
        <div className={cn('flex items-center justify-center w-10 h-10 rounded-lg shrink-0', section.color)}>
          {section.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-navy dark:text-white">{section.title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{section.subtitle}</p>
        </div>
        {open
          ? <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
          : <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
        }
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-navy-500">
          <p className="text-sm text-slate-600 dark:text-slate-300 px-5 py-4 leading-relaxed border-b border-gray-50 dark:border-navy-500">{section.intro}</p>
          <div className="divide-y divide-gray-50 dark:divide-navy-500">
            {section.steps.map((step, i) => {
              const parts = step.text.split('→')
              const task = parts[0]?.trim()
              const path = parts.slice(1).join('→').trim()
              return (
                <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-navy-500/30 transition-colors">
                  <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-navy dark:text-white">{task}</span>
                    {path && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 ml-2 font-mono">→ {path}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Print-friendly checklist ─────────────────────────────────────────────────

function handlePrint() {
  window.print()
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuidePage() {
  const [allOpen, setAllOpen] = useState(false)

  // We need a way to expand all — use a key trick to re-mount with default open
  // Instead, provide a simple expand-all via localStorage won't work cleanly,
  // so we offer print as the "full view" action

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-coral rounded-xl flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-navy dark:text-white">Employee Guide</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl">
            Everything you need to know to operate LeenqUp Ops. Read top to bottom on your first day.
            Each section expands with step-by-step instructions.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-navy-500 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-navy-500 transition-colors shrink-0"
        >
          <Download className="h-4 w-4" />
          Print / PDF
        </button>
      </div>

      {/* First-day checklist banner */}
      <div className="mb-6 rounded-xl bg-brand-green/10 border border-brand-green/30 p-4">
        <p className="text-sm font-semibold text-brand-green mb-2 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> Day 1 Checklist
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {[
            'Get the latest backup JSON from Slack and restore it in Settings',
            'Set up Buffer, Brevo, and Notion API keys in Settings',
            'Read the "What Is LeenqUp Ops?" section below',
            'Open /today and complete any due SOPs',
            'Send your first 5 WhatsApp outreach messages from /merchants',
            'Read the "Day in the Life" section for your daily routine',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-4 h-4 rounded border-2 border-brand-green/40 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contact banner */}
      <div className="mb-6 rounded-xl bg-navy/5 dark:bg-white/5 border border-navy/10 dark:border-white/10 p-4 flex items-center gap-4">
        <Phone className="h-5 w-5 text-navy dark:text-white shrink-0" />
        <div>
          <p className="text-sm font-semibold text-navy dark:text-white">Questions?</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Ask your manager or post in the team Slack #ops channel. This guide covers the tool — your manager covers the strategy.</p>
        </div>
      </div>

      {/* Guide Sections */}
      <div className="space-y-3">
        {sections.map((section) =>
          section.id === 'quickref'
            ? <QuickRefSection key={section.id} section={section} />
            : <GuideSection key={section.id} section={section} />
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-navy-500 text-center">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          LeenqUp Ops Employee Guide · Last updated April 2026 · Questions → team Slack #ops
        </p>
      </div>
    </div>
  )
}
