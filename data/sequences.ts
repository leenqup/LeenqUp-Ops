import { EmailSequence } from '@/types'

export const sequences: EmailSequence[] = [
  // ─────────────────────────────────────────────────────────────
  // 1. BUYER WELCOME
  // ─────────────────────────────────────────────────────────────
  {
    id: 'seq_001',
    name: 'Buyer Welcome',
    audience: 'buyer',
    triggerEvent: 'New buyer signs up on LeenqUp',
    status: 'ready',
    emails: [
      {
        position: 1,
        subject: 'Welcome to LeenqUp — you just joined something real 🇱🇷',
        delayDays: 0,
        tags: ['welcome', 'onboarding', 'buyer'],
        body: `Hi [First Name],

Welcome to LeenqUp. We're genuinely glad you're here.

LeenqUp is a social commerce platform built specifically for Liberia and the Liberian diaspora. That means whether you're in Monrovia, Minnesota, or Maryland — you can shop from Liberian sellers, discover Liberian-made products, and support businesses that are part of your community.

We built LeenqUp because buying from Liberian sellers online shouldn't feel like a gamble. Too many people have had to rely on "just trust me" — and that's not good enough. On LeenqUp, every seller has a business profile on file, a transaction history, and a proof-based record that you can actually see.

Here's what makes LeenqUp different:

• Every seller on the platform has submitted their business details — no anonymous storefronts.
• Payments go through trusted channels you already know, like Orange Money and mobile banking.
• Buyers and sellers are part of the same community — your review and feedback matter.

Over the next few days, we'll walk you through everything: how to browse, how to pay, how to find your new favorite seller in Duala Market or right here in the diaspora.

You don't have to figure this out alone. We're walking with you every step.

Welcome to the community.

— The LeenqUp Team

P.S. Have a question right now? Reply to this email and a real person will get back to you.`,
      },
      {
        position: 2,
        subject: 'How to browse LeenqUp — and what "proof-based" actually means',
        delayDays: 1,
        tags: ['trust', 'safety', 'education', 'buyer'],
        body: `Hi [First Name],

We want to talk about something that matters: how you can shop with confidence on LeenqUp.

We know the concern. Online shopping in Liberia has a complicated history. People have sent money and never received their order. Sellers have disappeared after payment. It's a real problem — and we didn't build LeenqUp pretending it doesn't exist.

So here's exactly how we handle it:

**Business Details on File**
Every seller on LeenqUp has provided their business details before listing a single product. We know who they are, how to reach them, and where they operate. No ghost sellers, no anonymous accounts.

**Activity Records**
You can see a seller's activity record directly on their profile — how long they've been on the platform, how many orders they've fulfilled, and what buyers have said about their experience.

**Receipt-Backed Transactions**
When you complete a purchase on LeenqUp, both you and the seller get a receipt. That receipt is logged. There's a paper trail. Disputes have something real to point to.

**Proof-Based Reviews**
Reviews on LeenqUp are tied to actual completed purchases — not just anyone can leave a rating. That means what you read is what real buyers actually experienced.

This isn't about perfection — no platform is. But it's about building a system where accountability is the default, not the exception.

Browse the marketplace when you're ready. Click on a seller's profile and look at their business profile. You'll see exactly what we mean.

We'll send you a quick guide to placing your first order in a couple of days.

— The LeenqUp Team`,
      },
      {
        position: 3,
        subject: "Ready to order? Here's exactly how it works (step by step)",
        delayDays: 3,
        tags: ['how-to', 'orders', 'payments', 'buyer'],
        body: `Hi [First Name],

Time to make your first order. We'll keep this simple.

**Step 1: Browse the marketplace**
Use the search bar or categories to find what you're looking for — fashion, food, beauty, household goods, handmade items, and more. You can filter by location (Monrovia, US diaspora, etc.) or by category.

**Step 2: Check the seller's profile**
Before you add anything to your cart, take 30 seconds to look at the seller's profile. You'll see their business details, their activity record, and reviews from other buyers. This is your proof-based look at who you're buying from.

**Step 3: Add to cart and checkout**
When you're ready, add your items and head to checkout. You'll confirm your delivery address and choose your payment method.

**Payment methods we support:**
• **Orange Money** — the most popular mobile money option for buyers in Liberia. Fast, familiar, and reliable.
• **Mobile banking** — for buyers who prefer bank transfers.
• **Card payments** — for diaspora buyers paying in USD.
• More options coming soon.

**Step 4: Confirm and track**
After you pay, you'll receive an order confirmation with a receipt. The seller is notified immediately. You can track the status of your order right in the app.

**Step 5: Leave a review**
After your order arrives, share your experience. Your review helps other community members and rewards sellers who do things right.

That's it. Five steps. Your first order could be placed in the next ten minutes.

Go browse — we think you'll find something you love.

— The LeenqUp Team`,
      },
      {
        position: 4,
        subject: 'Meet the sellers — a spotlight on Duala Market and beyond',
        delayDays: 5,
        tags: ['discovery', 'sellers', 'community', 'duala-market'],
        body: `Hi [First Name],

One of our favorite things about LeenqUp is the sellers. We want you to meet some of them.

**The heart of Liberian commerce: Duala Market**
Duala Market in Monrovia has always been the pulse of Liberian trade. Women carrying goods on their heads, traders who know their customers by name, small businesses that have been running for decades. LeenqUp brings that energy online — so whether you're in Paynesville or Philadelphia, you can shop from the people who built Liberia's marketplace culture.

**The kinds of sellers you'll find on LeenqUp:**

*Fashion & Fabric* — Liberian lappa, African print dresses, tailored styles made to order. Sellers who know how to make you look right for every occasion.

*Food & Provisions* — Palm butter, potato greens, Liberian rice, dried fish, pepper, and the authentic ingredients that diaspora buyers can't always find at local stores. Packaged and shipped with care.

*Beauty & Wellness* — Natural hair products, shea butter, black soap, and beauty brands rooted in West African tradition.

*Handmade & Crafts* — Liberian artisans making baskets, bags, jewelry, and home goods. Every piece has a story.

*Services* — Event planners, photographers, caterers, stylists, and more serving the diaspora community.

**All sellers have:**
- Identity confirmed on file
- Business details provided at registration
- A transaction history you can view before buying

Browse the featured sellers section this week — new sellers are added regularly, and some of the best ones in Monrovia and the US diaspora are just getting started.

We think you're going to find a new favorite.

— The LeenqUp Team`,
      },
      {
        position: 5,
        subject: "You're not alone — your community is here (and so are we)",
        delayDays: 7,
        tags: ['community', 'support', 'welcome', 'buyer'],
        body: `Hi [First Name],

You've been with LeenqUp for a week now, and we want to check in.

First: you're not alone in this. LeenqUp is a community — buyers, sellers, and the team behind the platform are all part of something we're building together. That's not marketing language. It's literally how this works.

**Your community resources:**

*The LeenqUp Community Group* — Join our Facebook group where buyers share recommendations, sellers announce new products, and the team shares updates. It's the liveliest corner of the platform.

*WhatsApp Broadcast* — Follow our WhatsApp channel for quick announcements, deals, and new seller spotlights. No spam — just the good stuff.

*Direct Support* — If something goes wrong with an order, if a seller isn't responding, or if you just have a question about how something works — reach us directly. Reply to any of these emails, DM us on Instagram, or use the support button in the app. A real person answers.

**Tips from your fellow buyers:**

• "Check the seller's activity record before buying — the ones with longer histories tend to ship faster."
• "For diaspora buyers, the USD card payment option is the smoothest. Orange Money is great if you have someone in Monrovia to help."
• "Leave your reviews. It helps other buyers and it motivates the sellers who are doing it right."

We built LeenqUp because Liberian commerce deserves a platform that respects both buyers and sellers. Every order you place, every review you leave, every seller you recommend to a friend — you're helping build that.

Thank you for being part of this from the beginning.

We're always reachable. Don't hesitate.

— The LeenqUp Team
support@leenqup.com`,
      },
    ],
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },

  // ─────────────────────────────────────────────────────────────
  // 2. SELLER ONBOARDING
  // ─────────────────────────────────────────────────────────────
  {
    id: 'seq_002',
    name: 'Seller Onboarding',
    audience: 'seller',
    triggerEvent: 'Seller submits registration form',
    status: 'ready',
    emails: [
      {
        position: 1,
        subject: "We got your application — here's what happens next",
        delayDays: 0,
        tags: ['onboarding', 'seller', 'application'],
        body: `Hi [First Name],

We received your seller registration for LeenqUp. Thank you for taking that step — it means a lot that you want to be part of what we're building.

Here's what happens next, so you know exactly where you stand:

**Step 1: Application review (1-2 business days)**
Our team will review the information you submitted. We look at your business category, your location, and your initial profile details. This is where your business details get logged into our system.

**Step 2: Profile setup invitation**
Once your application is reviewed, you'll receive a follow-up email with a link to complete your seller profile. This is where you'll add your product listings, your business story, your contact information, and photos.

**Step 3: First listing goes live**
After your profile is complete and your first product is listed, your storefront becomes visible to buyers — in Liberia and across the diaspora.

The whole process typically takes 3-5 business days from submission to your first live listing.

**While you wait:**
- Think about your first 3-5 products you want to list. What photos do you have? What are your prices?
- If you have an Instagram or Facebook page, make sure it's up to date — buyers sometimes look there too.
- If you have questions right now, reply to this email. We're here.

We're building LeenqUp because Liberian sellers deserve a platform that works for them — one that connects you to buyers in Monrovia and in the diaspora without the friction and risk of informal channels.

You're in the right place. We'll be in touch soon.

— The LeenqUp Team`,
      },
      {
        position: 2,
        subject: 'Complete your profile — this is how buyers decide to trust you',
        delayDays: 1,
        tags: ['profile', 'trust', 'seller', 'onboarding'],
        body: `Hi [First Name],

Your application is looking good. Today we want to talk about your seller profile — because this is the single most important thing you can do to attract buyers and get your first sale.

Here's the truth: when a buyer lands on your storefront, they're asking one question — "Can I trust this person with my money?" Your profile is your answer.

**What a complete profile includes:**

*Business name and description* — Tell your story. How long have you been in business? What do you specialize in? Why should someone buy from you? Be human. Be specific. Buyers respond to real people.

*Profile photo and banner* — Use a clear, real photo of yourself or your business space. Blurry logos and stock images send the wrong signal. A photo of you at your market stall, your workshop, or your kitchen says "I am a real person with a real business."

*Business details on file* — Your contact information, business location, and registration details (where applicable) are stored in our system. This isn't visible to the public in full — but it means your identity is confirmed, and buyers know they're dealing with a real, accountable seller.

*Product listings with real photos* — More on this tomorrow. For now, know that quality product images are your #1 sales tool.

*Response commitment* — Let buyers know how quickly you respond to messages. Sellers who respond within a few hours get significantly more sales than those who take days.

**Why this matters for your activity record:**
Your LeenqUp activity record starts building the moment your profile goes live. Every order fulfilled, every buyer review, every message responded to — it all adds up to a proof-based profile that attracts more buyers over time.

Take 20 minutes today and fill out every section of your profile. Don't leave anything blank.

We'll send you product listing tips tomorrow.

— The LeenqUp Team`,
      },
      {
        position: 3,
        subject: 'Upload your first products — tips for photos that actually sell',
        delayDays: 2,
        tags: ['listings', 'photos', 'products', 'seller'],
        body: `Hi [First Name],

Today is about your product listings — and specifically about photos, because photos are everything.

Studies consistently show that product images are the #1 factor in a buyer's decision to purchase online. On LeenqUp, where many buyers are diaspora members who can't physically inspect the goods, your photos have to do the work your hands normally would.

**The LeenqUp photo guide for sellers:**

*Use natural light* — Step outside or stand near a window. Natural daylight makes colors accurate and products look their best. Avoid harsh indoor lighting that creates shadows or washes things out.

*Clean background* — A white cloth, a plain wall, or a clean surface works. You don't need a studio. You need a background that doesn't compete with your product.

*Multiple angles* — Show the front, back, sides, and any important details (stitching, texture, labels). For food products, show the packaging and the product itself.

*Size reference* — Put your product next to something familiar so buyers understand the actual size. A hand, a coin, or a common object works.

*Honest photos* — Never edit your photos to make colors or sizes look different from reality. Your activity record and reviews depend on buyers receiving what they expected.

**Writing your product descriptions:**

- State exactly what the buyer receives (quantity, size, color, material)
- List any customization options (colors, sizes, names)
- Be clear about delivery — Monrovia delivery, nationwide, or diaspora shipping
- Set accurate prices in Liberian dollars and/or USD where applicable

**Start with 3-5 products.** You don't need 50 listings on day one. A focused, high-quality selection of a few products will outperform a large selection of poorly-photographed items every time.

Go upload your first listing today. We're watching for it — and we'll celebrate with you when it goes live.

— The LeenqUp Team`,
      },
      {
        position: 4,
        subject: 'How receipts and activity records work — your reputation is your asset',
        delayDays: 3,
        tags: ['trust', 'receipts', 'activity-record', 'seller'],
        body: `Hi [First Name],

We want to explain something that most platforms don't bother to explain — because understanding it will make you a better, more successful seller on LeenqUp.

**The LeenqUp trust system is built on proof.**

Here's how it works in practice:

**Receipts**
Every order placed on LeenqUp generates a receipt. That receipt is stored in our system and linked to both the buyer and the seller. It records what was sold, at what price, when, and whether it was fulfilled. This is your paper trail — and it protects you just as much as it protects the buyer.

If a buyer ever disputes an order unfairly, your receipt record is your defense. If you fulfilled the order and the system shows it, you're protected. This is why we ask all sellers to update order statuses promptly when you ship or hand off an item.

**Activity Record**
Your activity record is a running log of your seller behavior on the platform. It includes:
- How many orders you've received
- How many you've fulfilled
- Your average response time to buyer messages
- Your review score from real buyers (receipt-backed reviews only)
- How long your account has been active

This record is visible to buyers when they visit your storefront. A strong activity record is worth more than any advertisement. Buyers who see 50 fulfilled orders and 4.8-star reviews don't need convincing — the record speaks for itself.

**What this means for you:**
- Fulfill every order promptly, even the small ones
- Respond to messages within a few hours
- Update your order status as soon as you ship
- Encourage happy buyers to leave reviews
- If there's ever a problem, communicate — silence destroys trust faster than anything else

Your reputation on LeenqUp is a real asset. Treat it like one.

— The LeenqUp Team`,
      },
      {
        position: 5,
        subject: 'Your first sale — what to expect and how to nail the fulfillment',
        delayDays: 5,
        tags: ['first-sale', 'fulfillment', 'seller', 'operations'],
        body: `Hi [First Name],

Your first sale is coming. When it does — and it will — here's exactly what to do.

**When a buyer places an order:**

1. *You'll receive a notification* — via the app and by email. Check it promptly. Buyers watch response time closely.

2. *Confirm the order in the app* — This signals to the buyer that you've seen their order and are preparing it. Do this within a few hours of receiving the notification.

3. *Prepare the order carefully* — Pack it well. For food items, packaging matters for safety and presentation. For fashion, fold neatly and include a small thank-you note if you can — it goes a long way.

4. *Arrange delivery* — For Monrovia orders, you can use okada riders, delivery services, or arrange direct pickup. For diaspora orders, you'll coordinate with your chosen shipping partner. LeenqUp will provide guidance on recommended shipping options as we grow.

5. *Mark the order as shipped/delivered* in the app — This updates the buyer's status and logs the fulfillment in your activity record. Don't skip this step.

6. *Follow up with the buyer* — A simple "Did everything arrive okay?" message builds relationship and often prompts a review.

**If something goes wrong:**
If you can't fulfill an order (out of stock, unexpected issue), contact the buyer immediately and contact LeenqUp support. Do not go silent. Prompt communication in difficult situations builds more trust than perfection — because buyers know life happens, but they need to know you're there.

**Your first review:**
After a successful order, ask the buyer to leave a review. Something simple: "I hope you love your order! If you have a moment, a review on my LeenqUp profile would mean the world to my small business." Most satisfied buyers are happy to do it — they just need to be asked.

You're ready. Go make that first sale.

— The LeenqUp Team`,
      },
      {
        position: 6,
        subject: "Invite your regulars — your existing customers belong on LeenqUp",
        delayDays: 7,
        tags: ['growth', 'referrals', 'customers', 'seller'],
        body: `Hi [First Name],

You already have customers. People who have bought from you on WhatsApp, at the market, through Instagram. They already trust you. Now it's time to bring them onto a platform where that trust is on the record — for them and for new buyers who don't know you yet.

**Why bring your existing customers to LeenqUp?**

When your regulars buy from you on LeenqUp, every transaction builds your activity record. Every review they leave becomes proof-based social credibility that attracts new buyers you've never met. Your existing customers are the foundation of your LeenqUp reputation.

**How to invite them:**

*WhatsApp message (to existing customers):*
"Hey [Name]! I just set up my store on LeenqUp — it's a new platform where you can browse and order from me anytime, pay easily, and track your order. It's free for you and makes things much easier for both of us. Here's my store link: [your LeenqUp link]. Would love for you to check it out and place your next order through there!"

*Instagram story:*
"I'm now on @LeenqUp! If you've bought from me before, come find my store there — easier ordering, easy payments, and your order history is always saved. Link in bio."

*Facebook post:*
"Big news — my shop is now on LeenqUp! If you've been buying from me through WhatsApp or DMs, this makes everything cleaner: you browse, you order, you pay — all in one place. Come find me: [link]"

**Make it an event:**
Tell your first 10 LeenqUp customers they'll get a small bonus — a discount, a free add-on, priority on a new product drop. Early loyalty deserves recognition.

Your network is your biggest asset. Activate it.

— The LeenqUp Team`,
      },
      {
        position: 7,
        subject: '10 days in — a personal check-in from the LeenqUp team',
        delayDays: 10,
        tags: ['check-in', 'seller', 'support', 'milestone'],
        body: `Hi [First Name],

Ten days. We want to check in personally.

How are things going with your LeenqUp store? We know the early days can feel uncertain — setting up a new platform, trying to get your first order, figuring out what works. That's normal. And we're not hands-off.

Here's what we want to know:

**Has your store gone live?** If your listings aren't up yet, let us know what's blocking you. We have someone who can sit with you (virtually or in person if you're in Monrovia) and get it done.

**Have you made a sale?** If yes — congratulations. That first order is a big deal, and we're proud of you. If not yet, we'd love to look at your listing together and see if there's something we can adjust to increase visibility.

**Is there anything confusing?** Payments, shipping, the dashboard — if something doesn't make sense, tell us now. Your feedback makes the platform better for every seller who comes after you.

**A personal note from our team:**

We started LeenqUp because we believe Liberian sellers deserve more. More visibility, more tools, more respect from the buyers they serve. When you set up your store on LeenqUp, you're not just listing products — you're staking your reputation on a platform that stakes its reputation on you in return.

We take that seriously. You're not a merchant number to us. You're a real person building a real business, and we're honored to be part of your story.

Reply to this email. Tell us where you are. We'll respond personally.

— The LeenqUp Team
hello@leenqup.com | +231-XXX-XXXX`,
      },
    ],
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },

  // ─────────────────────────────────────────────────────────────
  // 3. RE-ENGAGEMENT
  // ─────────────────────────────────────────────────────────────
  {
    id: 'seq_003',
    name: 'Re-engagement',
    audience: 're-engagement',
    triggerEvent: 'Buyer or seller has not logged in for 30 days',
    status: 'ready',
    emails: [
      {
        position: 1,
        subject: "We miss you — here's what's been happening on LeenqUp",
        delayDays: 0,
        tags: ['re-engagement', 'win-back', 'community'],
        body: `Hi [First Name],

It's been a minute — and we noticed.

We wanted to reach out and share some of what's been happening on LeenqUp since you last logged in, because there's genuinely a lot to be excited about.

**What's new:**

*New sellers have joined* — We've welcomed fresh sellers from Monrovia's Duala Market, Red Light Market, and new Liberian-diaspora businesses across the US. Fashion, food, beauty, home goods — the marketplace keeps growing.

*Improved product discovery* — We've updated the browse experience to make it easier to find exactly what you're looking for. New filters, better search, and a featured sellers section that spotlights businesses with strong activity records.

*Orange Money payments are smoother* — We've made the checkout process faster for buyers paying via Orange Money. Fewer steps, faster confirmation.

*Community is growing* — Our Facebook community group has become a lively space for recommendations, seller spotlights, and conversations about Liberian commerce. If you haven't joined yet, come in.

We don't want to just fill your inbox. We wanted to reach out because LeenqUp is better with you in it — whether you're a buyer who hasn't placed an order yet, or a seller whose store has been quiet.

**Come back and take a look.** Even just 10 minutes browsing might surprise you.

Your account is still active. Everything you set up is still there. We saved your spot.

Log back in here: [LeenqUp Login Link]

Talk soon,
— The LeenqUp Team`,
      },
      {
        position: 2,
        subject: 'A personal note — how can we help you?',
        delayDays: 3,
        tags: ['re-engagement', 'personal', 'support', 'feedback'],
        body: `Hi [First Name],

This one is a bit more direct.

We noticed you haven't been active on LeenqUp in a while, and before we assume anything, we wanted to simply ask: how can we help?

Sometimes people step back from a platform because something didn't work the way it should. A payment that was confusing. A seller who didn't respond. A listing that felt unclear. A dashboard that felt complicated.

If any of that happened to you — we want to know. Not to defend ourselves, but to fix it. LeenqUp is a work in progress, and every piece of honest feedback we get from real users makes it better for the next person who joins.

So here are a few direct questions:

**If you're a buyer:**
- Did you have a problem with an order or a seller?
- Was there something you were looking for that you couldn't find?
- Was the payment process confusing or unreliable?

**If you're a seller:**
- Did you struggle to set up your listing?
- Have you not made a sale yet and don't know why?
- Did something about the platform feel unfair or unclear?

You can reply directly to this email. A real person will read it and respond — usually within 24 hours.

If there's nothing wrong and life just got busy — that's completely okay too. We understand. Monrovia moves fast. Diaspora life is full. We'll be here when you're ready.

We just wanted you to know: we see you, we value you, and we want to help.

— The LeenqUp Team
hello@leenqup.com`,
      },
      {
        position: 3,
        subject: "Last note from us — and we're making it worth your while",
        delayDays: 7,
        tags: ['re-engagement', 'offer', 'final', 'win-back'],
        body: `Hi [First Name],

We'll keep this one short.

We've sent you a couple of notes over the past week, and we don't want to flood your inbox. This is the last re-engagement email we'll send for now — though your account stays active and the door is always open.

We wanted to make your return worth something concrete. So here's what we're offering:

**For buyers coming back:**
Your next order on LeenqUp comes with free delivery (for Monrovia orders) or a [X]% discount off your first new order. Use code **WELCOME-BACK** at checkout. Valid for the next 14 days.

**For sellers coming back:**
We want to give your store a boost. Log back in this week and we'll feature your store in our next community post and WhatsApp broadcast — putting your business in front of buyers who are ready to shop. No cost to you. Just come back.

**And a seller we think you should meet:**
[Featured Seller Name] runs a Liberian food and provision business based in Monrovia, serving both local and diaspora buyers. They have a strong activity record, receipt-backed reviews from happy customers, and a business profile on file. Their palm butter and dried goods ship fast. If you haven't tried them yet — this might be your sign.

Visit their store: [Seller Profile Link]

That's it from us. No pressure. We hope to see you back — but either way, thank you for being part of LeenqUp's story.

With love from the whole team,
— LeenqUp
hello@leenqup.com | Unsubscribe | Manage preferences`,
      },
    ],
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
]
