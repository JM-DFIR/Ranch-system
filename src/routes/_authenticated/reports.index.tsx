import { createFileRoute } from "@tanstack/react-router";

import { ReportGalleryPage } from "@/features/reports/components/ReportGalleryPage";

export const Route = createFileRoute("/_authenticated/reports/")({
  component: ReportGalleryPage,
});
