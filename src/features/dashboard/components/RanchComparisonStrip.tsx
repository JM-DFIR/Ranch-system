import { Link } from "@tanstack/react-router";
import { MapPin, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import type { RanchStat } from "@/features/ranches/api";

interface RanchComparisonStripProps {
  ranches: RanchStat[] | undefined;
  isLoading: boolean;
}

function topSpecies(breakdown: Record<string, number>, limit = 3): string {
  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return "No animals yet";
  return entries
    .slice(0, limit)
    .map(([name, count]) => `${count} ${name}`)
    .join(" · ");
}

// One card per ranch — icon rather than the real cover image (the
// Ranches module's own List page, features/ranches/components/
// RanchListPage.tsx, is where cover images are the star; fetching a
// signed URL per ranch on every dashboard load for a strip this compact
// isn't worth it), headcount, species split, attention count
// (session-pack.md, Session 7). Each card links to the Ranch Detail
// page now that one exists (M7's Ranches module) — previously this
// linked to the animal register pre-scoped to that ranch, back when
// Ranch Detail didn't exist yet.
export function RanchComparisonStrip({ ranches, isLoading }: RanchComparisonStripProps) {
  const { ranch: scopedRanch } = AuthenticatedRoute.useSearch();

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1">
        <Skeleton className="h-28 w-56 shrink-0" />
        <Skeleton className="h-28 w-56 shrink-0" />
      </div>
    );
  }

  if (!ranches || ranches.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {ranches.map((r) => (
        <Link
          key={r.ranchId}
          to="/ranches/$ranchId"
          params={{ ranchId: r.ranchId }}
          search={{ ranch: scopedRanch }}
          className="flex w-56 shrink-0 flex-col gap-2 rounded-card border border-line bg-card p-3 transition-colors hover:border-primary"
        >
          <div className="flex items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-card bg-muted text-muted-foreground">
              <MapPin className="size-4" aria-hidden />
            </div>
            <p className="min-w-0 truncate text-14 font-medium text-foreground">{r.ranchName}</p>
          </div>
          <p className="font-mono text-20 font-medium tabular-nums text-foreground">{r.activeAnimalCount.toLocaleString()}</p>
          <p className="truncate text-12 text-muted-foreground">{topSpecies(r.speciesBreakdown)}</p>
          {r.attentionCount > 0 ? (
            // v_ranch_stats' attention_count is animals-affected, not
            // reasons, and carries no worst-severity of its own (that's
            // per-animal, from v_animal_attention_summary) — a plain
            // warn badge rather than AttentionBadge's "N issues" wording,
            // which would overclaim severity this view doesn't have.
            <Badge variant="warn" className="w-fit gap-1">
              <TriangleAlert aria-hidden />
              {r.attentionCount} {r.attentionCount === 1 ? "animal" : "animals"} need attention
            </Badge>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
