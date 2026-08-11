import { createFileRoute } from "@tanstack/react-router";

import { FeedingCareTab } from "@/features/animals/components/tabs/FeedingCareTab";

export const Route = createFileRoute("/_authenticated/animals/$animalId/feeding-care")({
  component: FeedingCareRoute,
});

function FeedingCareRoute() {
  const { animalId } = Route.useParams();
  return <FeedingCareTab animalId={animalId} />;
}
