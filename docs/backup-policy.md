# LIMS — Backup Policy

## Why this matters more than usual here

There is no historical data migration for this system (blueprint.md
§2.4) — every animal record, photo, and health event entered after
launch has no other copy anywhere. Unlike the *schema*, which is
always reconstructable from `supabase/migrations/` in git, the *data*
exists in exactly one place: the production Supabase project. Losing
it isn't an inconvenience, it's losing the client's actual records.

## What Supabase covers, and what depends on your plan

Supabase's backup coverage is tied to the project's billing tier, not
something this codebase controls:

- **Free tier** — no automatic backups. Not appropriate for production
  once real client data exists.
- **Pro tier and above** — daily automatic backups, retained for a
  period set by the plan (check the current terms on Supabase's
  pricing page — this changes over time and shouldn't be hardcoded
  here).
- **Point-in-time recovery (PITR)** — a paid add-on on top of Pro,
  restoring to any point within its retention window rather than only
  to the last daily snapshot. Worth it once real data volume makes
  losing up to a day's entries unacceptable — which, given the client
  hand-enters a full herd at launch, is arguably from day one.

**Action for you:** confirm which tier the production project is on
before go-live, and upgrade if it's still Free. This isn't something
that can be verified or changed from the codebase — check the
Supabase dashboard's Billing section for the actual project being used
as production (see `docs/runbook.md` §1 for the dev/prod decision this
depends on).

## Storage (photos, documents)

Animal photos, ranch covers, and uploaded documents live in Supabase
Storage, not in Postgres tables. Storage objects are generally included
in Supabase's project-level backups on Pro+, but this should be
**verified directly against Supabase's current documentation** before
relying on it — object storage backup coverage has historically been a
separate guarantee from database backups on some platforms, and this
document shouldn't assert something it can't confirm stays true.

## Testing a restore

A backup nobody has ever restored from is a hope, not a policy. Before
go-live, and periodically after:

1. In the Supabase dashboard, under Database > Backups, restore the
   most recent backup **into a new, separate project** — never restore
   over the live production project as a test.
2. Confirm the restored project has the expected tables, row counts,
   and that a signed-in test user can actually read data through the
   app pointed at it.
3. Delete the test project once confirmed.

## If you're not on a tier with automatic backups yet

A manual fallback, until the production project is upgraded:

```
supabase db dump --db-url <production-connection-string> -f backup.sql
```

Run this on a schedule (a simple cron job or GitHub Actions scheduled
workflow, kept **outside** this repo's own CI — a database credential
with dump access shouldn't live in the same secrets scope as routine
app CI) and store the output somewhere durable and access-controlled,
not a laptop. This is a stopgap, not a substitute for turning on real
automatic backups.

## What this policy does not cover

- Netlify's deploy history covers *app code* rollback (§3 of the
  runbook) — it has nothing to do with database backups.
- The local `supabase start` environment used for `pnpm db:test` is
  disposable by design and never holds anything worth backing up.
