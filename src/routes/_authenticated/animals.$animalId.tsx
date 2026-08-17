import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ArrowLeft, PawPrint } from "lucide-react";

import { EmptyState } from "@/components/patterns/EmptyState";
import { ErrorState } from "@/components/patterns/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import { useAnimalProfile } from "@/features/animals/hooks";
import { ProfileHeader } from "@/features/animals/components/ProfileHeader";
import { ProfileTabNav } from "@/features/animals/components/ProfileTabNav";

// Layout route (session-pack.md, Session 4 — "the signature screen"):
// fetches the animal once here, renders the header + tab nav, and every
// child tab route reads the same cached profile via useAnimalProfile()
// rather than re-fetching (same query key, TanStack Query dedupes it).
export const Route = createFileRoute("/_authenticated/animals/$animalId")({
  component: AnimalProfileLayout,
});

function AnimalProfileLayout() {
  const { animalId } = Route.useParams();
  const { ranch } = AuthenticatedRoute.useSearch();
  const { data: animal, isLoading, isError, error, refetch } = useAnimalProfile(animalId);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Link to="/animals" search={{ ranch }} className="flex w-fit items-center gap-1 text-13 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to register
      </Link>

      {isLoading ? (
        <div className="flex items-start gap-4 border-b border-line pb-4">
          <Skeleton className="size-20 shrink-0 rounded-card" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
      ) : isError ? (
        <ErrorState
          title="Couldn't load this animal"
          description={error instanceof Error ? error.message : "Check your connection and try again."}
          onRetry={() => void refetch()}
        />
      ) : !animal ? (
        <EmptyState
          icon={PawPrint}
          title="Animal not found"
          description="It may have been removed, or you may not have access to its ranch."
        />
      ) : (
        <>
          <ProfileHeader animal={animal} />
          <ProfileTabNav animalId={animalId} />
          <Outlet />
        </>
      )}
    </div>
  );
}
