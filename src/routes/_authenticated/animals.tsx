import { createFileRoute, Outlet } from "@tanstack/react-router";

// Bare Outlet layout, same pattern as reports.tsx — the register moved
// to animals.index.tsx. See that file's comment: without this split,
// this file's own name made it the implicit parent of every
// animals.$animalId* route (TanStack Router's file-based convention),
// but its old component (the register) never rendered an <Outlet>, so
// the animal profile could never actually display — see git history
// for the full diagnosis.
export const Route = createFileRoute("/_authenticated/animals")({
  component: Outlet,
});
