import { Campaign } from '@/types'

export const campaigns: Campaign[] = [
  // ─────────────────────────────────────────────────────────────
  // 1. PRE-LAUNCH MOMENTUM
  // ─────────────────────────────────────────────────────────────
  {
    id: 'camp_001',
    name: 'Pre-Launch Momentum',
    phase: 'pre-launch',
    status: 'ready',
    description:
      'Four-week pre-launch campaign to build awareness, generate waitlist signups, recruit founding sellers, and prime the Liberian and diaspora community for launch day. Goal: 500+ waitlist signups, 30+ founding seller applications, active community buzz across Facebook, Instagram, and WhatsApp.',
    assets: {
      posts: [
        'post_001', // Announcement / teaser — what is LeenqUp
        'post_003', // Trust pillar — how proof-based commerce works
        'post_005', // Seller spotlight concept — "selling made real"
        'post_008', // Buyer education — how to find Liberian products
        'post_012', // Community/diaspora angle — shop from home
        'post_017', // Waitlist CTA — join before we launch
      ],
      emails: ['seq_001'], // Buyer Welcome sequence
    },
    whatsappBroadcast: `🇱🇷 Something big is coming for Liberia.

We're building LeenqUp — a marketplace where Liberian sellers can list their products online and buyers anywhere in the world (including right here in Monrovia) can shop with confidence, pay easily, and support businesses they know.

No more "send money first and hope for the best." On LeenqUp:
✅ Every seller has their identity confirmed and business details on file
✅ Payments go through Orange Money and trusted channels
✅ Every transaction is receipt-backed with a real record

We launch soon. Here's how to get involved:

👉 If you want to BUY — join the waitlist: [link]
👉 If you want to SELL — apply for a founding seller spot: [link]
👉 If you just want to follow — share this message and keep your eyes open

The first platform built for Liberian commerce, for Liberians, by people who care about getting this right.

LeenqUp. Shop Liberian. Trust the record.

— The LeenqUp Team`,
    deploymentSchedule: `WEEK 1 — Awareness & Teaser
• Monday: Launch Instagram/Facebook teaser post (post_001) — "Something is coming for Liberian commerce"
• Tuesday: Share WhatsApp broadcast to all existing contacts and community groups
• Wednesday: Post trust education content (post_003) — what proof-based commerce means
• Thursday: Activate waitlist landing page; share link in all bios
• Friday: Post community engagement question — "What's the hardest part of shopping from Liberian sellers online?"
• Saturday: Share user-generated responses and keep the conversation going
• Sunday: Rest / review engagement metrics

WEEK 2 — Seller Recruitment
• Monday: Launch seller-focused post (post_005) — "If you're a Liberian seller, this is for you"
• Tuesday: Direct WhatsApp outreach to 20 priority merchant leads (use merchant pipeline in Ops dashboard)
• Wednesday: Post buyer education content (post_008) — how LeenqUp discovery works
• Thursday: Founder-facing Instagram Story series — meet the team behind LeenqUp
• Friday: Second WhatsApp broadcast to new contacts added this week
• Saturday: Share any early seller testimonials or application confirmations
• Sunday: Rest / compile seller pipeline report

WEEK 3 — Community Building & Social Proof
• Monday: Post diaspora-angle content (post_012) — "Your Liberia is right here"
• Tuesday: Engage Facebook Liberian community groups with value posts (no hard sells)
• Wednesday: Share a behind-the-scenes look at seller onboarding process
• Thursday: Run a story poll — "Would you buy from a Liberian seller online if you knew their identity was confirmed?"
• Friday: Post CTA content (post_017) — waitlist urgency, founding buyer perks
• Saturday: Respond to all comments and DMs from the week; thank community supporters
• Sunday: Rest

WEEK 4 — Final Push to Launch
• Monday: "One week to launch" announcement across all channels
• Tuesday: Feature a founding seller story — real name, real business, real product
• Wednesday: Final seller recruitment push — last call for founding seller applications
• Thursday: Countdown content — "3 days" teaser posts across platforms
• Friday: Email all waitlist signups with launch preview and early access information (seq_001 trigger)
• Saturday: WhatsApp broadcast to full contact list with launch date confirmation
• Sunday: Final prep; all content queued in Buffer for launch day`,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
  },

  // ─────────────────────────────────────────────────────────────
  // 2. LAUNCH DAY
  // ─────────────────────────────────────────────────────────────
  {
    id: 'camp_002',
    name: 'Launch Day',
    phase: 'launch-day',
    status: 'draft',
    description:
      'Launch day campaign executing a coordinated, hour-by-hour rollout across Instagram, Facebook, WhatsApp, and email. Goal: maximum awareness on day one, first 50 buyer signups, first 10 completed transactions, seller storefronts live and visible, press and community coverage activated.',
    assets: {
      posts: [
        'post_018', // Official launch announcement
        'post_019', // "We are live" — buyer CTA
        'post_020', // "We are live" — seller CTA
        'post_021', // Featured founding seller #1 spotlight
        'post_022', // Featured founding seller #2 spotlight
        'post_023', // How to place your first order — step-by-step
        'post_024', // Orange Money payment explainer
        'post_025', // Community celebration post — "day one together"
      ],
      emails: ['seq_001', 'seq_002'], // Buyer Welcome + Seller Onboarding
    },
    whatsappBroadcast: `🚨 WE ARE LIVE. 🚨

LeenqUp just launched. Right now. Today.

Liberia's first social commerce marketplace is open — and you can shop or sell starting right now.

🛒 FOR BUYERS:
Browse Liberian sellers, find products you love, and pay via Orange Money or card with confidence. Every seller has their identity confirmed and business profile on file. Shop with confidence.

👉 Shop now: [LeenqUp marketplace link]

🏪 FOR SELLERS:
If you applied to be a founding seller, your storefront is live. Share your LeenqUp link with every customer you have — now is the moment.

If you haven't applied yet, it's not too late:
👉 Apply here: [seller registration link]

📣 FOR EVERYONE:
Share this message. Screenshot it. Post it. Send it to your group chats. Tell your family in Monrovia. Tell your friends in the US. This is Liberian commerce — and it's happening today.

LeenqUp. Shop Liberian. Trust the record.

— The LeenqUp Team`,
    deploymentSchedule: `LAUNCH DAY — HOUR BY HOUR EXECUTION PLAN

6:00 AM (EST) / 11:00 AM (Monrovia)
• Final systems check — confirm marketplace is live, all founding seller storefronts are active
• Confirm Orange Money payment flow is working with a test transaction
• All team members confirm online and reachable via WhatsApp group

7:00 AM EST / 12:00 PM Monrovia
• Send WhatsApp launch broadcast to full contact list (all saved contacts + community groups)
• Post official launch announcement on Instagram (post_018) — feed post + Story
• Post launch announcement on Facebook page + personal profiles of all team members

8:00 AM EST / 1:00 PM Monrovia
• Send launch day email to full waitlist via Brevo — subject: "We are live — come shop"
• Trigger seq_001 (Buyer Welcome) for all new signups from this point forward
• Trigger seq_002 (Seller Onboarding) for all founding sellers who haven't completed setup

9:00 AM EST / 2:00 PM Monrovia
• Post "buyer CTA" content (post_019) — how to shop, link in bio
• Post "seller CTA" content (post_020) — your store is live, share your link
• Team members share personal posts about LeenqUp launch on their own accounts

10:00 AM EST / 3:00 PM Monrovia
• Monitor all DMs and comments — respond to every single one within 15 minutes
• Log any technical issues immediately in the ops channel
• Check payment pipeline — confirm any early transactions are processing correctly

12:00 PM EST / 5:00 PM Monrovia
• Midday milestone check: how many signups? How many orders? Share internally
• Post founding seller spotlight #1 (post_021) — celebrate a real seller on launch day
• Send second WhatsApp broadcast to diaspora-focused contact lists in the US

2:00 PM EST / 7:00 PM Monrovia
• Post founding seller spotlight #2 (post_022)
• Post "how to place your first order" educational content (post_023)
• Continue monitoring and responding to all social engagement

4:00 PM EST / 9:00 PM Monrovia
• Post Orange Money payment explainer (post_024) — address any payment confusion
• Check in with founding sellers — any issues with storefronts or orders?
• Share real-time milestone: "X orders placed on day one" if numbers are strong

6:00 PM EST / 11:00 PM Monrovia
• Post community celebration content (post_025) — "Day one, together"
• Share any first buyer or seller success story if available
• Final WhatsApp broadcast: "Thank you for day one — the marketplace is live 24/7"

End of Day
• Full team debrief: signups, orders, issues, press coverage
• Log all metrics in ops dashboard
• Prepare day-two content queue
• Individual thank-you messages to any buyer or seller who had a public interaction on launch day`,
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-04-05T10:00:00Z',
  },

  // ─────────────────────────────────────────────────────────────
  // 3. POST-LAUNCH 30
  // ─────────────────────────────────────────────────────────────
  {
    id: 'camp_003',
    name: 'Post-Launch 30',
    phase: 'post-launch-30',
    status: 'draft',
    description:
      'Thirty-day post-launch campaign focused on retention, growth, and establishing weekly content rhythms. Goal: 200+ active buyers, 50+ active sellers, first 500 completed transactions, strong community presence, and re-engagement of any inactive early adopters.',
    assets: {
      posts: [
        'post_026', // Week 1 recap — "look what we built together"
        'post_027', // Seller of the week spotlight
        'post_028', // Buyer story / testimonial
        'post_029', // New seller features / onboarding update
        'post_030', // 30-day milestone celebration
        'post_015', // Evergreen trust education repost
      ],
      emails: ['seq_001', 'seq_003'], // Buyer Welcome (new signups) + Re-engagement (dormant users)
    },
    whatsappBroadcast: `🎉 30 Days of LeenqUp — Thank You, Liberia.

One month ago, we went live. And in 30 days, here's what this community built together:

📦 [X] orders placed
🏪 [X] active sellers
🛒 [X] registered buyers
🌍 Buyers from Monrovia to Maryland, shopping Liberian

This is just the beginning.

For everyone who bought, sold, shared, reviewed, or just believed in what we were building — thank you. You are LeenqUp.

What's coming in month two:
✨ More sellers, more product categories
✨ Improved delivery tracking for Monrovia orders
✨ Seller analytics dashboard — see who's visiting your store
✨ Diaspora shipping expansion

If you haven't shopped yet — now is the time. The marketplace is live, the sellers are ready, and the community is growing every day.

👉 Shop now: [marketplace link]
👉 Sell with us: [seller registration link]

Share this with someone who needs to know: Liberian commerce has a home.

— The LeenqUp Team`,
    deploymentSchedule: `POST-LAUNCH 30 — WEEKLY CADENCE

WEEK 1 (Days 1-7 post-launch)
• Monday: Post launch recap content (post_026) — celebrate early wins, share initial numbers
• Tuesday: DM all founding sellers to check in — how are things going? Any issues?
• Wednesday: Post seller of the week spotlight (post_027) — feature a real seller with strong early activity record
• Thursday: Send re-engagement email via seq_003 to any users who signed up pre-launch but haven't logged in
• Friday: Community post — share a buyer's first purchase story (with permission)
• Saturday: WhatsApp broadcast — week one numbers and a featured seller highlight
• Sunday: Team retrospective — what worked, what didn't, what to adjust

WEEK 2 (Days 8-14 post-launch)
• Monday: Post buyer testimonial content (post_028) — real buyer, real experience
• Tuesday: Outreach to 20 new merchant leads from the pipeline — seller recruitment continues
• Wednesday: Educational post — how to leave a review and why it matters for the community
• Thursday: Email all active buyers with "sellers you might love" curated list
• Friday: Instagram Story series — behind the scenes of a seller preparing an order
• Saturday: WhatsApp broadcast — new sellers who joined this week
• Sunday: Metrics review — orders, signups, active sellers, review count

WEEK 3 (Days 15-21 post-launch)
• Monday: Post new seller features / onboarding updates (post_029)
• Tuesday: Trigger seq_003 re-engagement sequence for any user inactive for 14+ days
• Wednesday: Facebook community group — weekly engagement prompt + seller AMA
• Thursday: Email all sellers with "your week 3 tips" — how to improve activity record
• Friday: Second seller of the week spotlight — different category from week 1
• Saturday: WhatsApp broadcast — community milestone (e.g., 100th order, 50th seller)
• Sunday: Plan month two content calendar; brief content team

WEEK 4 (Days 22-30 post-launch)
• Monday: "One week to 30-day milestone" countdown content
• Tuesday: Compile 30-day metrics for milestone post
• Wednesday: Reach out to any buyers who placed orders for testimonials / case studies
• Thursday: Post 30-day milestone celebration content (post_030)
• Friday: Send 30-day milestone WhatsApp broadcast to full contact list
• Saturday: Email all users (buyers and sellers) with 30-day recap and month-two preview
• Sunday: Full team 30-day debrief; set month-two goals and campaign priorities`,
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-04-10T10:00:00Z',
  },
]
