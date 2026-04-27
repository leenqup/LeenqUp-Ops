# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build (also type-checks)
npm run lint       # ESLint
npx tsc --noEmit   # Type-check only, no build output
```

No test suite exists yet.

## Stack

- **Next.js 16** (App Router) with React 19 — `'use client'` required on every interactive page
- **TypeScript** strict mode — `@/*` maps to the repo root
- **Tailwind CSS v4** + shadcn/ui (Radix primitives, components in `components/ui/`)
- **Supabase** (`@supabase/supabase-js` v2, singleton in `lib/supabase.ts`) — two tables: `kv_store` (key/value JSONB) and `merchants` (dedicated columns with realtime)
- **localStorage** is the primary runtime store; Supabase is a background sync/backup target
- Deployed on Vercel, auto-deploys from `master`

## Architecture

### Data Flow

All app data lives in **localStorage** first. `lib/storage.ts` is the single source of truth for all reads and writes. Pattern used throughout:

1. `initializeStorage()` called in each page's mount `useEffect` — runs schema migration then seeds if first visit
2. All CRUD is synchronous localStorage (`getItem`/`setItem` wrappers); no async in storage functions
3. Supabase writes are fire-and-forget in the background via `kvSet`/`kvSetBatch` (only merchants use `upsertMerchantDB`)

**Schema versioning:** `SCHEMA_VERSION` constant in `lib/storage.ts` (currently `'6'`). Bump it whenever new `KEYS` are added and add a migration block in `migrate()` that backfills defaults without overwriting user data.

### Types

All interfaces live in `types/index.ts` (41 exported interfaces/types). Import from `@/types`. Key ones:

- `Merchant` — core entity, `outreachStatus` enum (not `status`), `lastContactDate` (not `lastContacted`)
- `Script` — has `channel: ScriptChannel` enum and `type: ScriptType` enum
- `Goal` / `GoalKeyResult` — added in v6
- `PriceBenchmark`, `CategoryTrend`, `DiasporaDemandSignal` — market intelligence

### Pages & Layout

Every page is `'use client'`. Layout wraps all app pages in `components/sidebar.tsx` (dark navy sidebar, coral active state, brand colors via Tailwind config). No server components in use — all rendering is client-side.

Pages call `initializeStorage()` in `useEffect` before reading any storage function.

### API Routes

All in `app/api/`. They are **server-side only** — they read API keys from `req.headers` (passed from the client using values from `AppSettings` in localStorage), not from env vars. Pattern:

```ts
const token = req.headers.get('x-buffer-token')   // or x-brevo-key, x-notion-token, etc.
```

Buffer uses GraphQL POSTed to `https://api.buffer.com`. The `organizationId` variable must be typed as `OrganizationId!` (custom scalar), not `String!`.

### UI Patterns

- **Dialogs** for add/edit/delete confirmation — single Dialog instance per entity, driven by state (`editingItem`, `confirmDelete`)
- **Tabs** (shadcn) for multi-section pages — see `app/finance/page.tsx` for the canonical pattern
- **Toast** via `components/ui/toaster.tsx` — `toast({ title, description, variant })`
- **Charts** are CSS-only (width/height proportions) — no chart library installed
- **Empty states** on every tab/table when data is absent

### Seed Data

`data/*.ts` files export typed arrays used for first-time seeding and schema migration backfills. When new seed content is added, always add a migration guard in `migrate()` to merge-by-ID into existing localStorage without overwriting user edits (see v3/v4 migration pattern).

### Brand Rules

- Never position LeenqUp against competing platforms by name — focus on the problem (no receipts, no accountability, informal channels)
- WhatsApp/Instagram/Facebook may be named as **delivery channels** in script titles and SOP tool lists — never as competitors
- Trust language: use "identity confirmed", "proof-based", "receipt-backed" — never "verified", "guaranteed", "risk-free"

### Key Utility Functions

`lib/utils.ts`: `generateId()`, `cn()`, `formatDate()`, `truncate()`, `getCharLimit(platform)`, `getCharStatus(count, platform)`

`lib/merchant-health.ts`: `computeMerchantHealth(merchant)` → `{ total: 0–100, grade: A–F, breakdown, flags }` — pure function, no storage imports

`lib/digest.ts`: `generateDigest(weekOffset)` → `DigestReport` — reads from storage, pure computation

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

All other secrets (Buffer, Brevo, Sheets, Slack, Notion) are stored in `AppSettings` in localStorage and passed as request headers to API routes — they are never in env vars.
