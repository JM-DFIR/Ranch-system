import { createFileRoute } from "@tanstack/react-router";

import { WeightsTab } from "@/features/animals/components/tabs/WeightsTab";

export const Route = createFileRoute("/_authenticated/animals/$animalId/weights")({
  component: WeightsRoute,
});

function WeightsRoute() {
  const { animalId } = Route.useParams();
  return <WeightsTab animalId={animalId} />;
}
