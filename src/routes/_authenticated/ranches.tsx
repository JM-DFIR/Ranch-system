import { createFileRoute, Outlet } from "@tanstack/react-router";

// Bare Outlet layout, same pattern as reports.tsx — the ranch list
// moved to ranches.index.tsx. See that file's comment for why.
export const Route = createFileRoute("/_authenticated/ranches")({
  component: Outlet,
});
