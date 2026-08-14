import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/patterns/PageHeader";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ErrorState } from "@/components/patterns/ErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchRanchList } from "../api";
import { useRanchStats } from "../hooks";
import { RanchCard } from "./RanchCard";
import { RanchFormDrawer } from "./RanchFormDrawer";

// Ranch List (blueprint.md §4.1/§4.3: "cards on the list"). Create
// Ranch is owner-only (ranches_owner_insert, 0014_rls.sql) — a manager
// sees every ranch they're assigned to, same has_ranch_access scoping
// as everywhere else, just no "Create ranch" action.
export function RanchListPage() {
  const { profile, isOwner } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);

  const {
    data: ranches,
    isLoading: ranchesLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.ranches.list(profile?.orgId ?? ""),
    queryFn: fetchRanchList,
    enabled: !!profile?.orgId,
  });
  const { data: stats, isLoading: statsLoading } = useRanchStats(profile?.orgId);
  const statsByRanchId = new Map((stats ?? []).map((s) => [s.ranchId, s]));
  const isLoading = ranchesLoading || statsLoading;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <PageHeader
        title="Ranches"
        description="Every property in your operation, with its own herd, sections and managers."
        actions={isOwner ? <Button onClick={() => setCreateOpen(true)}>Create ranch</Button> : undefined}
      />

      {isError ? (
        <ErrorState
          title="Couldn't load ranches"
          description={error instanceof Error ? error.message : "Check your connection and try again."}
          onRetry={() => void refetch()}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : !ranches || ranches.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No ranches yet"
          description="Every animal belongs to a ranch. Create your first one with its name and location to get started."
          action={isOwner ? { label: "Create ranch", onClick: () => setCreateOpen(true) } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ranches.map((ranch) => (
            <RanchCard key={ranch.id} ranch={ranch} stats={statsByRanchId.get(ranch.id)} />
          ))}
        </div>
      )}

      {isOwner ? <RanchFormDrawer open={createOpen} onOpenChange={setCreateOpen} /> : null}
    </div>
  );
}
