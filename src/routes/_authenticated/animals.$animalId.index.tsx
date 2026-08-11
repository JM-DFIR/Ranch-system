import { createFileRoute } from "@tanstack/react-router";

import { useAnimalProfile } from "@/features/animals/hooks";
import { OverviewTab } from "@/features/animals/components/tabs/OverviewTab";

export const Route = createFileRoute("/_authenticated/animals/$animalId/")({
  component: OverviewRoute,
});

function OverviewRoute() {
  const { animalId } = Route.useParams();
  // Same query key as the parent layout — already resolved and cached
  // by the time this renders, since the layout doesn't render its
  // <Outlet /> until the profile has loaded.
  const { data: animal } = useAnimalProfile(animalId);
  if (!animal) return null;
  return <OverviewTab animal={animal} />;
}
