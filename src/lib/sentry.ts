import * as Sentry from "@sentry/react";

// Stays completely inert until VITE_SENTRY_DSN is set — no Sentry
// project has been created for this app yet (docs/runbook.md §6), so
// this can't do anything destructive or costly by existing; it's
// wiring for when a real DSN exists, not an active integration today.
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Source-mapped stack traces need @sentry/vite-plugin plus an auth
    // token as a build secret, deliberately not set up yet — see
    // docs/runbook.md §6 for why that's a real follow-up, not an
    // oversight.
  });
}
