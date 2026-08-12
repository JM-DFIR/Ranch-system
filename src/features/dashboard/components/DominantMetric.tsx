import { Link } from "@tanstack/react-router";

import { StatCard } from "@/components/patterns/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "../api";

interface DominantMetricProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
  ranch: string | undefined;
}

// The dominant metric + its counterpoint (blueprint.md §5: "one
// dominant metric... three times larger than anything around it").
// Trend reads new_enrollments_last_30_days/deaths_last_30_days rather
// than a true historical snapshot diff — see 0027_dashboard_trend.sql
// for why that reconstruction isn't cheap in this schema. The
// counterpoint links to the real Attention Queue (Session 8) — it
// pointed at the register pre-filtered to `attention=1` in Session 7,
// before that screen existed; the register filter is still there for
// its own entry point (the register's own FilterBar toggle), just no
// longer this card's destination.
export function DominantMetric({ stats, isLoading, ranch }: DominantMetricProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const net = stats.newEnrollmentsLast30Days - stats.deathsLast30Days;
  const trendLabel =
    net === 0
      ? "No change since last month"
      : `${net > 0 ? "+" : ""}${net} since last month (${stats.newEnrollmentsLast30Days} enrolled, ${stats.deathsLast30Days} died)`;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
      <StatCard label="Active animals" value={stats.activeAnimalCount.toLocaleString()} trendLabel={trendLabel} emphasis="dominant" />
      <Link to="/attention" search={{ ranch }} className="block rounded-card">
        <StatCard
          label="Requires attention"
          value={stats.attentionCount.toLocaleString()}
          trendLabel={stats.attentionCount > 0 ? "View the animals affected →" : "Nothing needs attention right now"}
          tone={stats.attentionCount > 0 ? "critical" : "default"}
          className="h-full transition-colors hover:border-status-critical/40"
        />
      </Link>
    </div>
  );
}
