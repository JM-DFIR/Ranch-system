import { supabase } from "@/lib/supabase";
import { nonNull } from "@/lib/utils";
import { cancelQueuedEntry, enqueueCreateWeight } from "@/lib/offline/queue";
import type { WeightFormValues } from "./schema";

export interface WeightReading {
  id: string;
  weightDate: string;
  weightKg: number | null;
  method: string;
  bodyConditionScore: number | null;
  averageDailyGainKg: number | null;
}

// v_animal_weight_series (0016_views.sql) already computes ADG via a
// window function — never stored, so a back-dated record can't leave a
// stale figure behind. Ascending order here (chart + table both read
// chronologically); the register/overview want descending, which is
// their own concern, not this one.
export async function fetchWeightSeries(animalId: string): Promise<WeightReading[]> {
  const { data, error } = await supabase
    .from("v_animal_weight_series")
    .select("id, weight_date, weight_kg, method, body_condition_score, average_daily_gain_kg")
    .eq("animal_id", animalId)
    .order("weight_date", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: nonNull(row.id, "id"),
    weightDate: nonNull(row.weight_date, "weight_date"),
    weightKg: row.weight_kg,
    method: nonNull(row.method, "method"),
    bodyConditionScore: row.body_condition_score,
    averageDailyGainKg: row.average_daily_gain_kg,
  }));
}

// ---------------------------------------------------------------------
// Record Weight (Session 8 — the "Bulk Weigh Day" quick-action per
// blueprint.md §2.3). One of the five offline-queued operations, so
// this mirrors recordVaccination's dual online/offline shape exactly —
// bulk_weight_event online (0017_rpc.sql), create_weight queued offline
// (already wired in lib/offline/{queue,sync}.ts since Session 5b).
// ---------------------------------------------------------------------
export type RecordWeightResult = { mode: "online"; weightIds: string[] } | { mode: "offline"; queueEntryId: string };

export async function recordWeight(values: WeightFormValues, createdBy: string): Promise<RecordWeightResult> {
  const weightKg = values.weightKg ? Number(values.weightKg) : undefined;
  const bodyConditionScore = values.bodyConditionScore ? Number(values.bodyConditionScore) : undefined;

  if (!navigator.onLine) {
    const queueEntryId = await enqueueCreateWeight({
      animalIds: values.animalIds,
      weightDate: values.weightDate,
      method: values.method,
      weightKg,
      bodyConditionScore,
      notes: values.notes,
      createdBy,
    });
    return { mode: "offline", queueEntryId };
  }

  const { data, error } = await supabase.rpc("bulk_weight_event", {
    p_animal_ids: values.animalIds,
    p_weight_date: values.weightDate,
    p_method: values.method,
    p_weight_kg: weightKg,
    p_body_condition_score: bodyConditionScore,
    p_notes: values.notes,
  });
  if (error) throw error;
  return { mode: "online", weightIds: (data ?? []).map((w) => w.id) };
}

export async function undoRecordWeight(result: RecordWeightResult): Promise<boolean> {
  if (result.mode === "offline") {
    return cancelQueuedEntry(result.queueEntryId);
  }
  if (result.weightIds.length === 0) return false;
  const { error } = await supabase.from("weight_records").update({ deleted_at: new Date().toISOString() }).in("id", result.weightIds);
  if (error) throw error;
  return true;
}
