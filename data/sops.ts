import { SOP } from '@/types'

export const sops: SOP[] = [
  // ─────────────────────────────────────────────────────────────
  // 1. DAILY SOCIAL MEDIA OPERATIONS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'sop_001',
    title: 'Daily Social Media Operations',
    frequency: 'daily',
    owner: 'Marketing',
    estimatedMinutes: 45,
    steps: [
      {
        stepNumber: 1,
        action: 'Check overnight engagement across all platforms',
        detail:
          'Open Instagram, Facebook, and Twitter/X. Review all notifications from the past 12-18 hours — likes, comments, shares, new followers, story replies. Note any high-engagement posts and any comments that need a response. Do NOT close any tabs until responses are logged.',
        toolUsed: 'Instagram, Facebook, Twitter/X',
      },
      {
        stepNumber: 2,
        action: 'Respond to all comments within tone and trust language guidelines',
        detail:
          'Reply to every comment that asks a question or raises a concern. Use warm, direct brand voice. Never use forbidden language (verified, guaranteed, fully safe). Always reference "identity confirmed," "activity record," or "business details provided" where trust is being discussed. For hostile or negative comments, follow the brand response playbook — acknowledge, clarify, don\'t argue. Log any unresolved issues for escalation.',
        toolUsed: 'Instagram, Facebook, LeenqUp Ops Brand Responses',
      },
      {
        stepNumber: 3,
        action: 'Check and respond to all DMs',
        detail:
          'Review Instagram DMs, Facebook Messenger, and any WhatsApp Business messages. Categorize each message: buyer inquiry, seller inquiry, complaint, partnership, or general. Respond to all within the same session if possible. For complex issues (order disputes, seller problems), escalate to the appropriate team member and log it in the ops dashboard. Do not leave any DM unanswered for more than 24 hours.',
        toolUsed: 'Instagram, Facebook Messenger, WhatsApp Business',
      },
      {
        stepNumber: 4,
        action: 'Publish the day\'s scheduled content',
        detail:
          'Log into Buffer and confirm the day\'s scheduled posts are queued and correct. Check that captions are accurate, links work, and images display correctly. For any post scheduled to go live today, review it one final time before it publishes — confirm it follows trust language rules and brand voice. If a post needs last-minute changes, edit it in Buffer before the scheduled time. If a post was flagged for review, do not publish without Content Lead sign-off.',
        toolUsed: 'Buffer',
      },
      {
        stepNumber: 5,
        action: 'Post an unscheduled engagement prompt or story (if applicable)',
        detail:
          'On days where the content calendar has a gap in Instagram Stories, create and post a real-time engagement story. This could be a poll ("Would you buy Liberian lappa online?"), a question sticker ("What product do you wish you could find from Monrovia?"), or a community shoutout. Stories keep the account active between scheduled posts and drive daily engagement that feed posts don\'t capture.',
        toolUsed: 'Instagram',
      },
      {
        stepNumber: 6,
        action: 'Log daily engagement metrics in the ops dashboard',
        detail:
          'Record the following for today: total likes across all platforms, total comments, total DMs received, total DMs resolved, any new followers, any notable posts (high reach or high comment volume), and any escalated issues. Use the LeenqUp Ops dashboard metrics section. This data feeds the weekly content review and team reporting. Do not estimate — pull actual numbers from each platform\'s native analytics.',
        toolUsed: 'LeenqUp Ops dashboard, Instagram Insights, Facebook Insights',
      },
      {
        stepNumber: 7,
        action: 'Flag anything that needs content, product, or leadership attention',
        detail:
          'If any comment, DM, or piece of content raised a theme that leadership or the content team should know about (a recurring buyer complaint, a seller issue mentioned repeatedly, a product feature request appearing multiple times), write a brief note and post it in the team ops channel. This is the daily signal that informs weekly strategy. Even one sentence is enough — the goal is visibility, not a full report.',
        toolUsed: 'LeenqUp Ops dashboard, team communication channel',
      },
    ],
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },

  // ─────────────────────────────────────────────────────────────
  // 2. WEEKLY CONTENT REVIEW
  // ─────────────────────────────────────────────────────────────
  {
    id: 'sop_002',
    title: 'Weekly Content Review',
    frequency: 'weekly',
    owner: 'Content Lead',
    estimatedMinutes: 90,
    steps: [
      {
        stepNumber: 1,
        action: 'Pull all draft posts from the LeenqUp Ops dashboard',
        detail:
          'Log into the LeenqUp Ops content section. Filter by status "needs-review" and "draft." Export or list all posts scheduled for the upcoming 7-day window. Confirm every post that is supposed to be ready for the coming week is present. If a content piece is missing, flag it immediately — do not wait until the day it was supposed to publish.',
        toolUsed: 'LeenqUp Ops dashboard',
      },
      {
        stepNumber: 2,
        action: 'Review each post for quality, accuracy, and trust language compliance',
        detail:
          'Read every draft post word by word. Check for: (1) Trust language — confirm no forbidden words (verified, guaranteed, fully safe, risk-free, 100% safe). Confirm approved language is used correctly where relevant. (2) Brand voice — warm, direct, community-rooted, not corporate or cold. (3) Factual accuracy — are any claims made about the platform, sellers, or Liberia accurate and current? (4) Audience fit — is the post targeting the right audience (buyer, seller, diaspora, general)? (5) CTA clarity — does the post tell the reader what to do next?',
        toolUsed: 'LeenqUp Ops dashboard, brand voice guidelines',
      },
      {
        stepNumber: 3,
        action: 'Update post statuses and leave revision notes',
        detail:
          'For each post reviewed: if approved, change status to "ready." If changes are needed, leave specific revision notes in the post\'s notes field and set status back to "needs-review" or keep as "draft." Be specific in revision notes — "trust language issue in paragraph 2, remove \'guaranteed\'" is more useful than "needs fixing." If a post is rejected entirely, add a note explaining why so the writer understands the decision.',
        toolUsed: 'LeenqUp Ops dashboard',
      },
      {
        stepNumber: 4,
        action: 'Queue approved posts in Buffer with correct scheduling',
        detail:
          'For all posts with "ready" status, open Buffer and schedule each one according to the content calendar. Confirm the platform is correct (Instagram vs. Facebook vs. LinkedIn). Confirm the scheduled time aligns with optimal posting windows (typically 8-10am and 6-8pm Monrovia time for Liberian audiences; 7-9am and 7-9pm EST for diaspora audiences). Add the platform-appropriate caption format — hashtags for Instagram, no excessive hashtags for Facebook. Confirm each post has been added to the correct Buffer profile.',
        toolUsed: 'Buffer, LeenqUp Ops dashboard',
      },
      {
        stepNumber: 5,
        action: 'Plan the following week\'s content and assign writing tasks',
        detail:
          'Using the content calendar in Notion, map out the following week\'s posts. Identify any gaps — if a pillar (trust, discovery, proof, community) isn\'t represented in the week\'s lineup, note it and add a content task. Assign each writing task to a team member with a clear deadline (content due two days before publish date to allow for review). Consider upcoming events, Liberian holidays, community milestones, or product launches that should be reflected in content.',
        toolUsed: 'Notion, LeenqUp Ops dashboard',
      },
      {
        stepNumber: 6,
        action: 'Brief the team on the week\'s content plan',
        detail:
          'Send a brief weekly content summary to the full team via the ops channel. Include: what posts are going live this week and on which days, any content tasks assigned and to whom, any themes or messaging priorities to keep in mind, and anything the social media manager needs to be prepared to support (e.g., a seller spotlight that requires outreach for a quote or photo). This brief should take no more than 5 minutes to write — keep it scannable.',
        toolUsed: 'Notion, team communication channel',
      },
      {
        stepNumber: 7,
        action: 'Review last week\'s content performance and note top and bottom performers',
        detail:
          'Pull engagement data from Instagram Insights and Facebook Insights for all posts published in the previous 7 days. Identify the top 2 performing posts (by reach or engagement rate) and the bottom 2. Note patterns: what type of content performed best? What fell flat? Add a brief performance note in each post\'s record in the LeenqUp Ops dashboard. Use this data to inform the following week\'s content priorities. One insight per week, written clearly, is enough.',
        toolUsed: 'Instagram Insights, Facebook Insights, LeenqUp Ops dashboard',
      },
    ],
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },

  // ─────────────────────────────────────────────────────────────
  // 3. MERCHANT OUTREACH CADENCE
  // ─────────────────────────────────────────────────────────────
  {
    id: 'sop_003',
    title: 'Merchant Outreach Cadence',
    frequency: 'daily',
    owner: 'Growth',
    estimatedMinutes: 60,
    steps: [
      {
        stepNumber: 1,
        action: 'Open the LeenqUp Ops merchant pipeline and review current outreach statuses',
        detail:
          'Log into the LeenqUp Ops dashboard and navigate to the Merchant Pipeline. Filter to show merchants with status "not-contacted" and "contacted." Review any notes from the previous day\'s outreach. Identify which merchants received messages yesterday that may now need a follow-up. Note any merchants who have responded since last checked — these should be addressed before any new outreach goes out.',
        toolUsed: 'LeenqUp Ops dashboard',
      },
      {
        stepNumber: 2,
        action: 'Identify 5-10 new merchants to contact today',
        detail:
          'From the "not-contacted" pool, select 5-10 merchants to reach out to in today\'s session. Prioritize by: (1) priority level (high > medium > low), (2) digital presence (merchants with Instagram or Facebook pages are easier to reach and easier to close), (3) category fit (fashion, food, beauty, and home goods convert best in the current phase). Check that you have a valid contact channel for each selected merchant — Instagram handle, WhatsApp number, or email. Do not reach out on a channel where you don\'t have a confirmed contact.',
        toolUsed: 'LeenqUp Ops dashboard',
      },
      {
        stepNumber: 3,
        action: 'Send personalized outreach messages using approved scripts',
        detail:
          'Open the outreach scripts section in LeenqUp Ops. Select the appropriate script for each merchant based on their persona (fashion-seller, food-vendor, beauty-business, etc.) and channel (WhatsApp, Instagram DM, email). Personalize each message: use the merchant\'s name, reference their specific business or product, and make it clear this is not a mass message. Send via the appropriate channel. Do not copy-paste the same message to multiple merchants on the same platform — Instagram and WhatsApp both flag mass identical messages.',
        toolUsed: 'WhatsApp Business, Instagram, LeenqUp Ops scripts',
      },
      {
        stepNumber: 4,
        action: 'Log every outreach message sent in the merchant profile',
        detail:
          'Immediately after sending each outreach message, go to that merchant\'s profile in LeenqUp Ops and add an outreach log entry: today\'s date, the channel used, a brief note of what was said (e.g., "Sent warm intro via Instagram DM, referenced their lappa collection"), and your initials as the sender. Update the merchant\'s outreach status to "contacted." This log is the team\'s collective memory — it must be accurate and up to date.',
        toolUsed: 'LeenqUp Ops dashboard',
      },
      {
        stepNumber: 5,
        action: 'Follow up on merchants who were contacted 2-3 days ago with no response',
        detail:
          'Filter the merchant pipeline for merchants with status "contacted" and last contact date 2-3 days ago. For each, send a single follow-up message — warmer in tone than the first, shorter, and with a clear and easy next step. Do not send a third follow-up without a response unless a specific re-engagement event (a new platform feature, a seller success story) gives you a genuine reason to reach out again. Log the follow-up in the outreach log.',
        toolUsed: 'WhatsApp Business, Instagram, LeenqUp Ops dashboard',
      },
      {
        stepNumber: 6,
        action: 'Handle responses from interested merchants',
        detail:
          'For any merchant who has responded with interest (status: "responded" or "interested"), prioritize them above new outreach. Respond promptly — within the same session if possible. Share the seller registration link, answer any specific questions they have, and if they\'re hesitant, route to the relevant objection-handling script. If they\'re ready to sign up, walk them through the registration form. Update their status to "interested" or "signed-up" as appropriate.',
        toolUsed: 'WhatsApp Business, Instagram, LeenqUp Ops scripts',
      },
      {
        stepNumber: 7,
        action: 'Update all merchant statuses and close the session log',
        detail:
          'Before closing the session, confirm every merchant you interacted with today has an updated status and a current outreach log entry. No merchant you touched today should still show "not-contacted" unless there was a specific reason you decided not to reach out (note why). Merchants who have explicitly declined should be marked "declined" with a brief note. Do a final count: how many messages sent, how many responses received, how many new signups initiated. Post this count in the growth team channel.',
        toolUsed: 'LeenqUp Ops dashboard, team communication channel',
      },
    ],
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },

  // ─────────────────────────────────────────────────────────────
  // 4. LEAD MANAGEMENT & CRM UPDATE
  // ─────────────────────────────────────────────────────────────
  {
    id: 'sop_004',
    title: 'Lead Management & CRM Update',
    frequency: 'weekly',
    owner: 'Growth Lead',
    estimatedMinutes: 30,
    steps: [
      {
        stepNumber: 1,
        action: 'Review all merchant statuses in the LeenqUp Ops pipeline',
        detail:
          'Log into LeenqUp Ops and pull the full merchant pipeline. Sort by outreach status and review every category: not-contacted, contacted, responded, interested, signed-up, declined, not-a-fit. Note the counts in each category. Identify any merchants whose status hasn\'t changed in 7+ days — these are stale and need attention. This review gives you the full picture before making any decisions or assignments.',
        toolUsed: 'LeenqUp Ops dashboard',
      },
      {
        stepNumber: 2,
        action: 'Review and validate outreach logs for accuracy',
        detail:
          'Spot-check outreach logs for a sample of merchants (at least 10) to confirm they are current and accurate. Look for: merchants marked "contacted" with no actual log entries, outreach logs that are weeks old with no follow-up, notes that are too vague to be actionable ("messaged them" with no detail). Flag any team member whose logging is incomplete and follow up directly. Data quality in the pipeline is the foundation of effective outreach — inaccurate records lead to duplicate messages and missed follow-ups.',
        toolUsed: 'LeenqUp Ops dashboard',
      },
      {
        stepNumber: 3,
        action: 'Escalate high-priority leads and assign next steps',
        detail:
          'Identify merchants flagged as "high" priority who have been in "responded" or "interested" status for 3+ days without moving to "signed-up." These are hot leads that are cooling. Assign each to a team member with a specific action and deadline: "Follow up by [date] via WhatsApp, share seller onboarding guide, answer any specific objection they raised." Record the assignment in the merchant profile notes field. High-priority leads should never sit without a next step for more than 48 hours.',
        toolUsed: 'LeenqUp Ops dashboard, team communication channel',
      },
      {
        stepNumber: 4,
        action: 'Sync completed signups and new merchant data to Notion',
        detail:
          'For any merchants who have signed up since last week\'s CRM update, export their key details and add them to the seller tracking database in Notion. Capture: merchant name, business category, location, outreach channel, who closed them, and the date they signed up. This Notion record is the source of truth for leadership reporting and investor updates — it must always reflect current reality. Do not sync merchants who have not yet fully completed registration.',
        toolUsed: 'Notion, LeenqUp Ops dashboard',
      },
      {
        stepNumber: 5,
        action: 'Send weekly pipeline report to leadership',
        detail:
          'Write and send a brief weekly pipeline report via email or team channel. Format: (1) Total merchants in pipeline by status (table format, 1 row per status), (2) New contacts this week, (3) New signups this week, (4) High-priority leads currently in progress and their status, (5) Any blockers or patterns worth leadership attention (e.g., "3 merchants said they don\'t have smartphones — we may need a web-first onboarding option"). Keep the report to one page or screen — this is a visibility tool, not a comprehensive analysis.',
        toolUsed: 'Gmail, Notion, LeenqUp Ops dashboard',
      },
      {
        stepNumber: 6,
        action: 'Replenish the outreach pipeline with new merchant prospects',
        detail:
          'Based on the current pipeline count, assess whether the "not-contacted" pool has enough leads for the next 7 days of daily outreach (target: at least 50 uncontacted prospects at any given time). If the pool is running low, add new merchants from research sources: Instagram searches for Liberian businesses, Facebook Liberian seller groups, referrals from existing sellers, market research in specific categories that are underrepresented. Add each new merchant to LeenqUp Ops with all available contact information, category, priority level, and source.',
        toolUsed: 'LeenqUp Ops dashboard, Instagram, Facebook',
      },
    ],
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },

  // ─────────────────────────────────────────────────────────────
  // 5. COMMUNITY MANAGEMENT
  // ─────────────────────────────────────────────────────────────
  {
    id: 'sop_005',
    title: 'Community Management',
    frequency: 'daily',
    owner: 'Community Manager',
    estimatedMinutes: 30,
    steps: [
      {
        stepNumber: 1,
        action: 'Monitor the LeenqUp Facebook community group for new posts and comments',
        detail:
          'Open the LeenqUp Facebook community group. Review all posts and comments from the past 12-24 hours. Look for: questions from buyers or sellers, complaints or concerns, seller promotions (ensure they follow group rules), misinformation about the platform, and high-energy positive posts worth amplifying. Do not just scroll — take notes. Any post that requires an official response from LeenqUp should be flagged before moving on.',
        toolUsed: 'Facebook',
      },
      {
        stepNumber: 2,
        action: 'Respond to all unanswered questions in the community group',
        detail:
          'For every buyer or seller question in the Facebook group that hasn\'t received a clear, accurate response, post a reply within the session. Use approved brand voice — warm, direct, knowledgeable. For questions about trust and safety, use approved trust language: "identity confirmed," "business details provided," "activity record," "proof-based." Do not make promises about features or timelines that haven\'t been confirmed by leadership. If you don\'t know the answer, say "Let me check on that and get back to you" and follow through.',
        toolUsed: 'Facebook, LeenqUp Ops Brand Responses',
      },
      {
        stepNumber: 3,
        action: 'Flag seller issues and escalate where needed',
        detail:
          'While reviewing the group, watch for signs of seller issues: buyers complaining about a specific seller, a seller posting content that violates community guidelines, disputes about orders or payments. Do not try to resolve seller disputes publicly in the community group. Acknowledge the issue publicly ("We\'ve seen this and are looking into it — please also DM us directly"), then escalate to the appropriate internal team member (support or operations) via the ops channel with full context. Log the escalation.',
        toolUsed: 'Facebook, LeenqUp Ops dashboard, team communication channel',
      },
      {
        stepNumber: 4,
        action: 'Post the daily engagement prompt',
        detail:
          'Every day, post one engagement prompt in the Facebook community group and/or Instagram Story. This is a simple, open-ended question or conversation starter that gets the community talking. Examples: "What\'s the best thing you\'ve bought from a Liberian seller?" / "Sellers — what\'s your most popular product right now?" / "If you could shop from any seller in Duala Market online, who would it be?" / "What would make you feel more confident buying online from a Liberian seller?" Keep prompts light, fun, and community-rooted. Do not post the same style of prompt two days in a row.',
        toolUsed: 'Facebook, Instagram',
      },
      {
        stepNumber: 5,
        action: 'Highlight a community member — buyer, seller, or contributor',
        detail:
          'Once per day, identify one community member to highlight. This could be: a seller who just made their first sale, a buyer who left a thoughtful review, a community member who answered someone else\'s question helpfully, or a diaspora buyer who shared a story about receiving their order. Write a brief, genuine shoutout — tag them (with their permission if it\'s a personal story), celebrate what they did, and make them feel seen. These highlights are among the highest-performing organic content pieces and build loyalty faster than any advertisement.',
        toolUsed: 'Facebook, Instagram, WhatsApp',
      },
      {
        stepNumber: 6,
        action: 'Check WhatsApp community channel and respond to any messages',
        detail:
          'Open the LeenqUp WhatsApp community channel. Review any messages or replies from community members. Respond to direct questions or concerns. If the channel has been quiet for 24+ hours, post a brief check-in: a new seller spotlight, a reminder about a platform feature, or a product recommendation. Keep the WhatsApp channel active without overwhelming it — 1-2 posts per day from the admin side is the right cadence.',
        toolUsed: 'WhatsApp',
      },
      {
        stepNumber: 7,
        action: 'Log community health notes for the weekly review',
        detail:
          'At the end of each community management session, spend 2-3 minutes writing a brief note in the ops dashboard under "Community Health." Note: overall mood (positive, mixed, concerned), any recurring themes in questions or complaints, standout posts or members from the day, and any escalations made. These daily notes compile into the weekly community report reviewed by the Content Lead and leadership. Consistency here makes the weekly review fast and useful.',
        toolUsed: 'LeenqUp Ops dashboard',
      },
    ],
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
]
