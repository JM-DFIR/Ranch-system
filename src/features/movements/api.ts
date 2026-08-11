import { supabase } from "@/lib/supabase";
import { nonNull } from "@/lib/utils";

export interface Movement {
  id: string;
  movementDate: string;
  fromRanchName: string | null;
  fromSectionName: string | null;
  toRanchName: string | null;
  toSectionName: string | null;
  reason: string | null;
  permitNumber: string | null;
}

// movements is written only through record_movement() (0017_rpc.sql) —
// this is a read-only history, there's no matching insert path here.
export async function fetchMovements(animalId: string): Promise<Movement[]> {
  const { data, error } = await supabase
    .from("movements")
    .select(
      "id, movement_date, reason, permit_number, from_ranch:ranches!from_ranch_id(name), from_section:ranch_sections!from_section_id(name), to_ranch:ranches!to_ranch_id(name), to_section:ranch_sections!to_section_id(name)",
    )
    .eq("animal_id", animalId)
    .is("deleted_at", null)
    .order("movement_date", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: nonNull(row.id, "id"),
    movementDate: nonNull(row.movement_date, "movement_date"),
    fromRanchName: row.from_ranch?.name ?? null,
    fromSectionName: row.from_section?.name ?? null,
    toRanchName: row.to_ranch?.name ?? null,
    toSectionName: row.to_section?.name ?? null,
    reason: row.reason,
    permitNumber: row.permit_number,
  }));
}
