import { supabase } from "@/lib/supabase";
import { nonNull } from "@/lib/utils";

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
