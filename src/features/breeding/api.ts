import { supabase } from "@/lib/supabase";
import { emptyToUndefined, nonNull } from "@/lib/utils";
import type { BirthFormValues, BreedingEventFormValues, PregnancyCheckFormValues } from "./schema";

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

export interface SireOption {
  id: string;
  tagNumber: string;
}

// A flat, org-wide list of male animals — not species-filtered (unlike
// the vaccine catalogue's species filter), since a sire picker narrowed
// wrong would be worse than an unfiltered list the user can search.
export async function fetchSireOptions(orgId: string): Promise<SireOption[]> {
  const { data, error } = await supabase
    .from("animals")
    .select("id, tag_number")
    .eq("org_id", orgId)
    .eq("sex", "male")
    .is("deleted_at", null)
    .order("tag_number");
  if (error) throw error;
  return (data ?? []).map((a) => ({ id: a.id, tagNumber: a.tag_number }));
}

// Same shape as fetchSireOptions, the female half — Edit Animal's dam
// field is the other caller (breeding events only ever pick a sire for
// an existing dam, so this one didn't exist until Edit needed it).
export async function fetchDamOptions(orgId: string): Promise<SireOption[]> {
  const { data, error } = await supabase
    .from("animals")
    .select("id, tag_number")
    .eq("org_id", orgId)
    .eq("sex", "female")
    .is("deleted_at", null)
    .order("tag_number");
  if (error) throw error;
  return (data ?? []).map((a) => ({ id: a.id, tagNumber: a.tag_number }));
}

// ---------------------------------------------------------------------
// Record Breeding (M4 — session-pack.md Part 5). breeding_events has no
// bulk RPC — one plain multi-row insert, one row per selected dam, each
// checked independently against the has_animal_access(dam_id) RLS
// policy (0014_rls.sql). expected_due_date/window are trigger-computed
// server-side (compute_breeding_due_date, 0009_breeding.sql) — never
// sent from the client.
// ---------------------------------------------------------------------

export interface RecordBreedingEventResult {
  breedingEventIds: string[];
}

export async function recordBreedingEvent(orgId: string, values: BreedingEventFormValues, createdBy: string): Promise<RecordBreedingEventResult> {
  const sireId = values.sire.type === "animal" ? values.sire.id : undefined;
  const externalSireNote = values.sire.type === "external" ? values.sire.note : undefined;
  const serviceDate = values.breedingDate.type === "service" ? values.breedingDate.serviceDate : undefined;
  const joiningStart = values.breedingDate.type === "joining" ? values.breedingDate.joiningStart : undefined;
  const joiningEnd = values.breedingDate.type === "joining" ? emptyToUndefined(values.breedingDate.joiningEnd) : undefined;

  const rows = values.damIds.map((damId) => ({
    org_id: orgId,
    dam_id: damId,
    sire_id: sireId,
    external_sire_note: externalSireNote,
    method: values.method,
    service_date: serviceDate,
    joining_start: joiningStart,
    joining_end: joiningEnd,
    technician: values.technician,
    straw_code: values.strawCode,
    notes: values.notes,
    created_by: createdBy,
  }));

  const { data, error } = await supabase.from("breeding_events").insert(rows).select("id");
  if (error) throw error;
  return { breedingEventIds: (data ?? []).map((r) => r.id) };
}

export async function undoRecordBreedingEvent(result: RecordBreedingEventResult): Promise<boolean> {
  if (result.breedingEventIds.length === 0) return false;
  const { error } = await supabase.from("breeding_events").update({ deleted_at: new Date().toISOString() }).in("id", result.breedingEventIds);
  if (error) throw error;
  return true;
}

// ---------------------------------------------------------------------
// Record Pregnancy Check — tied to one specific breeding_event, so this
// doesn't follow the multi-entry-point record-drawer pattern (there's
// no "free-pick" case: a check only makes sense against an event that
// already exists, reached from that event's own row on the dam's
// profile). Plain insert, pregnancy_checks_insert policy already checks
// has_animal_access(dam_id) via the parent breeding_events row.
// ---------------------------------------------------------------------

export async function recordPregnancyCheck(
  orgId: string,
  breedingEventId: string,
  values: PregnancyCheckFormValues,
  checkedBy: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("pregnancy_checks")
    .insert({
      org_id: orgId,
      breeding_event_id: breedingEventId,
      check_date: values.checkDate,
      method: values.method,
      result: values.result,
      estimated_days: values.estimatedDays ? Number(values.estimatedDays) : undefined,
      checked_by: checkedBy,
      created_by: checkedBy,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

// If the check came back pregnant, this also updates the breeding
// event's own status — a plain field update the animal-linked RLS
// policy already allows (has_animal_access(dam_id)), not a second RPC.
export async function updateBreedingEventStatus(breedingEventId: string, status: string): Promise<void> {
  const { error } = await supabase.from("breeding_events").update({ status }).eq("id", breedingEventId);
  if (error) throw error;
}

// ---------------------------------------------------------------------
// Record Birth — record_birth() (0017_rpc.sql) already exists and
// handles all four tables (births, animals, birth_offspring, the
// breeding_events status flip) in one transaction. This just shapes
// the form values into the RPC's p_offspring jsonb array.
// ---------------------------------------------------------------------

export async function recordBirth(values: BirthFormValues): Promise<string> {
  const offspring = values.offspring.map((o) => ({
    tag_number: emptyToUndefined(o.tagNumber),
    sex: o.sex,
    birth_weight: o.birthWeight ? Number(o.birthWeight) : undefined,
    outcome: o.outcome,
  }));

  const { data, error } = await supabase.rpc("record_birth", {
    p_dam_id: values.damId,
    p_birth_date: values.birthDate,
    p_offspring: offspring,
    p_breeding_event_id: emptyToUndefined(values.breedingEventId),
    p_ease: values.ease,
    p_complications: values.complications,
    p_notes: values.notes,
  });
  if (error) throw error;
  return data.id;
}

export async function undoRecordBirth(birthId: string): Promise<boolean> {
  const { error } = await supabase.from("births").update({ deleted_at: new Date().toISOString() }).eq("id", birthId);
  if (error) throw error;
  return true;
}

// ---------------------------------------------------------------------
// Breeding register (Part 5 — "M4") — org-wide, paginated, same shape
// as the health registers. Ranch comes from the dam's current ranch.
// ---------------------------------------------------------------------

export interface BreedingRegisterParams {
  ranchId?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}

export interface BreedingRegisterRow {
  id: string;
  damId: string;
  damTagNumber: string;
  method: string;
  serviceOrJoiningDate: string | null;
  sireLabel: string | null;
  status: string;
  expectedDueDate: string | null;
}

export interface BreedingRegisterResult {
  rows: BreedingRegisterRow[];
  totalCount: number;
}

// Resolves the ranch filter to a plain list of dam ids rather than an
// embedded-join filter — breeding_events has two FKs to animals
// (dam_id, sire_id), and PostgREST's embedded-column filtering needs
// an unambiguous inner-joined embed to restrict outer rows; two
// disambiguating hints stacked on one embed (`!dam_id!inner`) isn't a
// pattern used anywhere else in this codebase, so this avoids being
// the first place to find out whether it actually works. A ranch's
// animal count is small enough that resolving it first is cheap.
async function resolveRanchDamIds(ranchId: string): Promise<string[]> {
  const { data, error } = await supabase.from("animals").select("id").eq("ranch_id", ranchId).is("deleted_at", null);
  if (error) throw error;
  return (data ?? []).map((a) => a.id);
}

export async function fetchBreedingRegister(params: BreedingRegisterParams): Promise<BreedingRegisterResult> {
  let query = supabase
    .from("breeding_events")
    .select(
      "id, method, service_date, joining_start, status, expected_due_date, expected_due_window_start, external_sire_note, sire:animals!sire_id(tag_number), dam:animals!dam_id(id, tag_number)",
      { count: "exact" },
    )
    .is("deleted_at", null);

  if (params.ranchId) query = query.in("dam_id", await resolveRanchDamIds(params.ranchId));
  if (params.dateFrom) query = query.gte("created_at", params.dateFrom);
  if (params.dateTo) query = query.lte("created_at", params.dateTo);

  query = query
    .order("created_at", { ascending: false })
    .range(params.page * params.pageSize, params.page * params.pageSize + params.pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    rows: (data ?? []).map((row) => ({
      id: nonNull(row.id, "id"),
      damId: row.dam?.id ?? "",
      damTagNumber: row.dam?.tag_number ?? "—",
      method: nonNull(row.method, "method"),
      serviceOrJoiningDate: row.service_date ?? row.joining_start,
      sireLabel: row.sire?.tag_number ?? row.external_sire_note,
      status: nonNull(row.status, "status"),
      expectedDueDate: row.expected_due_date ?? row.expected_due_window_start,
    })),
    totalCount: count ?? 0,
  };
}

// ---------------------------------------------------------------------
// Breeding calendar (Part 5 — "M4") — a date-sorted list of what's
// coming: calving/kidding due within 60 days, and pregnancy checks due
// (served 45+ days with no check yet — same rule
// v_animals_requiring_attention's own pregnancy_check_due reason uses,
// 0016_views.sql, kept in sync deliberately rather than duplicated with
// drift). Not capped like the dashboard's own "Upcoming" — this is the
// dedicated screen for it.
// ---------------------------------------------------------------------

export type BreedingCalendarItem =
  | { kind: "calving_due"; breedingEventId: string; damId: string; damTagNumber: string; dueDate: string }
  | { kind: "pregnancy_check_due"; breedingEventId: string; damId: string; damTagNumber: string; dueDate: string };

export async function fetchBreedingCalendar(ranchId?: string): Promise<BreedingCalendarItem[]> {
  const damIds = ranchId ? await resolveRanchDamIds(ranchId) : undefined;

  let dueQuery = supabase
    .from("breeding_events")
    .select("id, expected_due_date, expected_due_window_start, dam:animals!dam_id(id, tag_number)")
    .is("deleted_at", null)
    .in("status", ["served", "confirmed_pregnant"])
    .not("expected_due_date", "is", null)
    .lte("expected_due_date", new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10));
  if (damIds) dueQuery = dueQuery.in("dam_id", damIds);

  let checkQuery = supabase
    .from("breeding_events")
    .select("id, service_date, joining_start, dam:animals!dam_id(id, tag_number), pregnancy_checks(id)")
    .is("deleted_at", null)
    .eq("status", "served");
  if (damIds) checkQuery = checkQuery.in("dam_id", damIds);

  const [dueRes, checkRes] = await Promise.all([dueQuery, checkQuery]);
  if (dueRes.error) throw dueRes.error;
  if (checkRes.error) throw checkRes.error;

  const calvingItems: BreedingCalendarItem[] = (dueRes.data ?? [])
    .filter((row) => !!row.dam)
    .map((row) => ({
      kind: "calving_due",
      breedingEventId: nonNull(row.id, "id"),
      damId: nonNull(row.dam, "dam").id,
      damTagNumber: nonNull(row.dam, "dam").tag_number,
      dueDate: nonNull(row.expected_due_date, "expected_due_date"),
    }));

  const fortyFiveDaysAgo = new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10);
  const checkItems: BreedingCalendarItem[] = (checkRes.data ?? [])
    .filter((row) => !!row.dam && (row.pregnancy_checks ?? []).length === 0)
    .map((row) => ({ row, servedDate: row.service_date ?? row.joining_start }))
    .filter((x): x is { row: (typeof checkRes.data)[number]; servedDate: string } => !!x.servedDate && x.servedDate <= fortyFiveDaysAgo)
    .map(({ row, servedDate }) => ({
      kind: "pregnancy_check_due" as const,
      breedingEventId: nonNull(row.id, "id"),
      damId: nonNull(row.dam, "dam").id,
      damTagNumber: nonNull(row.dam, "dam").tag_number,
      dueDate: new Date(new Date(servedDate).getTime() + 45 * 86400000).toISOString().slice(0, 10),
    }));

  return [...calvingItems, ...checkItems].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
