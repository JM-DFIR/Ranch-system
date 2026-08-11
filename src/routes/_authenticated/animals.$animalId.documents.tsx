import { createFileRoute } from "@tanstack/react-router";

import { DocumentsTab } from "@/features/animals/components/tabs/DocumentsTab";

export const Route = createFileRoute("/_authenticated/animals/$animalId/documents")({
  component: DocumentsRoute,
});

function DocumentsRoute() {
  const { animalId } = Route.useParams();
  return <DocumentsTab animalId={animalId} />;
}
