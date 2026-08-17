import { supabase } from "@/lib/supabase";
import { nonNull } from "@/lib/utils";
import { fetchAnimalSummaries } from "@/features/animals/api";

// The twelve reasons from v_animals_requiring_attention
// (supabase/migrations/0016_views.sql) — severity is fixed per reason
// in that view's own definition, not a separate axis this type needs
// to carry independently.
export type AttentionReason =
  | "overdue_vaccination"
  | "vaccination_due_soon"
  | "unresolved_illness"
  | "vet_followup_due"
  | "treatment_followup_due"
  | "care_activity_overdue"
  | "pregnancy_check_due"
  | "calving_imminent"
  | "inside_withdrawal_period"
  | "losing_condition"
  | "incomplete_enrolment"
  | "no_recent_health_record";

export interface AttentionQueueItem {
  animalId: string;
  ranchId: string;
  reason: AttentionReason;
  severity: "high" | "medium" | "info";
  dueDate: string | null;
  tagNumber: string;
  animalName: string | null;
  speciesName: string | null;
  photoPath: string | null;
}

export interface AnimalAttentionReason {
  reason: AttentionReason;
  severity: "high" | "medium" | "info";
  dueDate: string | null;
}

// The animal profile's own view into v_animals_requiring_attention —
// AttentionBadge (register, profile header) only ever shows a count
// from the separate, pre-aggregated summary view (blueprint.md §0.5
// #5), so a badge reading "1 issue" has never actually said what the
// issue is anywhere in the app except the standalone Attention Queue.
// This is the same per-reason view, filtered to one animal, so the
// profile itself can finally answer that.
export async function fetchAnimalAttentionReasons(animalId: string): Promise<AnimalAttentionReason[]> {
  const { data, error } = await supabase
    .from("v_animals_requiring_attention")
    .select("reason, severity, due_date")
    .eq("animal_id", animalId);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    reason: nonNull(row.reason, "reason") as AttentionReason,
    severity: nonNull(row.severity, "severity") as AnimalAttentionReason["severity"],
    dueDate: row.due_date,
  }));
}

const SEVERITY_RANK: Record<string, number> = { high: 3, medium: 2, info: 1 };

// The Attention Queue's detail screen (session-pack.md, Session 8 — "M3
// remainder... attention queue built against v_animals_requiring_attention,
// the per-reason view"). One row per (animal, reason) — several rows
// per animal are expected and meaningful here, unlike the register's
// badge column or the dashboard's counterpoint, which both read the
// summary view instead (blueprint.md §0.5 #5). Animal identity
// (tag/name/species/photo) isn't on the attention view itself, so this
// composes two queries the same way fetchAnimalLineage already does —
// reasonable at this scale (the queue is bounded by genuine problems,
// not herd size), not the "fetch a whole table" case CLAUDE.md warns
// against.
export async function fetchAttentionQueue(ranchId?: string): Promise<AttentionQueueItem[]> {
  let query = supabase
    .from("v_animals_requiring_attention")
    .select("animal_id, ranch_id, reason, severity, due_date");
  if (ranchId) query = query.eq("ranch_id", ranchId);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const animalIds = [...new Set(rows.map((r) => nonNull(r.animal_id, "animal_id")))];
  const summaries = await fetchAnimalSummaries(animalIds);
  const summaryById = new Map(summaries.map((s) => [s.id, s]));

  return rows
    .map((row): AttentionQueueItem | null => {
      const animalId = nonNull(row.animal_id, "animal_id");
      const summary = summaryById.get(animalId);
      if (!summary) return null;
      return {
        animalId,
        ranchId: nonNull(row.ranch_id, "ranch_id"),
        reason: nonNull(row.reason, "reason") as AttentionReason,
        severity: nonNull(row.severity, "severity") as AttentionQueueItem["severity"],
        dueDate: row.due_date,
        tagNumber: summary.tagNumber,
        animalName: summary.name,
        speciesName: summary.speciesName,
        photoPath: summary.photoPath,
      };
    })
    .filter((item): item is AttentionQueueItem => item !== null)
    .sort((a, b) => {
      const bySeverity = (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0);
      if (bySeverity !== 0) return bySeverity;
      return (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
    });
}
