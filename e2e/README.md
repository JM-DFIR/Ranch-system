# E2E tests

`auth.spec.ts` covers the critical paths verifiable without a live Supabase
test project: the login/forgot-password pages rendering and validating,
the protected-route redirect (`_authenticated`'s `requireSession`), and
the Accept Invitation page's two states. This environment has no
Docker/Supabase CLI (see `seed.sql`'s own note), so nothing that needs a
real signed-in session is covered yet.

## Extending this to authenticated flows

To add specs for the actual critical paths that need a session — add
animal, record death, record a movement, and so on — you need a real
disposable Supabase project (not production) with:

1. A seeded org/owner/manager, e.g. via `seed.sql`'s `owner@dev.local` /
   `manager@dev.local` fixtures, or your own.
2. `PLAYWRIGHT_BASE_URL` pointed at a deployed preview, or just run
   against `pnpm dev` locally like this suite does.
3. A `playwright.config.ts` project with a `storageState` produced by a
   one-time auth setup project (Playwright's standard pattern — a
   `setup` project logs in once via the real `/login` form and saves
   `storageState.json`; every other project depends on it and starts
   already authenticated, rather than every test logging in itself).

Don't point this at the production project, and don't commit real
credentials — use environment variables
(`TEST_OWNER_EMAIL`/`TEST_OWNER_PASSWORD`) read at run time.

## Why `getByLabel` uses `exact: true` everywhere

TanStack Router Devtools (`src/routes/__root.tsx`, `DEV`-only) renders
buttons like "Open match details for /forgot-password" — their
accessible name contains "password" as a substring, which Playwright's
default (non-exact) `getByLabel` also matches. Every label lookup in
this suite passes `exact: true` for that reason, found running the
suite for real against `pnpm dev`, not assumed.
