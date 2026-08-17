import { createFileRoute } from "@tanstack/react-router";

import { RanchListPage } from "@/features/ranches/components/RanchListPage";

// Moved here from ranches.tsx (now a bare Outlet layout) — same fix as
// animals.tsx/animals.index.tsx. Without this split, ranches.tsx's own
// file name made it the implicit parent of ranches.$ranchId (TanStack
// Router's file-based convention), but its component (this list) never
// rendered an <Outlet>, so the ranch detail page could never actually
// display.
export const Route = createFileRoute("/_authenticated/ranches/")({
  component: RanchListPage,
});
