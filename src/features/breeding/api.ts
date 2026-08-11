import { supabase } from "@/lib/supabase";
import { nonNull } from "@/lib/utils";

export interface PregnancyCheck {
  id: string;
  checkDate: string;
  result: string;
  estimatedDays: number | null;
}

export interface BreedingEvent {
  id: string;
  method: string;
  serviceDate: string | null;
  joiningStart: string | null;
  joiningEnd: string | null;
  sireTagNumber: string | null;
  externalSireNote: string | null;
  status: string;
  expectedDueDate: string | null;
  expectedDueWindowStart: string | null;
  expectedDueWindowEnd: string | null;
  pregnancyChecks: PregnancyCheck[];
}

// A dam's own breeding history — sire embedded via animals!sire_id
// (nullable: an unrecorded/external sire falls back to
// external_sire_note), pregnancy_checks embedded as the reverse
// one-to-many relationship rather than a second round trip.
export async function fetchBreedingEvents(damId: string): Promise<BreedingEvent[]> {
  const { data, error } = await supabase
    .from("breeding_events")
    .select(
      "id, method, service_date, joining_start, joining_end, external_sire_note, status, expected_due_date, expected_due_window_start, expected_due_window_end, sire:animals!sire_id(tag_number), pregnancy_checks(id, check_date, result, estimated_days)",
    )
    .eq("dam_id", damId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: nonNull(row.id, "id"),
    method: nonNull(row.method, "method"),
    serviceDate: row.service_date,
    joiningStart: row.joining_start,
    joiningEnd: row.joining_end,
    sireTagNumber: row.sire?.tag_number ?? null,
    externalSireNote: row.external_sire_note,
    status: nonNull(row.status, "status"),
    expectedDueDate: row.expected_due_date,
    expectedDueWindowStart: row.expected_due_window_start,
    expectedDueWindowEnd: row.expected_due_window_end,
    pregnancyChecks: (row.pregnancy_checks ?? [])
      .filter((c) => !!c)
      .map((c) => ({
        id: nonNull(c.id, "id"),
        checkDate: nonNull(c.check_date, "check_date"),
        result: nonNull(c.result, "result"),
        estimatedDays: c.estimated_days,
      })),
  }));
}

export interface BirthOffspring {
  id: string;
  tagNumber: string | null;
  sex: string;
  birthWeight: number | null;
  outcome: string;
}

export interface Birth {
  id: string;
  birthDate: string;
  litterSize: number;
  ease: string;
  complications: string | null;
  offspring: BirthOffspring[];
}

export async function fetchBirths(damId: string): Promise<Birth[]> {
  const { data, error } = await supabase
    .from("births")
    .select(
      "id, birth_date, litter_size, ease, complications, birth_offspring(id, sex, birth_weight, outcome, animal:animals(tag_number))",
    )
    .eq("dam_id", damId)
    .is("deleted_at", null)
    .order("birth_date", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: nonNull(row.id, "id"),
    birthDate: nonNull(row.birth_date, "birth_date"),
    litterSize: nonNull(row.litter_size, "litter_size"),
    ease: nonNull(row.ease, "ease"),
    complications: row.complications,
    offspring: (row.birth_offspring ?? [])
      .filter((o) => !!o)
      .map((o) => ({
        id: nonNull(o.id, "id"),
        tagNumber: o.animal?.tag_number ?? null,
        sex: nonNull(o.sex, "sex"),
        birthWeight: o.birth_weight,
        outcome: nonNull(o.outcome, "outcome"),
      })),
  }));
}
