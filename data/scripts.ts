import type { Script } from '@/types'

export const scripts: Script[] = [
  // ── COLD OUTREACH ────────────────────────────────────────────

  {
    id: 'scr_001',
    title: 'Cold WhatsApp — fashion seller, Monrovia, first contact',
    body: `Good evening! 🙏 My name is [Name] from LeenqUp.

I came across your page and I love your fashion collection — the lappa sets especially are beautiful.

I'm reaching out because we're building a marketplace specifically for Liberian sellers like you, and we'd love to invite you to join before our public launch.

LeenqUp gives you a real digital storefront where your identity is confirmed and your transaction history is visible to buyers — including diaspora buyers in the US who are looking to buy from trusted Liberian businesses.

Would you be open to a quick chat? I can explain how it works and what's in it for you as an early seller. 🇱🇷`,
    channel: 'whatsapp',
    type: 'cold-outreach',
    persona: 'fashion-seller',
    stage: 'first-contact',
    tags: ['cold', 'fashion', 'monrovia', 'first-contact', 'whatsapp'],
    notes: 'Use after finding seller on Instagram or Facebook. Personalize the compliment based on what you see on their page.',
    createdAt: '2026-03-10T09:00:00Z',
    updatedAt: '2026-03-12T10:00:00Z',
  },
  {
    id: 'scr_002',
    title: 'Cold Instagram DM — fashion seller, lappa/gele focus',
    body: `Hi [Name]! 👋

Your lappa styles are stunning — I've been following your page for a little while and your work is really impressive.

I'm part of the team at LeenqUp, a new marketplace we're building for Liberian sellers. We're inviting a small group of fashion sellers to join before we go live to the public.

The idea is simple: you get a real business profile with your identity confirmed, diaspora buyers in the US can discover you and buy directly, and every sale comes with an automatic receipt so your transaction history builds over time.

We'd love to have you as one of our early sellers. Can I send you more details? 🙏`,
    channel: 'instagram-dm',
    type: 'cold-outreach',
    persona: 'fashion-seller',
    stage: 'first-contact',
    tags: ['cold', 'fashion', 'instagram-dm', 'lappa', 'first-contact'],
    notes: 'Keep it short. The goal is to get a "yes" to receiving more info — not to close on the first message.',
    createdAt: '2026-03-10T10:00:00Z',
    updatedAt: '2026-03-12T11:00:00Z',
  },
  {
    id: 'scr_003',
    title: 'Cold email — beauty salon, formal intro',
    body: `Subject: Invitation to join LeenqUp — Early Seller Access

Good morning [Name],

I hope this message finds you well. My name is [Rep Name], and I'm reaching out on behalf of LeenqUp, a new marketplace platform designed specifically for Liberian businesses.

We came across [Business Name] and were impressed by your work in the beauty and hair industry. We're currently inviting a select group of established Liberian businesses to join our platform before our public launch — and we'd love to include you.

Here's what LeenqUp offers early sellers:
• A professional business profile with identity confirmed and business details provided
• Visibility to diaspora buyers in the United States actively looking to support Liberian businesses
• Automatic receipt generation for every transaction, building your activity record over time
• No monthly fees during the launch period

We believe businesses like yours deserve a platform that represents them professionally and connects them to the broader Liberian market.

I'd welcome the opportunity to schedule a quick call or share our seller overview document if that would be helpful.

Warm regards,
[Rep Name]
LeenqUp Merchant Partnerships`,
    channel: 'email',
    type: 'cold-outreach',
    persona: 'beauty-business',
    stage: 'first-contact',
    tags: ['cold', 'beauty', 'email', 'formal', 'first-contact'],
    notes: 'Send Monday–Wednesday mornings for best open rates. Attach or link the seller one-pager.',
    createdAt: '2026-03-11T09:00:00Z',
    updatedAt: '2026-03-13T10:00:00Z',
  },
  {
    id: 'scr_004',
    title: 'Cold WhatsApp — food vendor, checkpoint/restaurant',
    body: `How de body! 😊 I'm [Name] from LeenqUp.

I heard about [Business Name] through [mutual contact / came across your page] and I want to say — the food looks amazing.

I'm reaching out because LeenqUp is building a marketplace for Liberian food vendors, and we think you'd be a perfect fit for our early cohort.

Here's the simple idea: your business gets a proper profile — identity confirmed, your menu up, your business details provided — and buyers who can't come to you in person can pre-order and pay securely. That includes diaspora buyers who want to arrange meals for family in Liberia.

We're still pre-launch, so now is the best time to join. Interested in hearing more? Just say the word and I'll send you the full details. 🙏🍽️`,
    channel: 'whatsapp',
    type: 'cold-outreach',
    persona: 'food-vendor',
    stage: 'first-contact',
    tags: ['cold', 'food-vendor', 'whatsapp', 'first-contact', 'checkpoint'],
    notes: 'Lead with the diaspora angle if the vendor has any US market awareness. Otherwise lead with the digital storefront angle.',
    createdAt: '2026-03-12T09:00:00Z',
    updatedAt: '2026-03-14T10:00:00Z',
  },

  // ── WARM INTRO ───────────────────────────────────────────────

  {
    id: 'scr_005',
    title: 'Warm WhatsApp — food vendor already aware of LeenqUp',
    body: `Good morning [Name]! Hope the day is treating you well. 🙏

I know you've heard about LeenqUp before — I just wanted to follow up personally and let you know we're getting very close to launch.

We've already had so many food vendors ask about joining, and I want to make sure [Business Name] gets a spot in the first cohort before we open to everyone.

Early sellers get priority listing, direct support from our team, and first access to our diaspora buyer audience. It's genuinely worth getting in now before the platform fills up.

Can I walk you through the setup? It's simple — usually takes less than 20 minutes to get your profile live. 📲`,
    channel: 'whatsapp',
    type: 'warm-intro',
    persona: 'food-vendor',
    stage: 'second-touch',
    tags: ['warm', 'food-vendor', 'whatsapp', 'second-touch', 'early-cohort'],
    createdAt: '2026-03-15T09:00:00Z',
    updatedAt: '2026-03-16T10:00:00Z',
  },
  {
    id: 'scr_006',
    title: 'Warm email — fashion seller referred by mutual contact',
    body: `Subject: LeenqUp — [Mutual Contact] suggested I reach out

Hi [Name],

[Mutual Contact] spoke very highly of your work and suggested you might be open to hearing about what we're building at LeenqUp.

We're a marketplace for Liberian sellers — fashion, beauty, food, events — with a specific focus on connecting Liberian businesses with diaspora buyers in the United States.

Given the quality of your fashion line, we think you'd be exactly the kind of seller our diaspora buyers are looking for. Your business profile would show your identity confirmed, your business details, and your transaction history — so buyers who don't know you personally can still shop with confidence.

I've attached a quick overview. If you have 15 minutes this week for a call, I'd love to walk you through it in detail.

Thank you — and thank you to [Mutual Contact] for making the introduction.

Best,
[Rep Name]`,
    channel: 'email',
    type: 'warm-intro',
    persona: 'fashion-seller',
    stage: 'first-contact',
    tags: ['warm', 'fashion', 'email', 'referral', 'first-contact'],
    notes: 'Works best when the referrer has already primed the contact. Ask the referrer to send a quick WhatsApp first if possible.',
    createdAt: '2026-03-16T10:00:00Z',
    updatedAt: '2026-03-17T09:00:00Z',
  },

  // ── FOLLOW-UP ────────────────────────────────────────────────

  {
    id: 'scr_007',
    title: 'Follow-up WhatsApp — no response after 5 days (fashion)',
    body: `Hi [Name] 👋 Just checking back in — I know things get busy!

I reached out a few days ago about LeenqUp, the marketplace for Liberian sellers. I don't want to bother you, but I also don't want you to miss the early seller window before we go live.

If now isn't a good time, just let me know and I'll circle back later. And if you have any questions at all, I'm happy to answer them. 🙏`,
    channel: 'whatsapp',
    type: 'follow-up',
    persona: 'fashion-seller',
    stage: 'second-touch',
    tags: ['follow-up', 'fashion', 'whatsapp', 'no-response', 'second-touch'],
    notes: 'Send 5–7 days after first contact with no response. Keep it light — do not pressure.',
    createdAt: '2026-03-18T09:00:00Z',
    updatedAt: '2026-03-18T09:00:00Z',
  },
  {
    id: 'scr_008',
    title: 'Follow-up SMS — third touch, short and direct',
    body: `Hi [Name], this is [Rep] from LeenqUp. I've reached out a couple times about our early seller program for Liberian businesses. I don't want to keep messaging if it's not a good fit — but if there's a better time to connect or a question I can answer, just reply here. Happy to help. 🙏`,
    channel: 'sms',
    type: 'follow-up',
    persona: 'general-merchant',
    stage: 'third-touch',
    tags: ['follow-up', 'sms', 'third-touch', 'short-form'],
    notes: 'Use as a last-resort touch before marking as "no response." SMS often gets opened when WhatsApp does not.',
    createdAt: '2026-03-20T09:00:00Z',
    updatedAt: '2026-03-20T09:00:00Z',
  },
  {
    id: 'scr_009',
    title: 'Follow-up email — after sending info, no reply in 1 week',
    body: `Subject: Following up — LeenqUp seller opportunity

Hi [Name],

I sent over the LeenqUp seller overview last week and wanted to follow up in case it got buried.

I know running a business keeps you busy — so I'll keep this brief. If you have 10 minutes to review the overview and let me know your thoughts, I'd really appreciate it. And if it's not the right time, just let me know and I'll check back in a month.

The early cohort spots are filling up, so I want to make sure you have the chance to claim yours before we open to the general public.

Thanks again for your time.

[Rep Name]
LeenqUp`,
    channel: 'email',
    type: 'follow-up',
    persona: 'general-merchant',
    stage: 'second-touch',
    tags: ['follow-up', 'email', 'second-touch', 'after-info-sent'],
    createdAt: '2026-03-22T10:00:00Z',
    updatedAt: '2026-03-22T10:00:00Z',
  },

  // ── OBJECTION HANDLING ───────────────────────────────────────

  {
    id: 'scr_010',
    title: 'Objection: "I already sell through my own channels, why do I need this?"',
    body: `That's completely fair — a lot of our sellers were already doing good business through their own networks before joining us.

Here's the difference LeenqUp makes:

Right now, buyers have to trust you based on a message and a prayer. On LeenqUp, your identity is confirmed, your business details are provided, and your transaction history is visible — so new buyers who've never heard of you before will still buy from you confidently.

It also opens you up to diaspora buyers in the US. Those buyers can't ask around the neighborhood to verify you. They need to see a real profile with proof-based ratings. That's a reach informal networks can't give you.

And practically: every sale on LeenqUp generates an automatic receipt. No more chasing payment records or trying to remember who paid what.

Your existing networks are great for keeping in touch with existing customers. LeenqUp is how you reach buyers you've never met. 🙏`,
    channel: 'whatsapp',
    type: 'objection-handling',
    persona: 'general-merchant',
    stage: 'objection',
    tags: ['objection', 'whatsapp-comparison', 'why-leenqup', 'diaspora-angle'],
    notes: 'This is the most common objection. Memorize the three key points: trust infrastructure, diaspora reach, automatic receipts.',
    createdAt: '2026-03-14T10:00:00Z',
    updatedAt: '2026-03-16T11:00:00Z',
  },
  {
    id: 'scr_011',
    title: 'Objection: "What are the fees? I don\'t want to pay platform fees."',
    body: `Totally understand — fees are the first thing any smart seller asks about.

Here's where we stand: during our launch period, we're not charging monthly listing fees. We take a small transaction percentage on completed sales — similar to how Mobile Money takes a small cut, but only when money actually moves.

So you're not paying to list. You're not paying a monthly subscription. You pay a percentage only when you make a sale. If you don't sell, you don't pay us anything.

And consider what you get: a professional business profile with your identity confirmed, access to diaspora buyers you can't reach through informal channels, automatic receipts that protect you from disputes, and a rating that builds your credibility over time.

The fee structure is designed so that our incentives are aligned with yours — we only earn when you earn. 🙏

Would you like me to send you the full fee breakdown?`,
    channel: 'whatsapp',
    type: 'objection-handling',
    persona: 'fashion-seller',
    stage: 'objection',
    tags: ['objection', 'fees', 'pricing', 'commission'],
    notes: 'Fill in the actual commission % before using. Do not leave this vague in live conversations.',
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-03-17T11:00:00Z',
  },
  {
    id: 'scr_012',
    title: 'Objection: "I don\'t have time to manage another platform."',
    body: `I hear you — and honestly, that's why we designed LeenqUp the way we did.

Setting up your profile takes about 20 minutes. After that, managing it is not a separate job — it's tied to your existing sales. When an order comes in, you fulfill it just like you do now. The platform handles the receipts, the payment records, and the rating automatically.

You're not managing a new platform. You're doing the same work you already do — but now with a professional profile that new buyers can trust, and receipts that happen without you having to do anything.

A lot of our sellers say LeenqUp actually saves them time because they're spending less time answering "are you legit?" questions from new buyers. Your profile answers that before they even message you. 🙏`,
    channel: 'whatsapp',
    type: 'objection-handling',
    persona: 'food-vendor',
    stage: 'objection',
    tags: ['objection', 'time', 'ease-of-use', 'onboarding'],
    createdAt: '2026-03-16T10:00:00Z',
    updatedAt: '2026-03-18T09:00:00Z',
  },

  // ── CLOSE ────────────────────────────────────────────────────

  {
    id: 'scr_013',
    title: 'Close WhatsApp — ready to sign up, fashion seller',
    body: `Wonderful! I'm so glad to hear you're ready to move forward. 🎉

Here's how we get you set up:

1️⃣ I'll send you the seller registration link — it takes about 15–20 minutes to complete
2️⃣ Upload a clear photo of your ID (this is how we confirm your identity — one-time only)
3️⃣ Add your business details: name, category, location, payment method (Orange Money, bank, etc.)
4️⃣ Upload 3–5 product photos to get your storefront started

Once your profile is reviewed (usually within 24–48 hours), you'll be live and ready for buyers to find you.

I'll be here the whole time if you get stuck on anything. And as an early seller, you'll have direct access to our team — so any question, just message me. 🙏

Ready? I'll send the link now 👇`,
    channel: 'whatsapp',
    type: 'close',
    persona: 'fashion-seller',
    stage: 'close',
    tags: ['close', 'sign-up', 'fashion', 'onboarding', 'whatsapp'],
    notes: 'Send the actual registration link immediately after this message. Do not delay.',
    createdAt: '2026-03-20T10:00:00Z',
    updatedAt: '2026-03-21T09:00:00Z',
  },
  {
    id: 'scr_014',
    title: 'Close email — formal signup confirmation for hospitality/guesthouse',
    body: `Subject: LeenqUp — Next Steps to Get Your Business Listed

Dear [Name],

Thank you for our conversation — we're excited to welcome [Business Name] to LeenqUp.

To complete your seller registration, please follow these steps:

1. Complete the seller registration form at [link] — approximately 15 minutes
2. Upload a government-issued ID for identity confirmation (processed securely — this is a one-time requirement)
3. Provide your business details, including your location in [City], operating hours, and primary service categories
4. Add your preferred payment methods — we support Orange Money, LBDI bank transfer, and international card payments

Once your profile is submitted, our team will review and activate it within 1–2 business days. You'll receive a confirmation message via email and WhatsApp when you're live.

As an early seller, you will have priority listing status during our launch period and direct access to our merchant support team.

We're looking forward to featuring [Business Name] on the platform and connecting you with diaspora and local buyers.

Please don't hesitate to reach out if you have any questions.

Warm regards,
[Rep Name]
LeenqUp Merchant Partnerships`,
    channel: 'email',
    type: 'close',
    persona: 'hospitality',
    stage: 'close',
    tags: ['close', 'email', 'hospitality', 'onboarding', 'formal'],
    createdAt: '2026-03-22T10:00:00Z',
    updatedAt: '2026-03-23T09:00:00Z',
  },
  {
    id: 'scr_015',
    title: 'Close WhatsApp — event organizer, final nudge',
    body: `Hey [Name]! Just wanted to circle back one more time before we close early access for event organizers.

We have a small number of spots left in the first cohort, and I'd hate for you to miss it — especially given how well [Event Business Name] is positioned. Event organizers on LeenqUp can list upcoming events, sell tickets with proof-based transaction records, and reach diaspora buyers who want to attend or support Liberian events from abroad.

No one else in Liberia is offering this kind of platform for event sellers right now. You'd be getting in on the ground floor.

If you're ready, I can send the signup link right now and have you live within 48 hours. What do you say? 🙏🎉`,
    channel: 'whatsapp',
    type: 'close',
    persona: 'event-organizer',
    stage: 'close',
    tags: ['close', 'event-organizer', 'urgency', 'whatsapp', 'final-nudge'],
    createdAt: '2026-03-24T10:00:00Z',
    updatedAt: '2026-03-25T09:00:00Z',
  },

  // ── DIASPORA BUYER SCRIPTS ───────────────────────────────────

  {
    id: 'scr_016',
    title: 'Diaspora buyer DM — Instagram, how to buy gifts for family',
    body: `Hi [Name]! 👋

Saw your comment about wanting to send something home to Liberia for [occasion] — we'd love to help with that!

LeenqUp is a marketplace of real Liberian sellers — fashion, food, beauty, gifts. Every seller has their identity confirmed and a transaction history, so you know exactly who you're buying from before you spend a dollar.

Here's how it works for diaspora buyers:
1. Browse sellers by category or city
2. Pick what you want to send to your family
3. Pay securely (card, PayPal, or Zelle for US buyers)
4. The seller delivers to your family's address in Liberia — and you get a receipt

It's the easiest way to send a real gift home — not just money. 🎁🇱🇷

Want me to send you the link to browse? We're launching soon and have early access open now.`,
    channel: 'instagram-dm',
    type: 'warm-intro',
    persona: 'diaspora-buyer',
    stage: 'first-contact',
    tags: ['diaspora-buyer', 'instagram-dm', 'gift-sending', 'how-it-works'],
    notes: 'Trigger: buyer comments on a LeenqUp post or mentions wanting to send something home. Move fast — intent is high in the moment.',
    createdAt: '2026-03-18T10:00:00Z',
    updatedAt: '2026-03-19T09:00:00Z',
  },
  {
    id: 'scr_017',
    title: 'Diaspora buyer cold email — Liberian community org outreach',
    body: `Subject: Shop Liberian, Send Home — Introducing LeenqUp

Dear [Name / Community Organization],

I hope this message finds you well. I'm reaching out on behalf of LeenqUp, a new marketplace platform connecting Liberian-owned businesses with buyers — particularly members of the Liberian diaspora in the United States.

We know how much the diaspora community cares about supporting businesses back home. We also know how difficult it can be to do that in a way that's safe, reliable, and doesn't require navigating informal buying channels or hoping for the best after a money transfer.

LeenqUp changes that. Our platform features:
• Liberian sellers with identity confirmed profiles and business details provided
• Receipt-backed transactions — so you always have proof of what you paid for
• Delivery coordination to addresses in Liberia
• Categories including fashion, food, beauty, gifts, and event tickets

We'd love to partner with [Organization] to introduce LeenqUp to your community. Whether that's a mention in your newsletter, a shared social post, or a brief introduction at your next gathering — we're happy to work with whatever fits your community best.

If you'd like to learn more or schedule a call, please reply to this email or visit LeenqUp.com.

Thank you for everything you do for the Liberian diaspora community.

Warm regards,
[Rep Name]
LeenqUp`,
    channel: 'email',
    type: 'cold-outreach',
    persona: 'diaspora-buyer',
    stage: 'first-contact',
    tags: ['diaspora-buyer', 'email', 'community-org', 'partnership'],
    notes: 'Target Liberian community organizations in Minneapolis, Staten Island, Atlanta, Greensboro, Providence.',
    createdAt: '2026-03-20T10:00:00Z',
    updatedAt: '2026-03-21T09:00:00Z',
  },

  // ── SPECIALTY PERSONAS ───────────────────────────────────────

  {
    id: 'scr_018',
    title: 'Cold WhatsApp — beauty/hair business, Monrovia',
    body: `Good afternoon! ☀️ My name is [Name] from LeenqUp.

I came across [Salon Name] and I'm really impressed — your work speaks for itself.

I'm building a marketplace for Liberian beauty businesses and we'd love to have you in our first cohort. A lot of diaspora clients specifically look for Liberian hair and beauty services when they're visiting home — and right now, there's no easy way for them to find you and book in advance.

LeenqUp would give you a real digital profile — identity confirmed, your services listed, your business details provided — so clients can find you, see your work, and book or pre-pay before they even arrive in Monrovia.

Is this something you'd be interested in exploring? Happy to share more details. 🙏💅`,
    channel: 'whatsapp',
    type: 'cold-outreach',
    persona: 'beauty-business',
    stage: 'first-contact',
    tags: ['cold', 'beauty', 'hair', 'monrovia', 'whatsapp', 'first-contact'],
    createdAt: '2026-03-22T09:00:00Z',
    updatedAt: '2026-03-23T10:00:00Z',
  },
  {
    id: 'scr_019',
    title: 'Objection handling — "Is LeenqUp safe? How do I know my money is protected?"',
    body: `That's the most important question — and I'm glad you asked it directly.

Here's how buyer protection works on LeenqUp:

First, every seller on the platform has their identity confirmed before they go live. We verify their ID and business details. If a seller misrepresents themselves, we have their real information on file.

Second, every transaction generates an automatic receipt tied to both buyer and seller. That's not a screenshot — it's a platform-generated, receipt-backed record that both parties can access.

Third, if something goes wrong, you can open a dispute through the platform. Because the transaction is fully documented — payment record, seller profile, order details — we can investigate and resolve it fairly.

We don't say your money is "guaranteed." We say it's protected by proof-based records and a real seller identity. That's a stronger foundation than informal channels can offer. 🙏

Any other questions? I'm happy to walk you through anything.`,
    channel: 'whatsapp',
    type: 'objection-handling',
    persona: 'local-buyer',
    stage: 'objection',
    tags: ['objection', 'buyer-safety', 'trust', 'dispute', 'proof-based'],
    createdAt: '2026-03-25T10:00:00Z',
    updatedAt: '2026-03-26T09:00:00Z',
  },
  {
    id: 'scr_020',
    title: 'Close WhatsApp — food vendor, after positive conversation',
    body: `I'm really glad we connected! Your food business sounds exactly like what our buyers are looking for. 🍽️

Let's get you set up — here's what happens next:

1. I'll send you the seller registration link (takes about 15 minutes)
2. You'll confirm your identity (one-time ID upload — secure and private)
3. Add your menu items and pricing
4. Set your delivery area — whether that's just Paynesville, all of Monrovia, or wherever you operate

Once you're approved (usually 24–48 hours), diaspora buyers can find you, pre-order, and pay. You'll also show up in our Liberia food category for local buyers near you.

I'm sending the link right now. Let me know if anything is unclear — I'm with you the whole way. 🙏🇱🇷`,
    channel: 'whatsapp',
    type: 'close',
    persona: 'food-vendor',
    stage: 'close',
    tags: ['close', 'food-vendor', 'whatsapp', 'onboarding', 'paynesville'],
    createdAt: '2026-03-28T10:00:00Z',
    updatedAt: '2026-03-29T09:00:00Z',
  },

  // ── FOUNDING MERCHANT OUTREACH ──────────────────────────────

  {
    id: 'scr_016',
    title: 'Cold email — founding merchant invite, short version',
    body: `Subject: Your business deserves to be found — LeenqUp founding merchant invite

Good morning [Name],

I came across [Business Name] and I think what you've built is exactly what LeenqUp was made for.

We're launching a proof-based marketplace for Liberian sellers — and before we open to the public, we're inviting a small founding cohort. Founding merchants get a free digital storefront (no monthly fee), an identity confirmed profile that builds buyer trust before you've ever spoken, priority listing at launch, and immediate visibility to diaspora buyers in the US who are actively looking for Liberian businesses. No setup cost. A small commission only when you make a sale.

If you're open to learning more, I'd love to tell you about it — or you can apply directly at LeenqUp.com. The founding cohort is small by design and spots are closing soon. We'd genuinely love to have [Business Name] in it.

Warm regards,
[Rep Name]
LeenqUp Merchant Partnerships`,
    channel: 'email',
    type: 'cold-outreach',
    persona: 'general-merchant',
    stage: 'first-contact',
    tags: ['founding-merchant', 'cold', 'email', 'short', 'first-contact'],
    notes: 'Use when you have a name and business but limited context. Keep subject line clean — do not change it. Personalize the first line with something specific about their business.',
    createdAt: '2026-04-21T08:00:00Z',
    updatedAt: '2026-04-21T08:00:00Z',
  },
  {
    id: 'scr_017',
    title: 'Cold email — founding merchant invite, detailed version with full benefits',
    body: `Subject: Invitation: Founding Merchant Storefront — LeenqUp (launching soon)

Good morning [Name],

My name is [Rep Name], and I'm reaching out on behalf of LeenqUp — a new marketplace we're building specifically for Liberian businesses and the buyers who want to support them.

We came across [Business Name] and believe you'd be a strong fit for our founding merchant cohort. Before we open to the public, we're inviting a small, curated group of established businesses to launch with us. Here's exactly what that includes:

🏪 Free digital storefront
A complete business profile built with our team — your story, your products, your payment options. No setup fee. No monthly subscription. You pay a small commission only when you complete a sale.

✅ Identity confirmed profile
Your business details go on file with us. Buyers — especially diaspora buyers in the US who can't verify you in person — see exactly who they're buying from before any money moves. That trust converts browsers into paying customers.

🌍 Diaspora buyer discovery
Hundreds of thousands of Liberian-Americans are actively looking for ways to support businesses back home. Right now, most of them can't find you. Founding merchants are the first sellers this audience sees when we go live.

🥇 Priority listing at launch
Founding merchants appear first in search results the moment we open to the public. First in, first found — and that position stays with you as your activity record grows.

⭐ Proof-based ratings from your first sale
Every completed order automatically builds your public activity record. Your reputation grows visibly with every transaction, before any new buyer has ever spoken to you.

🤝 Direct team access throughout setup
During the founding period, you have a direct line to our team. We help you set up, answer questions, and make sure your storefront represents your business the right way. You're not navigating this alone.

📖 Your place in the founding story
Every platform remembers who showed up first. Founding merchants are recognized as LeenqUp originals — and buyers will see that from day one.

The founding cohort is intentionally small. We want to work closely with every business we bring on so each one launches with a complete, compelling profile that actually converts.

I'd welcome a brief call or can share our founding merchant overview if helpful. Or you can apply directly at LeenqUp.com — spots are limited and closing soon.

Warm regards,
[Rep Name]
LeenqUp Merchant Partnerships
[email] | LeenqUp.com`,
    channel: 'email',
    type: 'cold-outreach',
    persona: 'general-merchant',
    stage: 'first-contact',
    tags: ['founding-merchant', 'cold', 'email', 'detailed', 'benefits', 'first-contact'],
    notes: 'Use for higher-priority leads where you want to give the full picture upfront. Works especially well for hospitality businesses (guesthouses, restaurants) and established fashion/beauty sellers.',
    createdAt: '2026-04-21T08:00:00Z',
    updatedAt: '2026-04-21T08:00:00Z',
  },
]
