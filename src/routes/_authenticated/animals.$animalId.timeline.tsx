import { createFileRoute } from "@tanstack/react-router";

import { TimelineTab } from "@/features/animals/components/tabs/TimelineTab";

export const Route = createFileRoute("/_authenticated/animals/$animalId/timeline")({
  component: TimelineRoute,
});

function TimelineRoute() {
  const { animalId } = Route.useParams();
  return <TimelineTab animalId={animalId} />;
}
