import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { sessionQueryOptions } from "@/lib/auth";
import { AppShell } from "@/app/shell/AppShell";

// Every screen behind this layout requires a session, and shares one
// ranch scope — a specific ranch id, or "all ranches" when absent —
// encoded here (not per-child-route) so every descendant route reads
// the same scope via `Route.useSearch()` imported from this file
// (blueprint.md: "sets scope for the entire application... encoded in
// the URL search params... so views are shareable and survive refresh").
const authenticatedSearchSchema = z.object({
  ranch: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated")({
  validateSearch: authenticatedSearchSchema,
  beforeLoad: async ({ context, location }) => {
    const { session } = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
