# LeenqUp Ops

Private operations dashboard for the LeenqUp team. Central command center for managing pre-launch content, merchant outreach, marketing assets, and external tool integrations.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript**
- **Tailwind CSS v4**
- **Radix UI** (headless components)
- **Lucide React** (icons)
- **Papaparse** (CSV export/import)

## Environment Variables

No environment variables are required to run the app. All API keys are configured through the Settings page in the UI and stored in your browser's localStorage.

| Setting | Where to find it |
|---------|-----------------|
| Buffer Access Token | buffer.com → Settings → Apps & API → Your Access Token |
| Brevo API Key | app.brevo.com → Settings → API Keys → Create v3 API Key |
| Notion Integration Token | notion.so → Settings → Integrations → New Integration → copy token |
| Notion Database ID | The 32-character ID in your Notion database URL |

API keys are **never committed to code**. They live only in your local browser storage.

## Application Structure

```
leenqup-ops/
├── app/                    # Next.js App Router pages and API routes
│   ├── page.tsx            # Home dashboard
│   ├── posts/              # Post master library
│   ├── scripts/            # Outreach script library
│   ├── sequences/          # Email sequence builder
│   ├── campaigns/          # Campaign bundle manager
│   ├── sops/               # Standard operating procedures
│   ├── brand/              # Brand voice + response library
│   ├── merchants/          # Merchant CRM + pipeline
│   ├── settings/           # API keys and configuration
│   └── api/                # External integration routes
│       ├── buffer/
│       ├── brevo/
│       ├── notion/
│       └── export/
├── components/             # Shared UI components
│   ├── sidebar.tsx
│   ├── theme-provider.tsx
│   └── ui/                 # Badge, Button, Card, Dialog, etc.
├── data/                   # Seed content (edit these to update content)
│   ├── posts.ts
│   ├── scripts.ts
│   ├── sequences.ts
│   ├── campaigns.ts
│   ├── sops.ts
│   ├── brand.ts
│   └── merchants.ts
├── lib/
│   ├── storage.ts          # localStorage abstraction
│   └── utils.ts            # Helper functions
└── types/
    └── index.ts            # All TypeScript interfaces
```

## Content Management

All content lives in the `/data/` TypeScript files. To add or update content:

### Adding New Posts

Edit `/data/posts.ts`. Each post follows the `Post` interface:

```typescript
{
  id: 'post_031',                    // unique ID
  title: 'Your post title',
  body: 'The full post copy...',
  platform: 'instagram',             // instagram | facebook | linkedin | twitter | whatsapp
  audience: 'seller',                // buyer | seller | diaspora | community | general
  pillar: 'trust',                   // trust | discovery | education | proof | community | launch | feature | announcement
  phase: 'pre-launch',              // pre-launch | launch | post-launch | evergreen
  tags: ['tag1', 'tag2'],
  characterCount: 0,                 // will be auto-computed
  status: 'ready',                   // ready | needs-review | scheduled | published
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}
```

After editing a data file, go to **Settings → Data Management → Reset to Seed Data** for that section to load your changes. *(Note: this replaces any edits made through the UI.)*

### Adding New Scripts

Edit `/data/scripts.ts` following the `Script` interface. Same reset process applies.

### Adding New Merchants

You can add merchants directly through the UI (Merchants → Add Merchant) or via CSV import. For bulk adds via code, edit `/data/merchants.ts`.

### Adding New Email Sequences

Edit `/data/sequences.ts`. Each `Email` in a sequence needs: `position`, `subject`, `body`, `delayDays`, and `tags`.

## Integrations

### Buffer
Connect your Buffer account in Settings to enable the "Send to Buffer" button on any post card. Posts are added to your Buffer queue for the matched platform profiles.

### Brevo
Connect Brevo to enable the "Send to Brevo" button on email sequences. This creates or updates a contact in Brevo and adds them to the appropriate sequence list.

### Notion
Connect a Notion database to sync your merchant CRM. The sync route (Settings → Notion → Sync) creates new pages for new merchants and updates existing ones matched by name.

## Data Persistence

All data is stored in your browser's **localStorage** under these keys:

| Key | Contents |
|-----|----------|
| `leenqup_posts` | Post library |
| `leenqup_scripts` | Script library |
| `leenqup_sequences` | Email sequences |
| `leenqup_campaigns` | Campaign bundles |
| `leenqup_sops` | SOPs |
| `leenqup_brand` | Brand responses |
| `leenqup_merchants` | Merchant CRM |
| `leenqup_settings` | API keys (local only) |

On first load, seed data from `/data/` files is written to localStorage automatically. Use **Settings → Data Management** to reset any section to seed data.

## Trust Language Reference

All content in this system must follow LeenqUp's trust language guidelines:

| Use this | Not this |
|----------|----------|
| identity confirmed | verified |
| business details provided | guaranteed |
| transaction history | fully safe |
| receipt-backed | guaranteed safe |
| activity record | |
| proof-based | |

## Deployment

This app is deploy-ready for Vercel with zero config changes.

```bash
# Deploy with Vercel CLI
npx vercel

# Or connect your GitHub repo to vercel.com for automatic deployments
```

No environment variables need to be set on Vercel — all API keys are user-side only.
