import { PawPrint } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { EmptyState } from "@/components/patterns/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

interface SpeciesBarProps {
  speciesBreakdown: Record<string, number> | undefined;
  isLoading: boolean;
}

// "Livestock by species — compact horizontal bar" (session-pack.md,
// Session 7). Reads speciesBreakdown straight off get_dashboard_stats'
// jsonb (0027_dashboard_trend.sql) — no client-side aggregation.
export function SpeciesBar({ speciesBreakdown, isLoading }: SpeciesBarProps) {
  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const data = Object.entries(speciesBreakdown ?? {})
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  if (data.length === 0) {
    return (
      <EmptyState
        icon={PawPrint}
        title="No animals recorded yet"
        description="Enrol animals with a species set and the breakdown appears here."
      />
    );
  }

  return (
    <div className="rounded-card border border-line bg-card p-4">
      <h2 className="mb-3 text-14 font-medium text-foreground">Livestock by species</h2>
      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 32)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            tick={{ fontSize: 12, fill: "var(--foreground)" }}
          />
          <Bar dataKey="count" fill="var(--acacia-600)" radius={[0, 4, 4, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
