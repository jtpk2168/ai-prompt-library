# AI Prompt Library

## Workflow rules
- **After every `git push origin main`**: check both Vercel deploy state and Supabase health. Vercel: use `mcp__cfd1027f-69d2-4919-a98d-e5d3f80bed61__list_deployments` with `projectId: prj_hHG4OtuZOdPqaOhHXbJW9LBzhDVW` and `teamId: team_Esx0el0aHMbDHeefyENtFnaP` (first deployment should be READY and reference the latest commit SHA). Supabase: run a quick health node script to confirm table counts and the `search_prompts` RPC still works. If either is broken, diagnose before moving on.

## Project
A web-based AI Prompt Library for Vibe Coding workshop students (Malaysian Chinese SME owners). Browse, search, filter, and copy proven prompts with variable substitution.

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + Auth + RLS)
- Vercel hosting

## Design Context

### Users
Malaysian Chinese SME owners attending Vibe Coding workshops. Non-technical business operators who need to grab a prompt, fill in their details, and paste it into a Vibe Coding tool. Speed and clarity are paramount.

### Brand Personality
Professional, Empowering, Approachable. The trusted Vibe Coding authority in Southeast Asia — a knowledgeable mentor who respects the boss's time.

### Aesthetic Direction
Clean & Structured. White background, dark navy (#0F172A) code blocks, yellow/gold (#FCD34D) accent used sparingly for CTAs and callouts, slate text. Inter + Noto Sans SC typography. Generous whitespace, subtle card borders, pill badges for metadata.

### Design Principles
1. **Clarity over cleverness** — immediately understandable to non-technical users reading in Chinese
2. **Copy-first UX** — the copy button, variable inputs, and prompt preview are the hero elements
3. **Structured scanability** — cards, pills, consistent metadata for scanning 20+ prompts quickly
4. **Premium restraint** — whitespace, limited palette, typography-driven hierarchy, yellow accent pops because it's sparse
5. **Bilingual harmony** — Chinese-primary, design for CJK line lengths and character density

### Anti-references
Avoid: generic SaaS templates, overly technical/dev-heavy aesthetics, cheap/cluttered layouts, childish/gamified elements.

## Architecture Guidelines (Next.js App Router)

### File Structure
```
src/
├── app/
│   ├── layout.tsx              # Root layout (Inter + Noto Sans SC via next/font)
│   ├── page.tsx                # Landing page (/)
│   ├── library/
│   │   ├── page.tsx            # Full catalog (/library)
│   │   └── [category-slug]/
│   │       └── page.tsx        # Category page
│   ├── prompt/
│   │   └── [slug]/
│   │       └── page.tsx        # Prompt detail
│   ├── favorites/
│   │   └── page.tsx            # localStorage-based favorites
│   ├── admin/
│   │   ├── layout.tsx          # Admin layout with auth check
│   │   ├── page.tsx            # Login
│   │   ├── prompts/
│   │   ├── categories/
│   │   └── analytics/
│   ├── api/v1/                 # REST API route handlers
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── ui/                     # shadcn/ui components
│   └── ...                     # Project components
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client (cookies-based)
│   │   └── admin.ts            # Service role client
│   ├── fonts.ts                # next/font definitions
│   └── utils.ts
└── types/
```

### Data Fetching Patterns
- **Public pages** (/, /library, /prompt/[slug]): Server Components fetch directly from Supabase — no API round-trip needed
- **API routes** (/api/v1/*): Route Handlers for external consumption (future WhatsApp bot, mobile app)
- **Admin mutations**: Server Actions for CRUD operations (type-safe, progressive enhancement)
- **Client interactivity** (variable substitution, favorites): Client Components with data passed from Server Component parents
- **Avoid waterfalls**: Use `Promise.all` for parallel fetches, Suspense for streaming

### RSC Boundaries
- Pages and layouts are Server Components by default — keep them async
- Interactive pieces (search bar, variable inputs, copy button, favorites toggle) are Client Components
- Never pass Date objects, Maps, or functions to Client Components — serialize first
- Server Actions (marked `'use server'`) CAN be passed as props to Client Components

### Fonts (next/font)
- Import Inter and Noto Sans SC once in `lib/fonts.ts`, apply as CSS variables in root layout
- Use `subsets: ['latin']` for Inter, load Noto Sans SC for CJK characters
- Never use `<link>` or `@import` for fonts

### Metadata
- Root layout: title template `%s | Vibe Coding Learning Hub`
- Dynamic `generateMetadata` on `/prompt/[slug]` pages for SEO
- Use `react.cache()` to deduplicate data fetches between metadata and page
- Static `opengraph-image.tsx` for site-wide OG, dynamic per-prompt OG later

### Design Tokens
- Token definitions: `design-tokens.json` (three-layer: primitive → semantic → component)
- CSS variables: `design-tokens.css` (import in globals.css)
- shadcn/ui HSL convention for Tailwind integration
- Primary = Yellow #FCD34D (not default blue)

### shadcn/ui Setup
- Init: `npx shadcn@latest init -d` (non-interactive)
- Style: `new-york` — but light mode (not dark) since this is a content-first public catalog
- Base color: `slate` (matches PRD)
- After init, fix font declarations in `@theme inline` with literal font names (Inter, Noto Sans SC)
- Key components needed: `button`, `card`, `input`, `textarea`, `select`, `badge`, `dialog`, `table`, `tabs`, `dropdown-menu`, `sheet`, `skeleton`, `separator`, `tooltip`, `command`, `label`, `popover`
- Page composition:
  - Library page: `Card` grid + sidebar filters + `Select` + `Badge`
  - Prompt detail: header + `Badge` + `Card` + `Separator`
  - Admin prompt list: `Table` + `DropdownMenu` + `Sheet`
  - Admin editor: two-column `Card` layout with live preview
  - Analytics: summary `Card`s + `Table`
- Use `cn()` utility for all conditional class merging
- Extend `buttonVariants` for copy button (yellow primary variant)

### Supabase / Postgres Best Practices
- **RLS policies**: Always wrap `auth.uid()` in `(select auth.uid())` to avoid per-row function calls (100x+ faster)
- **Foreign key indexes**: Postgres does NOT auto-index FKs — always create indexes on `category_id`, `prompt_id`, etc.
- **Full-text search**: Use generated `tsvector` column + GIN index for prompt search (not ILIKE). For Chinese text, use `simple` config or `pg_jieba` if available; fallback to `ILIKE` for v1
- **Pagination**: Use cursor-based pagination (keyset) not OFFSET for the library page
- **Connection pooling**: Use Supabase's built-in PgBouncer (transaction mode) for all connections
- **RLS pattern for this project**:
  - Public tables (categories, published prompts, variables, tags): `SELECT` for `anon` role, filtered by `status = 'published'` for prompts
  - Admin tables: All write ops restricted to `authenticated` users whose email is in `admins` allowlist
  - Events table: Public `INSERT` (anon can log events), admin-only `SELECT`
