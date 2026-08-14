import { Link } from "@tanstack/react-router";

import { PageHeader } from "@/components/patterns/PageHeader";
import { REPORTS } from "../registry";

// The Report Gallery (M6 — session-pack.md Part 5), grouped by the
// module each report belongs to. Same card-grid shape as
// HealthHubPage.tsx — pure navigation, no live numbers on the cards
// themselves.
export function ReportGalleryPage() {
  const byModule = new Map<string, typeof REPORTS>();
  for (const report of REPORTS) {
    const list = byModule.get(report.module) ?? [];
    list.push(report);
    byModule.set(report.module, list);
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader title="Reports" description="Thirteen reports across every module, filterable and exportable." />
      {[...byModule.entries()].map(([module, reports]) => (
        <div key={module} className="space-y-2">
          <h2 className="text-13 font-medium tracking-wide text-muted-foreground uppercase">{module}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <Link
                key={report.id}
                to="/reports/$reportId"
                params={{ reportId: report.id }}
                className="flex flex-col gap-2 rounded-card border border-line bg-card p-4 transition-colors hover:border-primary/40 hover:bg-secondary/40"
              >
                <div className="flex size-8 items-center justify-center rounded-card bg-muted text-muted-foreground">
                  <report.icon className="size-4" aria-hidden />
                </div>
                <p className="text-14 font-medium text-foreground">{report.label}</p>
                <p className="text-13 text-muted-foreground">{report.description}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
