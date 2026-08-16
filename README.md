# LIMS — Livestock Inventory Management System

A multi-ranch livestock records system: every animal — cow, goat,
sheep, or any other species an owner adds — gets an individual digital
record, created once and updated for the rest of its life. Built for a
Kenyan ranch owner with two properties, replacing paper books.

Full product/design context lives in `blueprint.md` (the governing
spec) and `CLAUDE.md` (working rules for this repo) — read those
before making changes here.

## Stack

React 19 + TypeScript (strict) + Vite · TanStack Router/Query/Table ·
Tailwind v4 + shadcn/ui · React Hook Form + Zod 4 · Supabase
(Postgres/Auth/RLS/Storage/Edge Functions) · Dexie (offline write
queue) · vite-plugin-pwa · Vitest · Playwright · pgTAP · Netlify.

## Getting started

```
pnpm install
cp .env.example .env.local   # fill in your Supabase project's URL + anon key
pnpm dev
```

For the full local setup — including running the Supabase CLI's local
Docker stack for `pnpm db:test` — see `docs/runbook.md` §1 and §5.

## Scripts

| Command             | Does                                                    |
| -------------------- | -------------------------------------------------------- |
| `pnpm dev`            | Start the Vite dev server                                |
| `pnpm build`          | Typecheck + production build                              |
| `pnpm typecheck`      | `tsc -b --noEmit`                                          |
| `pnpm lint`           | ESLint                                                    |
| `pnpm test`           | Unit tests (Vitest)                                        |
| `pnpm test:e2e`       | E2E tests (Playwright) — see `e2e/README.md`               |
| `pnpm db:types`       | Regenerate `src/types/database.generated.ts` from the live schema |
| `pnpm db:test`        | Run the pgTAP RLS suite against a local Supabase stack (`supabase start` first) |

## Repository layout

Feature-sliced under `src/features/<feature>/` (`api.ts`, `schema.ts`,
`components/`, `hooks/`) — everything about one feature lives together,
never split by layer. See `CLAUDE.md` §3 for the full structure.

Database migrations are SQL files in `supabase/migrations/`, applied by
hand against the target Supabase project (never via the dashboard UI
directly) — see `docs/runbook.md` §2 for the exact process.

## Docs

- `docs/runbook.md` — environments, deployments, migrations, incident
  response.
- `docs/backup-policy.md` — what's backed up, what isn't, and how to
  verify it.
- `docs/quick-start-guide.md` — a plain-language walkthrough for the
  ranch owner and managers, not developers.
- `docs/patterns/record-drawer.md` — the shared "record an event"
  drawer pattern used throughout the app.
