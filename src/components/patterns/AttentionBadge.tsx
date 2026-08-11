import { TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";

// The three severities the attention rule engine emits
// (supabase/migrations/0016_views.sql, v_animal_attention_summary) —
// not the same vocabulary as the badge colour variants, hence the map.
export type AttentionSeverity = "high" | "medium" | "info";

const SEVERITY_TO_VARIANT: Record<AttentionSeverity, "critical" | "warn" | "info"> = {
  high: "critical",
  medium: "warn",
  info: "info",
};

interface AttentionBadgeProps {
  severity: AttentionSeverity;
  reasonCount: number;
}

// Reads from v_animal_attention_summary (worst_severity, reason_count),
// never v_animals_requiring_attention directly — that view returns one
// row per reason and would need its own aggregation first. See
// blueprint.md §0.5 #5.
export function AttentionBadge({ severity, reasonCount }: AttentionBadgeProps) {
  if (reasonCount <= 0) return null;
  return (
    <Badge variant={SEVERITY_TO_VARIANT[severity]} className="gap-1">
      <TriangleAlert aria-hidden />
      {reasonCount} {reasonCount === 1 ? "issue" : "issues"}
    </Badge>
  );
}
