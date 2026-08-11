import { createFileRoute } from "@tanstack/react-router";

import { HealthTab } from "@/features/animals/components/tabs/HealthTab";

export const Route = createFileRoute("/_authenticated/animals/$animalId/health")({
  component: HealthRoute,
});

function HealthRoute() {
  const { animalId } = Route.useParams();
  return <HealthTab animalId={animalId} />;
}
