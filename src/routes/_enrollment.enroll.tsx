import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { fetchRanchList } from "@/features/ranches/api";
import { Route as EnrollmentRoute } from "@/routes/_enrollment";
import { EmptyState } from "@/components/patterns/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EnrollmentScreen } from "@/features/enrollment/components/EnrollmentScreen";

// Enrollment is inherently ranch-specific — you're standing on one
// ranch enrolling its animals. _enrollment.tsx has no shared TopBar
// (no sidebar at all, per session-pack.md's Session 5b spec), so
// there's no global ranch switcher to defer to here the way the rest
// of the app can — this route resolves its own ranch scope: the one
// carried over via `ranch` in the URL (Sidebar.tsx passes it through
// on every nav link), auto-selected if there's only one ranch in
// scope, or picked from a small local list otherwise.
export const Route = createFileRoute("/_enrollment/enroll")({
  component: EnrollRoute,
});

function EnrollRoute() {
  const { profile } = useAuth();
  const { ranch } = EnrollmentRoute.useSearch();
  const navigate = EnrollmentRoute.useNavigate();
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

  if (!ranch && isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!ranch) {
    return (
      <div className="mx-auto max-w-sm p-4 pt-12">
        <Link to="/animals" className="mb-4 flex w-fit items-center gap-1 text-13 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to app
        </Link>
        {ranches && ranches.length > 0 ? (
          <div className="space-y-2">
            <p className="text-14 font-medium text-foreground">Choose a ranch to enrol against</p>
            {ranches.map((r) => (
              <Button
                key={r.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => void navigate({ search: (prev) => ({ ...prev, ranch: r.id }) })}
              >
                {r.name}
              </Button>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={MapPin}
            title="No ranches yet"
            description="Create a ranch from the main app before enrolling animals against it."
          />
        )}
      </div>
    );
  }

  return <EnrollmentScreen ranchId={ranch} />;
}
