# LIMS — Operations Runbook

This is the "how does this actually run" reference: environments,
deployment, migrations, and what to do when something breaks. It
assumes you've read `CLAUDE.md` and `blueprint.md` for product/design
context — this document is operational, not architectural.

## 1. Environments

There is currently **one** Supabase project, used throughout
development by applying every migration in `supabase/migrations/`
directly via its SQL editor. Before a real production launch, decide
explicitly which of these two paths you're taking — don't let it
happen by default:

- **Keep this project as production.** Simplest — nothing to replay.
  Means every migration applied during development is already "in
  production," which is fine since `seed.sql` was never run against it
  (only local `supabase start` runs seed data) and no real client data
  has been entered yet.
- **Create a fresh production project** and replay `supabase/migrations/`
  against it in order (via the dashboard SQL editor, same as always,
  or `supabase db push` once linked via the CLI), matching
  blueprint.md's original dev/prod split. Cleaner separation, more
  setup.

Either way, update `.env.local` (and Netlify's environment variables —
see §3) to point at whichever project is production, and never let the
`service_role` key leave Edge Function secrets (CLAUDE.md §7).

There's also now a **local** environment (`supabase start`, Docker-backed)
used for `pnpm db:test`'s pgTAP suite and CI's migration dry-run — see
§5. It's disposable and never holds real data.

## 2. Applying a migration

Every schema change is a new file in `supabase/migrations/`, numbered
sequentially (`NNNN_description.sql`), committed to git. This project
has never used `supabase db push` against the real project — the
established process is:

1. Write the migration file, get it reviewed same as any other code
   change.
2. Run it via the Supabase dashboard's SQL editor against the target
   project, in order. Never skip a number, never apply out of order.
3. Run `pnpm db:types` to regenerate `src/types/database.generated.ts`
   from the live schema.
4. Commit both the migration file and the regenerated types together.

**Never make a schema change directly in the dashboard** without a
matching migration file — the file is the source of truth; the live
database is just where it's been applied. If the dashboard and
`supabase/migrations/` ever disagree, the migration files win, and the
database needs to be brought back in line by hand.

Migrations are forward-only — there is no down-migration mechanism in
this project. Undoing a bad migration means writing a new migration
that reverses it, not rolling back the old one.

## 3. Deploying the app (Netlify)

`netlify.toml` at the repo root has the build command (`pnpm build`),
publish directory (`dist`), the SPA fallback redirect TanStack
Router's client-side routing needs, and a no-cache header for
`sw.js` (vite-plugin-pwa's service worker must never be served stale).

Connect the repo to a Netlify site (this hasn't been done yet — it's a
real account/site-creation step for you to do, not something built
into the repo) and set these environment variables in Netlify's site
settings, not from `.env.local` (which is gitignored and never
deployed):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SENTRY_DSN` (optional — see §6)

Every push to `main` should auto-deploy once the site is connected.
Netlify keeps every previous deploy and supports instant one-click
rollback to any of them from its dashboard — that's the rollback path
for a bad app deploy. There is no equivalent instant rollback for the
database; see §2.

## 4. Edge Functions

One function exists: `supabase/functions/accept-invitation` — it needs
`service_role` (creating an `auth.users` row via the Admin API, and
`invitations` is owner-only-readable under RLS) so it can't run as a
plain RPC. Deploy it with:

```
supabase functions deploy accept-invitation
```

It hasn't been deployed or exercised against a live project from any
environment this codebase has been built in — see the note at the top
of `supabase/functions/accept-invitation/index.ts`. Test the real
Accept Invitation flow end-to-end (Admin > Users > Invite → the emailed
link → account setup) before relying on it for a real user.

## 5. CI (`.github/workflows/ci.yml`)

Three jobs, all on every push/PR against `main`:

- **app** — typecheck, lint, unit tests (Vitest), production build.
- **e2e** — Playwright, scoped to the auth shell's unauthenticated
  paths (login validation, the protected-route redirect, Accept
  Invitation's two states — see `e2e/README.md`). Needs no secrets:
  nothing in this suite requires a real signed-in session.
- **db** — `supabase start` against an ephemeral CI-only Postgres
  (applies every migration from scratch — the first automated check
  that the full chain applies cleanly in order, not just piecemeal
  against a project that already had the previous ones), then
  `pnpm db:test` runs the full pgTAP suite.

None of these jobs touch the real Supabase project or Netlify — they
run in throwaway containers.

## 6. Monitoring

Sentry is wired into the app (`src/lib/sentry.ts`) but stays inert
until `VITE_SENTRY_DSN` is set — no account has been created for this
project yet. Once you have one:

1. Create a Sentry project (React/Vite).
2. Set `VITE_SENTRY_DSN` in Netlify's environment variables and your
   own `.env.local`.
3. Redeploy.

Source-mapped stack traces (uploading build sourcemaps to Sentry) is a
deliberate follow-up, not done here — it needs `@sentry/vite-plugin`
plus a Sentry auth token as a build secret, and shipping public
sourcemaps in `dist/` otherwise exposes readable source in the
browser, which isn't a call to make silently.

Beyond Sentry, day-to-day places to look when something's wrong:

- **Netlify** — deploy logs (build failures) and function logs if any
  Netlify Functions are ever added (none exist today — Edge Functions
  live in Supabase, not Netlify).
- **Supabase dashboard** — Database > Logs (query errors, RLS
  denials), Auth > Logs (login/invite failures), Edge Functions > Logs
  (`accept-invitation`).
- **Browser devtools console**, for a specific user's report — this is
  a client-heavy SPA, so most runtime errors surface there first.
- **The in-app Sync panel** (`SyncIndicator`/offline queue UI) — for
  reports of "my change didn't save," check whether it's stuck in the
  offline queue first. See §7.

## 7. Offline sync — what to check when a write "goes missing"

Only five operations are ever queued offline (CLAUDE.md §8):
`create_animal`, `attach_photo`, `create_health_event`, `create_weight`,
`create_movement`. Everything else requires connectivity and fails
visibly with `OfflineBlock` if attempted offline — those can't "go
missing," they simply didn't submit.

For the five queued operations:

- Record-level conflicts resolve last-write-wins on server timestamp —
  not usually visible as a problem.
- **Business-key conflicts** (two people offline both claiming the same
  `tag_number`) surface as a queue entry with `status = 'conflict'` in
  the sync panel, never silently dropped or endlessly retried. The fix
  is renaming the tag in the sync panel's own resync action — walk the
  user through that rather than digging into the queue table by hand.

## 8. First production data entry

There is no historical data migration by design (blueprint.md §2.4) —
the owner's first real session with the system **is** data entry: a
few hundred animals, captured by hand via Enrollment Mode or Batch
Enrollment. See `docs/quick-start-guide.md` for the walkthrough to hand
him before that session, and CLAUDE.md's own framing: this is treated
as the highest-stakes part of the product, worth testing on his actual
phone/signal before he relies on it for real.
