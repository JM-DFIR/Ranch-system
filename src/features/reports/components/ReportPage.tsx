import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/patterns/PageHeader";
import { EmptyState } from "@/components/patterns/EmptyState";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import { Route as ReportRoute } from "@/routes/_authenticated/reports.$reportId";
import { getReportConfig } from "../registry";
import { ReportFilters } from "./ReportFilters";
import { ReportViewer } from "./ReportViewer";

// Filters shown per report kind — species only makes sense where the
// underlying view is already species-grouped (registry.ts/
// 0029_reports.sql); date range only where the report is a month-by-
// month trend rather than a current-state snapshot.
const SHOWS_SPECIES = new Set(["inventory", "vaccination-compliance", "attention-summary", "breeding-performance", "weight-growth"]);
const SHOWS_DATE_RANGE = new Set(["weight-growth", "monthly-count"]);

export function ReportPage() {
  const { reportId } = ReportRoute.useParams();
  const { ranch } = AuthenticatedRoute.useSearch();
  const search = ReportRoute.useSearch();
  const navigate = ReportRoute.useNavigate();
  const config = getReportConfig(reportId);

  if (!config) {
    return (
      <div className="p-4 md:p-6">
        <EmptyState icon={ArrowLeft} title="Report not found" description="This report doesn't exist." />
      </div>
    );
  }

  const showSpecies = SHOWS_SPECIES.has(config.kind);
  const showDateRange = SHOWS_DATE_RANGE.has(config.kind);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Link to="/reports" className="flex w-fit items-center gap-1 text-13 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to reports
      </Link>
      <PageHeader title={config.label} description={config.description} />
      {showSpecies || showDateRange ? (
        <div className="overflow-hidden rounded-card border border-line">
          <ReportFilters
            search={search}
            onChange={(patch) => void navigate({ search: (prev) => ({ ...prev, ...patch }) })}
            showSpecies={showSpecies}
            showDateRange={showDateRange}
          />
        </div>
      ) : null}
      <ReportViewer config={config} params={{ ranchId: ranch, speciesId: search.species, dateFrom: search.dateFrom, dateTo: search.dateTo }} />
    </div>
  );
}
