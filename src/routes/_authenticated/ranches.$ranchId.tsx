import { createFileRoute } from "@tanstack/react-router";

import { RanchDetailPage } from "@/features/ranches/components/RanchDetailPage";

export const Route = createFileRoute("/_authenticated/ranches/$ranchId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { ranchId } = Route.useParams();
  return <RanchDetailPage ranchId={ranchId} />;
}
