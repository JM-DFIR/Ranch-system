import { useState } from "react";
import { Scale } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/patterns/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWeightSeries } from "@/features/weights/hooks";
import { RecordWeightDrawer } from "@/features/weights/components/RecordWeightDrawer";
import { useAnimalProfile } from "../../hooks";
import { RecordSection } from "../RecordSection";

interface WeightsTabProps {
  animalId: string;
}

export function WeightsTab({ animalId }: WeightsTabProps) {
  const { data: animal } = useAnimalProfile(animalId);
  const { data: series, isLoading } = useWeightSeries(animalId);
  const [recordWeightOpen, setRecordWeightOpen] = useState(false);
  const preselected = animal ? [{ id: animal.id, tagNumber: animal.tagNumber }] : undefined;

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (!series || series.length === 0) {
    return (
      <>
        <EmptyState
          icon={Scale}
          title="No weights recorded yet"
          description="Many ranches never use a scale — a body condition score works just as well. A reading here starts the growth chart."
          action={{ label: "Record weight", onClick: () => setRecordWeightOpen(true) }}
        />
        <RecordWeightDrawer open={recordWeightOpen} onOpenChange={setRecordWeightOpen} preselectedAnimals={preselected} />
      </>
    );
  }

  // "If only BCS exists, chart that on a 1–5 axis instead" — the two
  // never share one axis (kg vs. a 1–5 score), so this is genuinely an
  // either/or chart, not a dual-axis combination.
  const hasWeightReadings = series.some((r) => r.weightKg != null);
  const chartData = series.map((r) => ({
    date: r.weightDate,
    label: formatDate(r.weightDate),
    weightKg: r.weightKg,
    bodyConditionScore: r.bodyConditionScore,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card border border-line bg-card p-4">
        <h2 className="mb-3 text-14 font-medium text-foreground">
          {hasWeightReadings ? "Weight over time" : "Body condition over time"}
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
            <YAxis
              domain={hasWeightReadings ? undefined : [1, 5]}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              label={{ value: hasWeightReadings ? "kg" : "BCS", angle: -90, position: "insideLeft", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}
            />
            <Line
              type="monotone"
              dataKey={hasWeightReadings ? "weightKg" : "bodyConditionScore"}
              stroke="var(--acacia-600)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <RecordSection
        title="Readings"
        recordActionLabel="Record weight"
        onRecordAction={() => setRecordWeightOpen(true)}
        isLoading={false}
        isEmpty={false}
        emptyMessage=""
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>BCS</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>ADG since last</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...series].reverse().map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono tabular-nums">{formatDate(r.weightDate)}</TableCell>
                <TableCell className="font-mono tabular-nums">{r.weightKg != null ? `${r.weightKg} kg` : "—"}</TableCell>
                <TableCell className="font-mono tabular-nums">{r.bodyConditionScore ?? "—"}</TableCell>
                <TableCell className="capitalize">{r.method.replace(/_/g, " ")}</TableCell>
                <TableCell className="font-mono tabular-nums">
                  {r.averageDailyGainKg != null ? `${r.averageDailyGainKg} kg/day` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </RecordSection>

      <RecordWeightDrawer open={recordWeightOpen} onOpenChange={setRecordWeightOpen} preselectedAnimals={preselected} />
    </div>
  );
}
