import { Download, Wallet, type LucideIcon } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { formatMonthHeading } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { useFeatureFlags } from "@/components/patterns/FeatureGate";
import { EmptyState } from "@/components/patterns/EmptyState";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { ReportConfig } from "../registry";
import type { ReportParams } from "../api";
import {
  useAttentionSummaryReport,
  useBreedingPerformanceReport,
  useInventoryReport,
  useMonthlyCountReport,
  useVaccinationComplianceReport,
  useWeightGrowthReport,
} from "../hooks";
import { MonthlyCountReport } from "./MonthlyCountReport";

interface ReportViewerProps {
  config: ReportConfig;
  params: ReportParams;
}

export function ReportViewer({ config, params }: ReportViewerProps) {
  switch (config.kind) {
    case "inventory":
      return <InventoryReport params={params} icon={config.icon} />;
    case "vaccination-compliance":
      return <VaccinationComplianceReport params={params} icon={config.icon} />;
    case "attention-summary":
      return <AttentionSummaryReport params={params} icon={config.icon} />;
    case "breeding-performance":
      return <BreedingPerformanceReport params={params} icon={config.icon} />;
    case "weight-growth":
      return <WeightGrowthReport params={params} icon={config.icon} />;
    case "monthly-count":
      return <MonthlyCountReportContent config={config} params={params} />;
    case "financial":
      return <FinancialReport />;
  }
}

function MonthlyCountReportContent({ config, params }: { config: ReportConfig; params: ReportParams }) {
  const { profile } = useAuth();
  const view = config.monthlyCount?.view;
  const { data, isLoading } = useMonthlyCountReport(profile?.orgId, view ?? "v_treatment_report", params);
  if (!view || !config.monthlyCount) return null;
  return (
    <MonthlyCountReport
      title={config.label}
      icon={config.icon}
      rows={data}
      isLoading={isLoading}
      groupColumnLabel={config.monthlyCount.groupColumnLabel}
      quantityUnit={config.monthlyCount.quantityUnit}
      emptyDescription={`${config.label} shows up here once ${config.description.charAt(0).toLowerCase()}${config.description.slice(1, -1)} has been recorded.`}
    />
  );
}

function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <Button size="sm" variant="outline" className="gap-1.5" onClick={onClick}>
      <Download className="size-3.5" aria-hidden />
      Export
    </Button>
  );
}

function InventoryReport({ params, icon }: { params: ReportParams; icon: LucideIcon }) {
  const { profile } = useAuth();
  const { data, isLoading } = useInventoryReport(profile?.orgId, params);

  if (!isLoading && (!data || data.length === 0)) {
    return <EmptyState icon={icon} title="No animals yet" description="The inventory report fills in once animals are enrolled." />;
  }

  const total = (data ?? []).reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="overflow-hidden rounded-card border border-line">
      <div className="flex items-center justify-between border-b border-line bg-card px-4 py-2.5">
        <p className="text-13 font-medium text-foreground">{total.toLocaleString()} animals total</p>
        <ExportButton
          onClick={() =>
            downloadCsv(
              `livestock-inventory-${new Date().toISOString().slice(0, 10)}.csv`,
              ["Ranch", "Species", "Sex", "Status", "Active", "Count"],
              (data ?? []).map((r) => [r.ranchName, r.speciesName ?? "—", r.sex, r.statusName, r.isActiveStatus ? "Yes" : "No", r.count]),
            )
          }
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ranch</TableHead>
            <TableHead>Species</TableHead>
            <TableHead>Sex</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data ?? []).map((r, i) => (
            <TableRow key={i}>
              <TableCell>{r.ranchName}</TableCell>
              <TableCell>{r.speciesName ?? "—"}</TableCell>
              <TableCell className="capitalize">{r.sex}</TableCell>
              <TableCell>{r.statusName}</TableCell>
              <TableCell className="font-mono tabular-nums">{r.count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function VaccinationComplianceReport({ params, icon }: { params: ReportParams; icon: LucideIcon }) {
  const { profile } = useAuth();
  const { data, isLoading } = useVaccinationComplianceReport(profile?.orgId, params);

  if (!isLoading && (!data || data.length === 0)) {
    return <EmptyState icon={icon} title="No active animals yet" description="Compliance fills in once animals are enrolled and vaccinated." />;
  }

  return (
    <div className="overflow-hidden rounded-card border border-line">
      <div className="flex items-center justify-end border-b border-line bg-card px-4 py-2.5">
        <ExportButton
          onClick={() =>
            downloadCsv(
              `vaccination-compliance-${new Date().toISOString().slice(0, 10)}.csv`,
              ["Ranch", "Species", "Active animals", "Overdue", "Compliance"],
              (data ?? []).map((r) => [
                r.ranchName,
                r.speciesName ?? "—",
                r.activeCount,
                r.overdueCount,
                r.activeCount > 0 ? `${Math.round(((r.activeCount - r.overdueCount) / r.activeCount) * 100)}%` : "—",
              ]),
            )
          }
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ranch</TableHead>
            <TableHead>Species</TableHead>
            <TableHead>Active animals</TableHead>
            <TableHead>Overdue</TableHead>
            <TableHead>Compliance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data ?? []).map((r, i) => (
            <TableRow key={i}>
              <TableCell>{r.ranchName}</TableCell>
              <TableCell>{r.speciesName ?? "—"}</TableCell>
              <TableCell className="font-mono tabular-nums">{r.activeCount}</TableCell>
              <TableCell className="font-mono tabular-nums">
                {r.overdueCount > 0 ? <span className="text-status-critical">{r.overdueCount}</span> : r.overdueCount}
              </TableCell>
              <TableCell className="font-mono tabular-nums">
                {r.activeCount > 0 ? `${Math.round(((r.activeCount - r.overdueCount) / r.activeCount) * 100)}%` : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AttentionSummaryReport({ params, icon }: { params: ReportParams; icon: LucideIcon }) {
  const { profile } = useAuth();
  const { data, isLoading } = useAttentionSummaryReport(profile?.orgId, params);

  if (!isLoading && (!data || data.length === 0)) {
    return <EmptyState icon={icon} title="Nothing needs attention" description="This report fills in as attention reasons open up." />;
  }

  return (
    <div className="overflow-hidden rounded-card border border-line">
      <div className="flex items-center justify-end border-b border-line bg-card px-4 py-2.5">
        <ExportButton
          onClick={() =>
            downloadCsv(
              `attention-summary-${new Date().toISOString().slice(0, 10)}.csv`,
              ["Reason", "Severity", "Count"],
              (data ?? []).map((r) => [r.reason.replace(/_/g, " "), r.severity, r.count]),
            )
          }
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reason</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data ?? []).map((r, i) => (
            <TableRow key={i}>
              <TableCell className="capitalize">{r.reason.replace(/_/g, " ")}</TableCell>
              <TableCell className="capitalize">{r.severity}</TableCell>
              <TableCell className="font-mono tabular-nums">{r.count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function BreedingPerformanceReport({ params, icon }: { params: ReportParams; icon: LucideIcon }) {
  const { profile } = useAuth();
  const { data, isLoading } = useBreedingPerformanceReport(profile?.orgId, params);

  if (!isLoading && (!data || data.length === 0)) {
    return <EmptyState icon={icon} title="No breeding events yet" description="This report fills in once breeding events are recorded." />;
  }

  return (
    <div className="overflow-hidden rounded-card border border-line">
      <div className="flex items-center justify-end border-b border-line bg-card px-4 py-2.5">
        <ExportButton
          onClick={() =>
            downloadCsv(
              `breeding-performance-${new Date().toISOString().slice(0, 10)}.csv`,
              ["Ranch", "Species", "Served", "Confirmed pregnant", "Not pregnant", "Delivered", "Aborted", "Conception rate"],
              (data ?? []).map((r) => [
                r.ranchName,
                r.speciesName ?? "—",
                r.servedCount,
                r.confirmedPregnantCount,
                r.notPregnantCount,
                r.deliveredCount,
                r.abortedCount,
                r.servedCount > 0 ? `${Math.round((r.confirmedPregnantCount / r.servedCount) * 100)}%` : "—",
              ]),
            )
          }
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ranch</TableHead>
            <TableHead>Species</TableHead>
            <TableHead>Served</TableHead>
            <TableHead>Confirmed pregnant</TableHead>
            <TableHead>Delivered</TableHead>
            <TableHead>Conception rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data ?? []).map((r, i) => (
            <TableRow key={i}>
              <TableCell>{r.ranchName}</TableCell>
              <TableCell>{r.speciesName ?? "—"}</TableCell>
              <TableCell className="font-mono tabular-nums">{r.servedCount}</TableCell>
              <TableCell className="font-mono tabular-nums">{r.confirmedPregnantCount}</TableCell>
              <TableCell className="font-mono tabular-nums">{r.deliveredCount}</TableCell>
              <TableCell className="font-mono tabular-nums">
                {r.servedCount > 0 ? `${Math.round((r.confirmedPregnantCount / r.servedCount) * 100)}%` : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function WeightGrowthReport({ params, icon }: { params: ReportParams; icon: LucideIcon }) {
  const { profile } = useAuth();
  const { data, isLoading } = useWeightGrowthReport(profile?.orgId, params);

  if (!isLoading && (!data || data.length === 0)) {
    return (
      <EmptyState
        icon={icon}
        title="No weight readings yet"
        description="Average daily gain fills in once weight readings exist across at least two dates per animal."
      />
    );
  }

  const chartData = (data ?? []).map((r) => ({ label: formatMonthHeading(r.month), adg: r.avgAdgKg }));

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card border border-line bg-card p-4">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
            <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} label={{ value: "kg/day", angle: -90, position: "insideLeft", fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
            <Line type="monotone" dataKey="adg" stroke="var(--acacia-600)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-hidden rounded-card border border-line">
        <div className="flex items-center justify-end border-b border-line bg-card px-4 py-2.5">
          <ExportButton
            onClick={() =>
              downloadCsv(
                `weight-growth-${new Date().toISOString().slice(0, 10)}.csv`,
                ["Month", "Ranch", "Species", "Avg ADG (kg/day)", "Readings"],
                (data ?? []).map((r) => [formatMonthHeading(r.month), r.ranchName, r.speciesName ?? "—", r.avgAdgKg?.toFixed(3) ?? "—", r.readingCount]),
              )
            }
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Ranch</TableHead>
              <TableHead>Species</TableHead>
              <TableHead>Avg ADG (kg/day)</TableHead>
              <TableHead>Readings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data ?? []).map((r, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono tabular-nums">{formatMonthHeading(r.month)}</TableCell>
                <TableCell>{r.ranchName}</TableCell>
                <TableCell>{r.speciesName ?? "—"}</TableCell>
                <TableCell className="font-mono tabular-nums">{r.avgAdgKg?.toFixed(3) ?? "—"}</TableCell>
                <TableCell className="font-mono tabular-nums">{r.readingCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Nullable columns exist (treatments/vet_visits/feeding_records/
// care_activities.cost) but nothing writes or reads them in v1
// (CLAUDE.md §9) — this report renders the same "off" state
// FeatureGate would, since the flag is never on yet.
function FinancialReport() {
  const flags = useFeatureFlags();
  if (flags.finance) return null; // real content would render here once the flag exists
  return (
    <EmptyState
      icon={Wallet}
      title="Finance is off for this organisation"
      description="Cost fields exist in the schema but stay hidden until the finance feature is switched on — nothing writes them yet."
    />
  );
}
