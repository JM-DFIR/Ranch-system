import { createFileRoute, Outlet } from "@tanstack/react-router";
import { z } from "zod";

import { requireSession } from "@/lib/auth";

// A second top-level auth-gated layout, alongside _authenticated.tsx —
// Enrollment Mode is explicitly "full screen, no sidebar" (session-pack.md,
// Session 5b), so it can't live inside AppShell the way every other
// screen does. Shares the same session guard (lib/auth.ts's
// requireSession) so the two layouts can't drift on what "authenticated"
// means, but renders nothing else — each child route (live capture,
// batch grid, tag generator) builds its own header suited to its own
// context rather than inheriting chrome designed for a desktop app shell.
//
// `ranch` is declared here too, duplicating _authenticated's own
// schema — this layout is a sibling, not a descendant, of
// _authenticated, so it can't inherit that route's search validation.
// Sidebar.tsx's nav links carry the current ranch across explicitly
// when navigating from one layout into the other.
const enrollmentSearchSchema = z.object({
  ranch: z.string().optional(),
});

export const Route = createFileRoute("/_enrollment")({
  validateSearch: enrollmentSearchSchema,
  beforeLoad: ({ context, location }) => requireSession(context.queryClient, location.href),
  component: () => (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  ),
});
