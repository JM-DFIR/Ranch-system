import { createFileRoute, Outlet } from "@tanstack/react-router";

// Reports layout (M6 — session-pack.md Part 5) — bare Outlet, unlike
// Health/Breeding/Feeding's own layouts: the gallery and an individual
// report are a drill-down pair (a "back to reports" link), not sibling
// tabs sharing a persistent strip.
export const Route = createFileRoute("/_authenticated/reports")({
  component: Outlet,
});
