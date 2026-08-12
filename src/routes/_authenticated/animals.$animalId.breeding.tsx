import { createFileRoute } from "@tanstack/react-router";

import { useAnimalProfile } from "@/features/animals/hooks";
import { BreedingTab } from "@/features/animals/components/tabs/BreedingTab";

export const Route = createFileRoute("/_authenticated/animals/$animalId/breeding")({
  component: BreedingRoute,
});

function BreedingRoute() {
  const { animalId } = Route.useParams();
  const { data: animal } = useAnimalProfile(animalId);
  if (!animal) return null;
  return <BreedingTab animalId={animalId} tagNumber={animal.tagNumber} sex={animal.sex} />;
}
