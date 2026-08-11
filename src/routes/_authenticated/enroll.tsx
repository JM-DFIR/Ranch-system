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
import { EnrollmentScreen } from "@/features/enrollment/components/EnrollmentScreen";

// Enrollment is inherently ranch-specific — you're standing on one
// ranch enrolling its animals — so this reads the same global ranch
// scope every other screen does (_authenticated's `ranch` search
// param, Session 2) rather than adding a second, competing ranch
// picker. Choosing a ranch is something to do before losing signal,
// not part of the minimal capture flow itself (session-pack.md,
// Session 5a).
export const Route = createFileRoute("/_authenticated/enroll")({
  component: EnrollRoute,
});

function EnrollRoute() {
  const { profile } = useAuth();
  const { ranch } = AuthenticatedRoute.useSearch();
  const navigate = AuthenticatedRoute.useNavigate();
  const { data: ranches, isLoading } = useQuery({
    queryKey: queryKeys.ranches.list(profile?.orgId ?? ""),
    queryFn: fetchRanchList,
    enabled: !!profile?.orgId && !ranch,
  });

  // If there's only one ranch in scope, use it rather than making
  // enrollment depend on a manual switcher interaction working
  // correctly first — most single-ranch owners and every manager with
  // one assignment never need to touch the switcher at all for this.
  useEffect(() => {
    if (!ranch && ranches?.length === 1) {
      void navigate({ search: (prev) => ({ ...prev, ranch: ranches[0]?.id }) });
    }
  }, [ranch, ranches, navigate]);

  if (!ranch && isLoading) {
    return (
      <div className="p-4 md:p-6">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!ranch) {
    return (
      <div className="p-4 md:p-6">
        <EmptyState
          icon={MapPin}
          title="Choose a ranch first"
          description="Enrollment records animals against the ranch you're currently scoped to. Pick one from the switcher at the top of the screen before you head out."
        />
      </div>
    );
  }

  return <EnrollmentScreen ranchId={ranch} />;
}
