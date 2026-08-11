import { createFileRoute } from "@tanstack/react-router";

import { MovementsTab } from "@/features/animals/components/tabs/MovementsTab";

export const Route = createFileRoute("/_authenticated/animals/$animalId/movements")({
  component: MovementsRoute,
});

function MovementsRoute() {
  const { animalId } = Route.useParams();
  return <MovementsTab animalId={animalId} />;
}
