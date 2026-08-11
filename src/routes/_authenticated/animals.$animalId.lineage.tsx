import { createFileRoute } from "@tanstack/react-router";

import { useAnimalProfile } from "@/features/animals/hooks";
import { LineageTab } from "@/features/animals/components/tabs/LineageTab";

export const Route = createFileRoute("/_authenticated/animals/$animalId/lineage")({
  component: LineageRoute,
});

function LineageRoute() {
  const { animalId } = Route.useParams();
  const { data: animal } = useAnimalProfile(animalId);
  if (!animal) return null;
  return <LineageTab animal={animal} />;
}
