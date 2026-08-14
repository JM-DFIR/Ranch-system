import { supabase } from "@/lib/supabase";
import { nonNull } from "@/lib/utils";

export interface ReportParams {
  ranchId?: string;
  speciesId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ---------------------------------------------------------------------
// 1. Livestock Inventory
// ---------------------------------------------------------------------
export interface InventoryReportRow {
  ranchName: string;
  speciesName: string | null;
  sex: string;
  statusName: string;
  isActiveStatus: boolean;
  count: number;
}

export async function fetchInventoryReport(params: ReportParams): Promise<InventoryReportRow[]> {
  let query = supabase
    .from("v_inventory_report")
    .select("ranch_name, species_name, sex, status_name, is_active_status, count");
  if (params.ranchId) query = query.eq("ranch_id", params.ranchId);
  if (params.speciesId) query = query.eq("species_id", params.speciesId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ranchName: nonNull(row.ranch_name, "ranch_name"),
    speciesName: row.species_name,
    sex: nonNull(row.sex, "sex"),
    statusName: nonNull(row.status_name, "status_name"),
    isActiveStatus: nonNull(row.is_active_status, "is_active_status"),
    count: nonNull(row.count, "count"),
  }));
}

// ---------------------------------------------------------------------
// 2. Vaccination Compliance
// ---------------------------------------------------------------------
export interface VaccinationComplianceReportRow {
  ranchName: string;
  speciesName: string | null;
  activeCount: number;
  overdueCount: number;
}

export async function fetchVaccinationComplianceReport(params: ReportParams): Promise<VaccinationComplianceReportRow[]> {
  let query = supabase.from("v_vaccination_compliance_report").select("ranch_name, species_name, active_count, overdue_count");
  if (params.ranchId) query = query.eq("ranch_id", params.ranchId);
  if (params.speciesId) query = query.eq("species_id", params.speciesId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ranchName: nonNull(row.ranch_name, "ranch_name"),
    speciesName: row.species_name,
    activeCount: nonNull(row.active_count, "active_count"),
    overdueCount: nonNull(row.overdue_count, "overdue_count"),
  }));
}

// ---------------------------------------------------------------------
// 3. Attention Summary
// ---------------------------------------------------------------------
export interface AttentionSummaryReportRow {
  reason: string;
  severity: string;
  count: number;
}

export async function fetchAttentionSummaryReport(params: ReportParams): Promise<AttentionSummaryReportRow[]> {
  let query = supabase.from("v_attention_summary_report").select("ranch_id, species_id, reason, severity, count");
  if (params.ranchId) query = query.eq("ranch_id", params.ranchId);
  if (params.speciesId) query = query.eq("species_id", params.speciesId);
  const { data, error } = await query;
  if (error) throw error;
  // Reason/severity can repeat across ranches/species once a filter
  // narrows less than everything — collapse client-side over an
  // already-small, already-aggregated result set (never raw rows).
  const totals = new Map<string, AttentionSummaryReportRow>();
  for (const row of data ?? []) {
    const reason = nonNull(row.reason, "reason");
    const severity = nonNull(row.severity, "severity");
    const key = `${reason}:${severity}`;
    const existing = totals.get(key);
    const count = nonNull(row.count, "count");
    totals.set(key, existing ? { ...existing, count: existing.count + count } : { reason, severity, count });
  }
  return [...totals.values()].sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------
// 4. Breeding Performance
// ---------------------------------------------------------------------
export interface BreedingPerformanceReportRow {
  ranchName: string;
  speciesName: string | null;
  servedCount: number;
  confirmedPregnantCount: number;
  notPregnantCount: number;
  deliveredCount: number;
  abortedCount: number;
}

export async function fetchBreedingPerformanceReport(params: ReportParams): Promise<BreedingPerformanceReportRow[]> {
  let query = supabase
    .from("v_breeding_performance_report")
    .select("ranch_name, species_name, served_count, confirmed_pregnant_count, not_pregnant_count, delivered_count, aborted_count");
  if (params.ranchId) query = query.eq("ranch_id", params.ranchId);
  if (params.speciesId) query = query.eq("species_id", params.speciesId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ranchName: nonNull(row.ranch_name, "ranch_name"),
    speciesName: row.species_name,
    servedCount: nonNull(row.served_count, "served_count"),
    confirmedPregnantCount: nonNull(row.confirmed_pregnant_count, "confirmed_pregnant_count"),
    notPregnantCount: nonNull(row.not_pregnant_count, "not_pregnant_count"),
    deliveredCount: nonNull(row.delivered_count, "delivered_count"),
    abortedCount: nonNull(row.aborted_count, "aborted_count"),
  }));
}

// ---------------------------------------------------------------------
// 5. Weight & Growth
// ---------------------------------------------------------------------
export interface WeightGrowthReportRow {
  ranchName: string;
  speciesName: string | null;
  month: string;
  avgAdgKg: number | null;
  readingCount: number;
}

export async function fetchWeightGrowthReport(params: ReportParams): Promise<WeightGrowthReportRow[]> {
  let query = supabase
    .from("v_weight_growth_report")
    .select("ranch_name, species_name, month, avg_adg_kg, reading_count")
    .order("month", { ascending: true });
  if (params.ranchId) query = query.eq("ranch_id", params.ranchId);
  if (params.speciesId) query = query.eq("species_id", params.speciesId);
  if (params.dateFrom) query = query.gte("month", params.dateFrom);
  if (params.dateTo) query = query.lte("month", params.dateTo);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ranchName: nonNull(row.ranch_name, "ranch_name"),
    speciesName: row.species_name,
    month: nonNull(row.month, "month"),
    avgAdgKg: row.avg_adg_kg,
    readingCount: nonNull(row.reading_count, "reading_count"),
  }));
}

// ---------------------------------------------------------------------
// Family C — the seven "monthly count" reports (Treatment History,
// Illness/Morbidity, Movement/Transfer, Mortality, Feeding Consumption,
// Care Activity, Birth/Offspring). Same row shape everywhere
// (month, ranch_name, group_label, count[, quantity]) by design — one
// generic fetcher, one shared rendering component
// (MonthlyCountReport.tsx), even though each is backed by its own
// simple view with its own joins (0029_reports.sql).
// ---------------------------------------------------------------------

export type MonthlyCountViewName =
  | "v_treatment_report"
  | "v_illness_report"
  | "v_movement_report"
  | "v_mortality_report"
  | "v_feeding_report"
  | "v_care_activity_report"
  | "v_birth_report";

export interface MonthlyCountReportRow {
  ranchName: string;
  month: string;
  groupLabel: string;
  count: number;
  quantity: number | null;
}

// Two static select strings, not one built from a runtime ternary —
// Supabase's generated `.select()` overloads parse the select string
// at the type level, and a conditional string collapses to a parse
// error for whichever branch isn't literally written out. Only
// v_feeding_report carries `quantity`; the other six Family C views
// don't have that column at all.
async function fetchMonthlyCountRows(view: MonthlyCountViewName, params: ReportParams) {
  if (view === "v_feeding_report") {
    let query = supabase.from(view).select("ranch_name, month, group_label, count, quantity").order("month", { ascending: true });
    if (params.ranchId) query = query.eq("ranch_id", params.ranchId);
    if (params.dateFrom) query = query.gte("month", params.dateFrom);
    if (params.dateTo) query = query.lte("month", params.dateTo);
    return query;
  }
  let query = supabase.from(view).select("ranch_name, month, group_label, count").order("month", { ascending: true });
  if (params.ranchId) query = query.eq("ranch_id", params.ranchId);
  if (params.dateFrom) query = query.gte("month", params.dateFrom);
  if (params.dateTo) query = query.lte("month", params.dateTo);
  return query;
}

export async function fetchMonthlyCountReport(view: MonthlyCountViewName, params: ReportParams): Promise<MonthlyCountReportRow[]> {
  const { data, error } = await fetchMonthlyCountRows(view, params);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ranchName: nonNull(row.ranch_name, "ranch_name"),
    month: nonNull(row.month, "month"),
    groupLabel: nonNull(row.group_label, "group_label"),
    count: nonNull(row.count, "count"),
    // The two static-select branches in fetchMonthlyCountRows don't
    // unify into a TS-narrowable discriminated union once awaited —
    // this cast is exactly what the `"quantity" in row` check already
    // verified at runtime, not an unchecked assertion.
    quantity: "quantity" in row ? (row as { quantity: number | null }).quantity : null,
  }));
}
