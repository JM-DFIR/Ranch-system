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
import { TagRangeGeneratorPage } from "@/features/enrollment/components/TagRangeGeneratorPage";

export const Route = createFileRoute("/_authenticated/enroll/tags")({
  component: TagRangeGeneratorRoute,
});

function TagRangeGeneratorRoute() {
  const { profile } = useAuth();
  const { ranch } = AuthenticatedRoute.useSearch();
  const navigate = AuthenticatedRoute.useNavigate();
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
          description="Tags are reserved against the ranch you're currently scoped to. Pick one from the switcher at the top of the screen."
        />
      </div>
    );
  }

  return <TagRangeGeneratorPage ranch={selectedRanch} />;
}
