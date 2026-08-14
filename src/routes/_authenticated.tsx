import { createFileRoute, Outlet } from "@tanstack/react-router";
import { z } from "zod";

import { requireSession, useAuth } from "@/lib/auth";
import { useOrgSettings } from "@/features/admin/hooks";
import { AppShell } from "@/app/shell/AppShell";
import { FeatureFlagsProvider } from "@/components/patterns/FeatureGate";

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
  beforeLoad: ({ context, location }) => requireSession(context.queryClient, location.href),
  component: AuthenticatedLayout,
});

// Real feature_flags now come from organization_settings (Admin >
// Settings, M7) rather than the empty default FeatureFlagsProvider was
// stuck on since Session 1 — every <FeatureGate flag="finance"> in the
// app reads through this same provider, so turning the flag on in
// Settings takes effect everywhere at once.
function AuthenticatedLayout() {
  const { profile } = useAuth();
  const { data: settings } = useOrgSettings(profile?.orgId);

  return (
    <FeatureFlagsProvider value={settings?.featureFlags ?? {}}>
      <AppShell>
        <Outlet />
      </AppShell>
    </FeatureFlagsProvider>
  );
}
