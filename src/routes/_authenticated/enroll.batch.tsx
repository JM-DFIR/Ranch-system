import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { fetchRanchList } from "@/features/ranches/api";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import { EmptyState } from "@/components/patterns/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { BatchEnrollmentPage } from "@/features/enrollment/components/BatchEnrollmentPage";

// Desktop-sized (session-pack.md, Session 5b) — unlike live Enrollment
// Mode, this stays inside the normal AppShell (sidebar, top bar, ranch
// switcher) rather than _enrollment's full-screen layout, since it's a
// desk-based data-entry task, not a field-capture one.
export const Route = createFileRoute("/_authenticated/enroll/batch")({
  component: BatchEnrollRoute,
});

function BatchEnrollRoute() {
  const { profile } = useAuth();
  const { ranch } = AuthenticatedRoute.useSearch();
  const navigate = AuthenticatedRoute.useNavigate();
  // Fetched regardless of whether `ranch` is already set — even then,
  // BatchEnrollmentPage needs the ranch's *name*, not just its id.
  const { data: ranches, isLoading } = useQuery({
    queryKey: queryKeys.ranches.list(profile?.orgId ?? ""),
    queryFn: fetchRanchList,
    enabled: !!profile?.orgId,
  });

  useEffect(() => {
    if (!ranch && ranches?.length === 1) {
      void navigate({ search: (prev) => ({ ...prev, ranch: ranches[0]?.id }) });
    }
  }, [ranch, ranches, navigate]);

  const selectedRanch = ranches?.find((r) => r.id === ranch);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!ranch || !selectedRanch) {
    return (
      <div className="p-4 md:p-6">
        <EmptyState
          icon={MapPin}
          title="Choose a ranch first"
          description="Batch Enrollment records animals against the ranch you're currently scoped to. Pick one from the switcher at the top of the screen."
        />
      </div>
    );
  }

  return <BatchEnrollmentPage ranch={selectedRanch} />;
}
