import { BrandResponse } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// BRAND VOICE
// ─────────────────────────────────────────────────────────────────────────────

export const brandVoice = {
  attributes: [
    'Trust-first',
    'Community-rooted',
    'Mobile-first',
    'Warm and direct',
    'Aspirational but grounded',
  ],
  toneGuidance:
    'Write like a trusted friend who knows the Liberian market deeply. Confident but never arrogant. Clear but never cold. Celebratory of African enterprise, not patronizing about it.',
  approvedTrustLanguage: [
    'identity confirmed',
    'business details provided',
    'transaction history',
    'receipt-backed',
    'activity record',
    'proof-based',
    'seller history',
    'business profile on file',
  ],
  forbiddenLanguage: [
    'verified',
    'guaranteed',
    'fully safe',
    'guaranteed safe',
    '100% safe',
    'risk-free',
  ],
  voiceExamples: {
    good: 'This seller has a complete business profile and a transaction history on LeenqUp.',
    bad: 'This seller is verified and guaranteed safe to buy from.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// BRAND RESPONSES
// ─────────────────────────────────────────────────────────────────────────────

export const brandResponses: BrandResponse[] = [
  // ───────────────────────────────────────────────
  // BUYER QUESTIONS (5)
  // ───────────────────────────────────────────────
  {
    id: 'br_001',
    trigger: 'How does buying on LeenqUp work?',
    audience: 'buyer',
    channel: 'any',
    tags: ['buyer', 'how-it-works', 'onboarding'],
    response: `Great question — here's the short version:

Browse the LeenqUp marketplace and find a seller or product you like. Check the seller's profile — you'll see their business details on file, their activity record, and reviews from other buyers who have actually purchased from them.

When you're ready, add items to your cart and check out. We support Orange Money for buyers in Liberia, and card payments for diaspora buyers. After you pay, your order is confirmed and the seller is notified immediately. You can track your order status right in the app.

When your order arrives, you'll receive a receipt-backed confirmation — and we encourage you to leave a review so other community members can benefit from your experience.

The whole process is designed so you always know who you're buying from and there's always a record of what happened. No "just trust me" — just real proof.

Any other questions? We're always here.`,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
  {
    id: 'br_002',
    trigger: 'Is it safe to buy on LeenqUp? How do I know I can trust the sellers?',
    audience: 'buyer',
    channel: 'any',
    tags: ['buyer', 'trust', 'safety', 'proof-based'],
    response: `We understand why you're asking — online shopping in Liberia has a complicated history, and trust is something you earn, not something you claim.

Here's what we actually do to make buying on LeenqUp something you can feel good about:

Every seller on LeenqUp has their identity confirmed before they can list a single product. Their business details are on file with us — we know who they are and how to reach them. This isn't just a checkbox. It means there's a real person behind every storefront, and there's accountability if something goes wrong.

Every seller also has a visible activity record on their profile. You can see how many orders they've completed, how long they've been on the platform, and what real buyers have said about their experience. These reviews are receipt-backed — meaning only people who actually purchased can leave them. No fake reviews.

And every transaction generates a receipt that's stored in our system. If there's ever a dispute, there's a paper trail.

We don't promise perfection — no platform can. But we promise accountability. And that's what actually protects you.`,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
  {
    id: 'br_003',
    trigger: 'How do I pay on LeenqUp? Do you accept Orange Money?',
    audience: 'buyer',
    channel: 'any',
    tags: ['buyer', 'payments', 'orange-money', 'checkout'],
    response: `Yes — Orange Money is one of our primary payment methods, and we built our checkout to make it as smooth as possible.

Here's what we currently support:

**Orange Money** — the fastest and most familiar option for buyers in Liberia. You'll be prompted to authorize the payment directly from your phone, just like you do for any other Orange Money transaction.

**Mobile banking / bank transfer** — for buyers who prefer to pay via their bank account.

**Card payments (USD)** — for diaspora buyers paying from the US or elsewhere. We support major debit and credit cards through our payment processor.

To pay: add your items to your cart, go to checkout, select your payment method, follow the prompts, and you're done. You'll receive an order confirmation and a receipt immediately after payment goes through.

If you run into any issue at checkout — a payment that doesn't go through, a confirmation that doesn't arrive — contact us right away. We'll resolve it quickly.

More payment options are on the way. We're working to make sure everyone, wherever they are, has a way to shop Liberian.`,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
  {
    id: 'br_004',
    trigger: "What happens if a seller doesn't deliver my order?",
    audience: 'buyer',
    channel: 'any',
    tags: ['buyer', 'disputes', 'fulfillment', 'support'],
    response: `We take this seriously, and we have a clear process for it.

First, here's what typically prevents this from happening: every seller on LeenqUp has their identity confirmed and business details on file. They're accountable in a way that anonymous sellers in informal networks simply are not. And their activity record is public — so sellers who don't fulfill orders get reviews that reflect that, which affects their ability to make future sales. Accountability is built into the system.

But if it does happen:

**Step 1:** Contact the seller directly through the LeenqUp messaging system. Sometimes delays happen — a message through the platform creates a logged record of your attempt to reach them.

**Step 2:** If the seller doesn't respond within 24-48 hours, contact LeenqUp support directly. Reply to any of our emails, DM us on Instagram, or use the support button in the app.

**Step 3:** We will review your order record, the receipt-backed transaction log, and any communication history. If the seller has failed to fulfill a confirmed, paid order, we will intervene — including issuing a refund or facilitating a resolution.

Your money is not gone just because a seller goes quiet. We have the records, and we'll use them.`,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
  {
    id: 'br_005',
    trigger: 'How do I contact a seller on LeenqUp?',
    audience: 'buyer',
    channel: 'any',
    tags: ['buyer', 'messaging', 'seller-contact'],
    response: `Easy — every seller on LeenqUp has a direct messaging feature on their storefront page.

When you visit a seller's profile, you'll see a "Message Seller" button. Click that and you can send them a direct message through the LeenqUp platform. The seller receives a notification and can reply directly from their dashboard.

This is important: we recommend communicating through LeenqUp's messaging system rather than jumping to external messaging apps or Instagram DMs — even if the seller offers their personal number. Here's why: messages sent through LeenqUp are part of your order record. If there's ever a dispute, that communication is documented and available for review.

Sellers with a strong activity record typically respond within a few hours. If a seller isn't responding to your messages within 24-48 hours, that's worth noting — and worth contacting us about.

We designed the messaging system to keep the experience clean, accountable, and on the record. It's part of what makes LeenqUp different from buying through an informal group.`,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },

  // ───────────────────────────────────────────────
  // SELLER QUESTIONS (5)
  // ───────────────────────────────────────────────
  {
    id: 'br_006',
    trigger: 'How do I sign up as a seller on LeenqUp?',
    audience: 'seller',
    channel: 'any',
    tags: ['seller', 'registration', 'onboarding', 'how-to'],
    response: `Signing up as a seller is straightforward. Here's how it works:

**Step 1: Submit your application**
Go to leenqup.com/sell and fill out the seller registration form. You'll provide your name, business name, category, contact information, and a brief description of what you sell.

**Step 2: Application review**
Our team reviews every application within 1-2 business days. This is where your business details are confirmed and logged in our system. It's a quick process — we're not trying to create barriers, we're making sure the marketplace stays trustworthy for buyers.

**Step 3: Complete your profile**
Once approved, you'll receive an email with a link to complete your seller profile: add your product listings, photos, business story, and payment details.

**Step 4: Go live**
After your profile is complete and your first listing is uploaded, your storefront goes live and buyers can find you — in Liberia and across the diaspora.

The whole process typically takes 3-5 business days from application to your first live listing.

If you have questions at any point during signup, reply to any of our emails or DM us on Instagram. We're happy to walk you through it personally.`,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
  {
    id: 'br_007',
    trigger: 'What are the fees for selling on LeenqUp?',
    audience: 'seller',
    channel: 'any',
    tags: ['seller', 'fees', 'pricing', 'revenue'],
    response: `Transparent answer, because you deserve one:

LeenqUp operates on a commission model — we take a small percentage of each sale you make through the platform. There is no monthly fee, no listing fee, and no cost to create your seller profile. You only pay when you make money.

The exact commission rate is communicated clearly during your seller onboarding. We've set it at a level that keeps the platform running and improving, while ensuring sellers keep the majority of what they earn.

Here's the deal we're making with you: LeenqUp brings you buyers you wouldn't have access to otherwise — diaspora buyers in the US who are actively looking for Liberian products, buyers in Monrovia who prefer the convenience of ordering online, and new customers who discover you through the marketplace. The commission is what makes that reach possible.

There are no hidden fees. No surprise charges. Everything is shown clearly before you confirm a sale.

If you have questions about specific fee structures for your business category or volume, reach out to us directly and we'll walk you through exactly what to expect.`,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
  {
    id: 'br_008',
    trigger: 'How do I get paid as a seller on LeenqUp?',
    audience: 'seller',
    channel: 'any',
    tags: ['seller', 'payments', 'payouts', 'orange-money'],
    response: `Getting paid on LeenqUp is designed to be simple and reliable.

Here's how it works:

**Funds are collected at the time of purchase.** When a buyer pays for your product, the payment is processed through LeenqUp's payment system. You don't have to chase anyone for payment — the buyer pays before the order is confirmed.

**Payouts are released after fulfillment.** Once you mark an order as fulfilled (shipped or delivered), the payout for that order is processed. This fulfillment step is what triggers the release of your funds.

**Payment methods for sellers:**
- **Orange Money** — the fastest payout option for sellers in Liberia. Funds transfer directly to your Orange Money account.
- **Bank transfer** — for sellers with active bank accounts. Slightly longer processing time.
- Payout schedules and timing are communicated during onboarding.

Your payout history and pending amounts are always visible in your seller dashboard. Every payout is receipt-backed and logged — you have a complete transaction history at all times.

If a payout is delayed or something looks wrong, contact us immediately. We take payment accuracy seriously and will resolve any issue quickly.`,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
  {
    id: 'br_009',
    trigger: "What happens if a buyer complains or says they didn't receive their order?",
    audience: 'seller',
    channel: 'any',
    tags: ['seller', 'disputes', 'complaints', 'fulfillment'],
    response: `First — don't panic. This is a process we handle together, and we're here to protect sellers who fulfill their orders honestly.

Here's how disputes work on LeenqUp:

**Step 1: Communication first**
If a buyer reports an issue, the first step is a conversation. We'll ask both parties to share their side. As a seller, your best asset here is your transaction history — if you fulfilled the order, the receipt log shows it.

**Step 2: Evidence review**
Our support team reviews the order record: the receipt-backed transaction log, any messages exchanged through the platform, the order status updates you submitted, and any delivery confirmation. This is why we ask sellers to update order statuses promptly and communicate through the LeenqUp messaging system — it creates a record that protects you.

**Step 3: Resolution**
If the evidence shows you fulfilled the order correctly and the buyer's claim is unfounded, you're protected. If there was a genuine issue with fulfillment, we'll work toward a fair resolution for both parties — which may involve a refund, a replacement, or a partial credit.

The system is built on proof. Sellers who fulfill orders and maintain a clear activity record have strong standing in any dispute. Sellers who disappear or go silent do not.

The best thing you can do is fulfill every order promptly, communicate clearly, and keep your records clean. That's your protection.`,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
  {
    id: 'br_010',
    trigger: 'How do I build trust with buyers on LeenqUp? I\'m new and don\'t have reviews yet.',
    audience: 'seller',
    channel: 'any',
    tags: ['seller', 'trust', 'reviews', 'activity-record', 'new-seller'],
    response: `This is one of the best questions a new seller can ask, and the answer is more actionable than you might think.

Every seller starts with zero reviews. Here's how to build a proof-based reputation quickly:

**1. Complete your profile fully — today.**
A complete profile with a real photo, a clear business description, and detailed product listings signals seriousness. Buyers notice empty profiles and bounce. Fill every field.

**2. Invite your existing customers first.**
The fastest way to build your activity record is to bring people who already trust you. Send your regular customers your LeenqUp store link and ask them to place their next order through the platform. Their completed purchase creates your first transaction history, and if you ask them nicely, their review is your first proof-based social credibility.

**3. Respond fast.**
Your response time shows on your profile. Sellers who respond to messages within a few hours signal reliability to buyers who've never purchased from them before.

**4. Fulfill every early order perfectly.**
Your first 5-10 orders matter disproportionately. Pack well, deliver promptly, update your order status in real time, and follow up with buyers after delivery. A strong start to your activity record attracts new buyers you've never met.

**5. Ask for reviews.**
Don't be shy. After a successful order: "I hope everything arrived well! If you have a moment, a review on my LeenqUp profile would mean so much to my business." Most satisfied buyers will do it — they just need to be asked.

You won't be new for long. Give it 10-15 fulfilled orders and your profile will speak for itself.`,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },

  // ───────────────────────────────────────────────
  // SKEPTIC OBJECTIONS (5)
  // ───────────────────────────────────────────────
  {
    id: 'br_011',
    trigger: "How is LeenqUp different from what I'm already doing? I buy from sellers online already.",
    audience: 'skeptic',
    channel: 'any',
    tags: ['skeptic', 'objection', 'differentiation'],
    response: `That's a fair point — informal buying works for a lot of people, and we're not dismissing it.

But here's what informal channels don't give you:

**No record.** When you pay through an informal channel, the transaction lives in a chat. If the seller disappears or the order doesn't arrive, you have a screenshot and a prayer. On LeenqUp, every transaction is receipt-backed and logged. There's a paper trail.

**No accountability.** Sellers in unverified networks don't have their identity confirmed or business details on file anywhere. Anyone can set up an account and start selling. On LeenqUp, sellers go through a registration process before they list a single product.

**No seller history.** In informal channels, you can't see how many people a seller has successfully sold to. On LeenqUp, you can see a seller's full activity record — orders fulfilled, reviews from real buyers, time on the platform.

**No dispute process.** If something goes wrong with an informal sale, there's no one to call. On LeenqUp, there's a support team and a documented transaction record.

We're not saying you need to stop buying informally. We're saying that for larger purchases, new sellers, or diaspora buyers who can't physically inspect goods — LeenqUp gives you something informal networks can't: proof.`,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
  {
    id: 'br_012',
    trigger: "Why not just use Facebook Marketplace? It's already there.",
    audience: 'skeptic',
    channel: 'any',
    tags: ['skeptic', 'objection', 'facebook', 'differentiation'],
    response: `Facebook Marketplace is useful, and we respect it. But it wasn't built for Liberian commerce — and that difference shows.

Here's what Facebook Marketplace lacks for buyers and sellers in Liberia and the diaspora:

**No Liberian payment integration.** Facebook Marketplace doesn't natively support Orange Money or the mobile money flows that Liberian buyers and sellers actually use. On LeenqUp, Orange Money is built in.

**No seller accountability built for this market.** On Facebook Marketplace, anyone can list anything. There's no registration process, no business profile requirement, no identity confirmation specific to the Liberian context. Scams are common — not because Facebook is bad, but because it wasn't designed to address this specific trust gap.

**No community context.** LeenqUp is built around the Liberian market — Duala Market sellers, diaspora buyers, Liberian product categories, and a community that understands the culture. Facebook is global. We are specific.

**No seller history tied to actual completed transactions.** Facebook reviews and ratings aren't tied to purchase-verified transactions. On LeenqUp, every review is receipt-backed — meaning only real buyers who completed a purchase can leave one.

Facebook is where people discover businesses. LeenqUp is where they buy from them with proof-based trust. Many of our sellers use both — and that's smart.`,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
  {
    id: 'br_013',
    trigger: "I don't trust online shopping in Liberia. Too many scams.",
    audience: 'skeptic',
    channel: 'any',
    tags: ['skeptic', 'objection', 'scams', 'trust', 'liberia'],
    response: `We hear you. And honestly? You're right to be cautious.

The reality of online commerce in Liberia is that trust has been broken repeatedly. Money sent, goods never received. Sellers who disappear. Promises that don't hold. This isn't an unfair perception — it's a lived experience for a lot of people, including people on our own team.

That's exactly why we built LeenqUp the way we did.

We didn't build a platform and hope sellers would be honest. We built a system where accountability is the default:

Every seller has their identity confirmed and business details on file before they can sell anything. This isn't a profile picture and a display name — it's real business information that we hold on record.

Every transaction is receipt-backed. There is always a documented record of what was purchased, from whom, at what price, and what the outcome was.

Every seller's activity record is visible to buyers. You can see exactly how many orders they've fulfilled and what other buyers have said — only buyers who actually completed a purchase can leave a review.

And if something goes wrong, there's a support team and a documented record to work with — not just an unanswered message.

We're not asking you to take our word for it. We're asking you to look at the record. And when you're ready, start with a small purchase from a seller with a strong activity record. See how it goes. We'll be right here.`,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
  {
    id: 'br_014',
    trigger: "I've been scammed before buying from Liberian sellers online. Why would LeenqUp be different?",
    audience: 'skeptic',
    channel: 'any',
    tags: ['skeptic', 'objection', 'scam', 'personal', 'empathy'],
    response: `We're sorry that happened to you. That experience is real, and it's the exact reason platforms like LeenqUp need to exist — and need to actually be different, not just claim to be.

So let us explain specifically what would have been different on LeenqUp:

**The seller would have had their identity confirmed.** Not just a Facebook account with a business name. Actual business details — submitted, logged, and on file with us. That accountability alone changes seller behavior.

**The transaction would have been receipt-backed.** Every purchase on LeenqUp generates a receipt that's stored in our system. Your payment isn't just a screenshot in a chat — it's a logged record that both parties can point to.

**You would have had somewhere to go.** If the seller went silent, you could have contacted LeenqUp support with an order record, a receipt, and documented communication. That's a very different situation than chasing someone through informal channels with no recourse.

**The seller's activity record would have been visible.** If the seller had a history of not fulfilling orders, other buyers' reviews would have shown it before you ever sent a payment.

We can't undo what happened to you. But we can tell you: the system we've built is specifically designed so that what happened to you cannot happen quietly, without accountability, on LeenqUp.

We'd be honored to earn your trust back. Start small, whenever you're ready.`,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
  {
    id: 'br_015',
    trigger: 'Is my money safe on LeenqUp?',
    audience: 'skeptic',
    channel: 'any',
    tags: ['skeptic', 'objection', 'money', 'payments', 'trust'],
    response: `We won't tell you your money is "100% safe" or "guaranteed" — because no honest platform makes blanket claims like that, and you'd be right not to trust one that does.

Here's what we can tell you, plainly:

**Every transaction on LeenqUp is receipt-backed.** When you pay, a receipt is generated and logged in our system. There is always a record. Your payment doesn't disappear into a chat or an informal handshake.

**Sellers have their business details on file before they can receive any payment.** We know who they are. That accountability is your first layer of protection.

**Our payment infrastructure uses trusted channels.** Orange Money, mobile banking, and card payments — these are established, regulated payment systems. We don't handle payments through unaccountable informal channels.

**If there's a dispute, there's a process.** We have a support team that reviews receipt-backed transaction records and documented communication to resolve issues. You're not on your own.

**Sellers' activity records are public.** Before you pay anyone, you can see exactly how many orders they've fulfilled and what other real buyers have said.

We've built LeenqUp on proof, not promises. The record is what protects you — and we've made sure the record is always there.`,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },

  // ───────────────────────────────────────────────
  // COMMENT / SOCIAL REPLIES (5)
  // ───────────────────────────────────────────────
  {
    id: 'br_016',
    trigger: 'Positive comment — someone expressing excitement or praise about LeenqUp',
    audience: 'general',
    channel: 'social-comment',
    tags: ['social', 'positive', 'community', 'engagement'],
    response: `This comment genuinely made our day. Thank you for the love — this is exactly why we're building LeenqUp.

We started this because Liberian commerce deserves a platform that's built for it — not borrowed from somewhere else and crossed your fingers. Seeing the community respond like this keeps us going.

If you haven't already, join our community group [link in bio] — that's where the real conversations are happening. And tell a friend! The more the community grows, the better LeenqUp gets for everyone.

We appreciate you. Seriously. 🇱🇷`,
    notes: 'Adapt to match the specific praise in the comment. Keep it warm and personal, not generic.',
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
  {
    id: 'br_017',
    trigger: 'A diaspora community member comments expressing excitement about being able to shop Liberian from abroad',
    audience: 'buyer',
    channel: 'social-comment',
    tags: ['diaspora', 'social', 'comment', 'buyer', 'community'],
    response: `Yes! This is exactly what we built LeenqUp for.

Whether you're in Minnesota, Maryland, London, or anywhere the Liberian diaspora has made a home — your Liberia is right here. The palm butter, the lappa, the handmade goods, the sellers you grew up knowing — all of it, online, with payments you can actually make from where you are.

We support card payments in USD for diaspora buyers, and we're working to expand our delivery and shipping options to make the diaspora experience even smoother.

Your store link is [marketplace link]. Come shop. And if you have friends in the diaspora who've been missing Liberian goods — send this their way. They'll thank you later. 🇱🇷`,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
  {
    id: 'br_018',
    trigger: '"When is LeenqUp launching?" or "Is it live yet?" comment',
    audience: 'general',
    channel: 'social-comment',
    tags: ['social', 'comment', 'launch', 'pre-launch'],
    response: `Very soon — and we're so glad you're watching for it!

We're putting the finishing touches on the marketplace and getting our founding sellers set up. Launch is coming — and when it happens, you'll want to be on the list so you hear about it first.

Drop your email in the waitlist link in our bio, and you'll be among the first people to know the moment LeenqUp goes live. First access, first look at founding sellers, early buyer perks — it's worth the signup.

Tell us: are you planning to buy or sell (or both)? We'd love to know who's in the community. 🇱🇷`,
    notes: 'Update this response once the platform is live to redirect to the marketplace directly.',
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
  {
    id: 'br_019',
    trigger: '"I want to sell on LeenqUp" or "How do I become a seller?" comment',
    audience: 'seller',
    channel: 'social-comment',
    tags: ['social', 'comment', 'seller', 'registration', 'recruitment'],
    response: `We love to hear it — and we'd love to have you!

Here's how to get started: head to [seller registration link] and submit your application. It only takes a few minutes, and our team reviews every application personally within 1-2 business days.

Once you're approved, you'll complete your seller profile, upload your first products, and your storefront goes live — visible to buyers in Liberia and across the diaspora.

DM us if you have any questions before applying — we're happy to walk you through it personally. Liberian sellers are the heart of LeenqUp. Come build with us. 🇱🇷`,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
  {
    id: 'br_020',
    trigger: 'Negative or critical comment — skepticism, criticism of the platform, or a complaint',
    audience: 'skeptic',
    channel: 'social-comment',
    tags: ['social', 'comment', 'negative', 'complaint', 'response'],
    response: `Thank you for saying this — we mean that. Skepticism is exactly the right reaction when someone is asking you to trust a new platform with your money, and we'd rather earn your trust than dismiss your concern.

We hear you. Here's what we want you to know: LeenqUp is built on the premise that proof matters more than promises. Every seller has their identity confirmed and business details on file. Every transaction is receipt-backed. Every review is tied to a real completed purchase. We're not asking you to just believe us — we're building a system where the record speaks for itself.

If you've had a specific experience with our platform or team that wasn't right, we want to hear about it directly. DM us or email hello@leenqup.com. We will respond personally, not with a template.

If your concern is more general, we'd genuinely welcome the conversation. What would make you feel confident using LeenqUp? We're listening — and we build based on what we hear.`,
    notes: 'Adapt tone based on severity of criticism. Always acknowledge first, never argue. Escalate to leadership if the complaint is about a specific incident or names a team member.',
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
]
