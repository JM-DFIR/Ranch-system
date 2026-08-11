import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  trendLabel?: string;
  /** "dominant" is 3x the surrounding scale — reserve for the single
   * metric a dashboard is built around (blueprint.md §5, Part 4.2). */
  emphasis?: "default" | "dominant";
  tone?: "default" | "warn" | "critical";
  className?: string;
}

export function StatCard({
  label,
  value,
  trendLabel,
  emphasis = "default",
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <div className={cn("rounded-card border border-line bg-card p-4", className)}>
      <p className="text-13 text-muted-foreground">{label}</p>
      <p
        className={cn(
          "tabular font-display font-semibold",
          emphasis === "dominant" ? "text-34" : "text-26",
          tone === "warn" && "text-status-warn",
          tone === "critical" && "text-status-critical",
          tone === "default" && "text-foreground",
        )}
      >
        {value}
      </p>
      {trendLabel ? <p className="text-12 text-muted-foreground">{trendLabel}</p> : null}
    </div>
  );
}
