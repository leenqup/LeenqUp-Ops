# LeenqUp Ops

Private operations dashboard for the LeenqUp team. Central command center for managing pre-launch content, merchant outreach, marketing assets, and external tool integrations.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Next.js 16.2.3** with App Router
- **TypeScript**
- **Tailwind CSS v4**
- **Radix UI** (headless components)
- **Lucide React** (icons)
- **Papaparse** (CSV export/import)
- **Supabase** (shared cloud database)

## Supabase Setup

Supabase is the shared backend — all team members read from and write to the same database so everyone stays in sync.

### Environment Variables

Create a `.env.local` file (never commit this):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

Find both values in your Supabase dashboard → Project Settings → API.

### Database Table

Run the following SQL in Supabase → SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS public.kv_store (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_kv_store_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kv_store_updated_at
  BEFORE UPDATE ON public.kv_store
  FOR EACH ROW EXECUTE FUNCTION update_kv_store_timestamp();

ALTER TABLE public.kv_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON public.kv_store
  FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.kv_store;
```

### How Sync Works

- On app load, all team data is pulled from Supabase into localStorage (local cache)
- Every save/edit is written to localStorage immediately, then synced to Supabase in the background
- Supabase Realtime pushes remote changes to all connected browsers without refresh
- **Settings and API keys are localStorage-only** — they are never sent to Supabase

### Manual Sync

Go to **Settings → Cloud Sync** to:
- **Push Local → Cloud**: force-upload all local data (use once to seed the shared DB)
- **Pull Cloud → Local**: force-download the latest team data

## Other Environment Variables

```env
# Make.com inbound webhook authentication
LEENQUP_MAKE_SECRET=your-strong-random-secret-here
```

## Application Structure

```
leenqup-ops/
├── app/                    # Next.js App Router pages and API routes
│   ├── page.tsx            # Home dashboard
│   ├── today/              # Daily ops checklist
│   ├── posts/              # Post master library
│   ├── scripts/            # Outreach script library
│   ├── sequences/          # Email sequence builder
│   ├── campaigns/          # Campaign bundle manager
│   ├── sops/               # Standard operating procedures
│   ├── brand/              # Brand voice + response library
│   ├── merchants/          # Merchant CRM + pipeline
│   ├── crm/                # Deal pipeline + merchant accounts
│   ├── projects/           # Project boards (kanban)
│   ├── finance/            # Expenses, revenue, investor KPIs
│   ├── guide/              # Employee onboarding guide
│   ├── settings/           # API keys and configuration
│   └── api/                # External integration routes
│       ├── buffer/         # Buffer scheduling
│       ├── brevo/          # Brevo email sequences
│       ├── notion/         # Notion merchant sync
│       ├── sheets/         # Google Sheets export
│       ├── webhooks/       # Inbound (Make.com) + outbound webhooks
│       └── export/         # CSV export
├── components/
│   ├── sidebar.tsx
│   ├── supabase-provider.tsx   # Boot sequence: hydrate → init → realtime
│   ├── theme-provider.tsx
│   └── ui/                     # Badge, Button, Card, Dialog, etc.
├── data/                   # Seed content (edit these to update content)
│   ├── posts.ts
│   ├── scripts.ts
│   ├── sequences.ts
│   ├── campaigns.ts
│   ├── sops.ts
│   ├── brand.ts
│   ├── merchants.ts
│   ├── merchants-a1.ts     # Hand-researched batch 1
│   ├── merchants-a2.ts     # Hand-researched batch 2
│   ├── merchants-a3.ts     # Hand-researched batch 3
│   ├── merchants-b-diaspora.ts
│   └── merchants-c-trueliberia.ts  # 299 TrueLiberia import
├── lib/
│   ├── storage.ts          # localStorage + Supabase dual-write
│   ├── supabase.ts         # Supabase client + kv_store helpers
│   └── utils.ts
└── types/
    └── index.ts            # All TypeScript interfaces
```

## Content Management

All content lives in the `/data/` TypeScript files. To add or update content:

### Adding New Posts

Edit `/data/posts.ts`. Each post follows the `Post` interface. After editing, go to **Settings → Data Management → Reset to Seed Data** to load changes.

### Adding New Merchants

Add merchants through the UI (Merchants → Add Merchant) or edit `/data/merchants.ts` for bulk adds via code.

## Integrations

All integration credentials are stored in localStorage (never synced to Supabase, never committed to code). Configure them in **Settings**.

### Buffer

Connect your Buffer account to enable "Send to Buffer" on any post. Token is passed as `Authorization: Bearer {token}` to the Buffer Publish API.

### Brevo

Connect Brevo to trigger email sequences. The `/api/brevo/trigger` route:
1. Creates or updates the contact in Brevo (`POST /v3/contacts` with `updateEnabled: true`)
2. Adds the contact to the specified list ID (`POST /v3/contacts/lists/{id}/contacts/add`)
3. Step 2 fires any Brevo automation attached to that list

Pass `listId` in the request body. Pass `attributes` for contact properties (`FIRSTNAME`, `SEGMENT`, etc.).

### Notion

Syncs merchant records to a Notion database. Uses an **idempotent ID strategy**:
- First sync: searches by name, creates page, stores the Notion page ID on the merchant record in Supabase
- Subsequent syncs: updates the stored page ID directly — no name search, no duplicates

### Google Sheets

Exports merchants, posts, or scripts to a Google Spreadsheet using a service account.

**Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com) → IAM & Admin → Service Accounts → Create Service Account
2. Download the JSON key file
3. Open your Google Sheet → Share → add the service account email (`client_email` from the JSON) → Editor access
4. In Settings → Google Sheets: paste the full credentials JSON and the Sheet ID from the URL

**Sheet ID** is the string between `/d/` and `/edit` in your Google Sheets URL.

The export route creates a new tab named `{type} {YYYY-MM-DD}` (e.g. `merchants 2026-04-12`) or overwrites that tab if it already exists.

**Routes:**
- `GET /api/sheets/test` — verifies credentials and returns sheet title + tab list
- `POST /api/sheets/export` — writes data to the spreadsheet

### Make.com Inbound Webhook

LeenqUp accepts inbound POST requests from Make.com at `/api/webhooks/make`.

**Authentication:** every request must include the header `X-LeenqUp-Secret: {secret}`. The secret must match the `LEENQUP_MAKE_SECRET` environment variable on the server.

**Configure in Make.com:**
1. Create a scenario → add an HTTP module → Make a request
2. URL: `https://your-domain.com/api/webhooks/make`
3. Method: POST
4. Headers: `X-LeenqUp-Secret: your-secret`
5. Body type: JSON

**Supported event types:**

#### `merchant_signup`
Creates a new merchant. Sets `outreachStatus=contacted`, `priority=high`.
```json
{
  "eventType": "merchant_signup",
  "name": "Duala Market Store",
  "email": "store@example.com",
  "phone": "+231770000000",
  "category": "Fashion",
  "city": "Monrovia",
  "country": "Liberia",
  "segment": "liberia",
  "instagram": "https://instagram.com/store",
  "facebook": "https://facebook.com/store",
  "website": "https://store.com"
}
```

#### `lead_update`
Finds merchant by email, updates status, appends a timestamped note.
```json
{
  "eventType": "lead_update",
  "email": "store@example.com",
  "outreachStatus": "interested",
  "note": "Called back — interested in the seller plan",
  "lastContactDate": "2026-04-12"
}
```

#### `post_performance`
Stores engagement metrics on a post record.
```json
{
  "eventType": "post_performance",
  "postId": "post_001",
  "metrics": {
    "impressions": 4200,
    "clicks": 310,
    "engagementRate": 7.4
  }
}
```

## Data Persistence

Data is stored in Supabase (`kv_store` table) with localStorage as a client-side cache. The app boots by pulling from Supabase, then every write goes to both localStorage (instant) and Supabase (background).

| Key | Contents | Synced to Supabase? |
|-----|----------|--------------------|
| `leenqup_posts` | Post library | Yes |
| `leenqup_scripts` | Script library | Yes |
| `leenqup_sequences` | Email sequences | Yes |
| `leenqup_campaigns` | Campaign bundles | Yes |
| `leenqup_sops` | SOPs | Yes |
| `leenqup_brand` | Brand responses | Yes |
| `leenqup_merchants` | Merchant CRM | Yes |
| `leenqup_settings` | API keys | **No — local only** |

## Trust Language Reference

All content must follow LeenqUp's trust language guidelines:

| Use this | Not this |
|----------|----------|
| identity confirmed | verified |
| business details provided | guaranteed |
| transaction history | fully safe |
| receipt-backed | guaranteed safe |
| activity record | risk-free |
| proof-based | secure transaction |
| with confidence | safely |

## Deployment

Deploy-ready for Vercel. Set the Supabase environment variables and `LEENQUP_MAKE_SECRET` in your Vercel project settings.

```bash
npx vercel
```
