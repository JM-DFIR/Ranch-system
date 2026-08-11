import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { sessionQueryOptions } from "@/lib/auth";

// Every screen behind this layout requires a session. Redirects to
// /login and preserves the intended destination via the `redirect`
// search param, so the post-login navigate() in login.tsx can send the
// user back to where they were actually headed.
//
// Session-only check for now — see lib/auth.ts for why role-aware nav
// and the ranch scope switcher (also part of this shell) wait on real
// generated types rather than being built here too.
export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    const { session } = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: () => <Outlet />,
});
