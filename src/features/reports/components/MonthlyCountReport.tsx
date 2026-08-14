import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatMonthHeading } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { EmptyState } from "@/components/patterns/EmptyState";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MonthlyCountReportRow } from "../api";

interface MonthlyCountReportProps {
  title: string;
  icon: LucideIcon;
  rows: MonthlyCountReportRow[] | undefined;
  isLoading: boolean;
  groupColumnLabel: string;
  quantityUnit?: string;
  emptyDescription: string;
}

// Shared by the seven "monthly count" reports (Treatment History,
// Illness/Morbidity, Movement/Transfer, Mortality, Feeding Consumption,
// Care Activity, Birth/Offspring — features/reports/api.ts's Family C).
// One count-per-month bar chart (summed across group labels, so it
// stays a single readable series rather than an N-colour stack) plus a
// full ranch/group breakdown table underneath.
export function MonthlyCountReport({ title, icon: Icon, rows, isLoading, groupColumnLabel, quantityUnit, emptyDescription }: MonthlyCountReportProps) {
  if (isLoading) return null;
  if (!rows || rows.length === 0) {
    return <EmptyState icon={Icon} title={`No ${title.toLowerCase()} data yet`} description={emptyDescription} />;
  }

  const byMonth = new Map<string, number>();
  for (const row of rows) {
    byMonth.set(row.month, (byMonth.get(row.month) ?? 0) + row.count);
  }
  const chartData = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, label: formatMonthHeading(month), count }));

  const handleExport = () => {
    const headers = ["Month", "Ranch", groupColumnLabel, "Count", ...(quantityUnit ? [`Quantity (${quantityUnit})`] : [])];
    const lines = rows.map((r) => [formatMonthHeading(r.month), r.ranchName, r.groupLabel, r.count, ...(quantityUnit ? [r.quantity ?? ""] : [])]);
    downloadCsv(`${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`, headers, lines);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card border border-line bg-card p-4">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
            <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
            <Bar dataKey="count" fill="var(--acacia-600)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-hidden rounded-card border border-line">
        <div className="flex items-center justify-between border-b border-line bg-card px-4 py-2.5">
          <p className="text-13 font-medium text-foreground">Breakdown</p>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExport}>
            <Download className="size-3.5" aria-hidden />
            Export
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Ranch</TableHead>
              <TableHead>{groupColumnLabel}</TableHead>
              <TableHead>Count</TableHead>
              {quantityUnit ? <TableHead>Quantity ({quantityUnit})</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={`${r.month}-${r.ranchName}-${r.groupLabel}-${i}`}>
                <TableCell className="font-mono tabular-nums">{formatMonthHeading(r.month)}</TableCell>
                <TableCell>{r.ranchName}</TableCell>
                <TableCell>{r.groupLabel}</TableCell>
                <TableCell className="font-mono tabular-nums">{r.count}</TableCell>
                {quantityUnit ? <TableCell className="font-mono tabular-nums">{r.quantity ?? "—"}</TableCell> : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
