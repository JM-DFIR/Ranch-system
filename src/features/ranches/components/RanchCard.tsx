import { Link } from "@tanstack/react-router";
import { MapPin, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { RanchOption, RanchStat } from "../api";
import { useRanchCoverUrl } from "../hooks";

interface RanchCardProps {
  ranch: RanchOption;
  stats: RanchStat | undefined;
}

function topSpecies(breakdown: Record<string, number>, limit = 3): string {
  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return "No animals yet";
  return entries
    .slice(0, limit)
    .map(([name, count]) => `${count} ${name}`)
    .join(" · ");
}

// The Ranch List's card — this is the module's own showcase for the
// cover image (blueprint.md §4.3: "cards on the list"), unlike the
// dashboard's compact RanchComparisonStrip, which deliberately stays
// icon-only. One signed-url fetch per card is fine at this scale (a
// two-property ranch owner, CLAUDE.md's own framing — never hundreds
// of ranches).
export function RanchCard({ ranch, stats }: RanchCardProps) {
  const { data: coverUrl } = useRanchCoverUrl(ranch.coverImagePath);

  return (
    <Link
      to="/ranches/$ranchId"
      params={{ ranchId: ranch.id }}
      className="flex flex-col overflow-hidden rounded-card border border-line bg-card transition-colors hover:border-primary/40"
    >
      {coverUrl ? (
        <img src={coverUrl} alt="" className="aspect-video w-full object-cover" />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-secondary/40 text-muted-foreground">
          <MapPin className="size-8" aria-hidden />
        </div>
      )}
      <div className="flex flex-col gap-1.5 p-4">
        <p className="text-16 font-medium text-foreground">{ranch.name}</p>
        {stats ? (
          <>
            <p className="font-mono text-20 font-medium tabular-nums text-foreground">{stats.activeAnimalCount.toLocaleString()}</p>
            <p className="truncate text-13 text-muted-foreground">{topSpecies(stats.speciesBreakdown)}</p>
            {stats.attentionCount > 0 ? (
              <Badge variant="warn" className="w-fit gap-1">
                <TriangleAlert aria-hidden />
                {stats.attentionCount} {stats.attentionCount === 1 ? "animal" : "animals"} need attention
              </Badge>
            ) : null}
          </>
        ) : null}
      </div>
    </Link>
  );
}
