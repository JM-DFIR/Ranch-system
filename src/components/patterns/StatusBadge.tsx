import { Badge } from "@/components/ui/badge";

// Matches animal_statuses.color_token exactly (supabase/migrations/0005_reference.sql) —
// the seed data writes these five values, and the owner-editable status
// catalogue is expected to pick from this same set when adding a status.
type StatusColorToken =
  | "status-ok"
  | "status-warn"
  | "status-critical"
  | "status-info"
  | "status-neutral";

const TOKEN_TO_VARIANT: Record<StatusColorToken, "ok" | "warn" | "critical" | "info" | "neutral"> = {
  "status-ok": "ok",
  "status-warn": "warn",
  "status-critical": "critical",
  "status-info": "info",
  "status-neutral": "neutral",
};

interface StatusBadgeProps {
  name: string;
  colorToken: string;
}

export function StatusBadge({ name, colorToken }: StatusBadgeProps) {
  const variant = TOKEN_TO_VARIANT[colorToken as StatusColorToken] ?? "neutral";
  return <Badge variant={variant}>{name}</Badge>;
}
