import { supabase } from "@/lib/supabase";
import { nonNull } from "@/lib/utils";

// Mortality register (M4 — session-pack.md Part 5). record_death()
// (0017_rpc.sql) is the only write path — no create/undo here, this is
// a read-only audit view, same as fetchMovements before Transfer added
// a write side to that feature.
export interface MortalityRegisterParams {
  ranchId?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}

export interface MortalityRegisterRow {
  id: string;
  dateOfDeath: string;
  animalId: string;
  tagNumber: string;
  animalName: string | null;
  ranchName: string;
  causeCategory: string;
  causeDetails: string | null;
  postmortemDone: boolean;
}

export interface MortalityRegisterResult {
  rows: MortalityRegisterRow[];
  totalCount: number;
}

export async function fetchMortalityRegister(params: MortalityRegisterParams): Promise<MortalityRegisterResult> {
  let query = supabase
    .from("mortalities")
    .select(
      "id, date_of_death, cause_category, cause_details, postmortem_done, animal:animals(id, tag_number, name), ranch:ranches(name)",
      { count: "exact" },
    )
    .is("deleted_at", null);

  if (params.ranchId) query = query.eq("ranch_id", params.ranchId);
  if (params.dateFrom) query = query.gte("date_of_death", params.dateFrom);
  if (params.dateTo) query = query.lte("date_of_death", params.dateTo);

  query = query
    .order("date_of_death", { ascending: false })
    .range(params.page * params.pageSize, params.page * params.pageSize + params.pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    rows: (data ?? []).map((row) => ({
      id: nonNull(row.id, "id"),
      dateOfDeath: nonNull(row.date_of_death, "date_of_death"),
      animalId: row.animal?.id ?? "",
      tagNumber: row.animal?.tag_number ?? "—",
      animalName: row.animal?.name ?? null,
      ranchName: row.ranch?.name ?? "—",
      causeCategory: nonNull(row.cause_category, "cause_category"),
      causeDetails: row.cause_details,
      postmortemDone: nonNull(row.postmortem_done, "postmortem_done"),
    })),
    totalCount: count ?? 0,
  };
}
