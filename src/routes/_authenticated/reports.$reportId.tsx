import { createFileRoute } from "@tanstack/react-router";

import { reportSearchSchema } from "@/features/reports/schema";
import { ReportPage } from "@/features/reports/components/ReportPage";

export const Route = createFileRoute("/_authenticated/reports/$reportId")({
  validateSearch: reportSearchSchema,
  component: ReportPage,
});
