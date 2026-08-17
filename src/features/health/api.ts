import { supabase } from "@/lib/supabase";
import { emptyToUndefined, nonNull } from "@/lib/utils";
import { cancelQueuedEntry, enqueueCreateHealthEvent } from "@/lib/offline/queue";
import type { IllnessFormValues, TreatmentFormValues, VaccinationFormValues, VetVisitFormValues } from "./schema";

export interface Vaccination {
  id: string;
  dateAdministered: string;
  vaccineName: string;
  dose: string | null;
  batchNumber: string | null;
  route: string | null;
  administeredByName: string | null;
  veterinarianName: string | null;
  nextDueDate: string | null;
  notes: string | null;
}

export async function fetchVaccinations(animalId: string): Promise<Vaccination[]> {
  const { data, error } = await supabase
    .from("vaccinations")
    .select(
      "id, date_administered, dose, batch_number, route, next_due_date, notes, vaccine:vaccines(name), administered_by:profiles!administered_by_profile(full_name), veterinarian:veterinarians(name)",
    )
    .eq("animal_id", animalId)
    .is("deleted_at", null)
    .order("date_administered", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: nonNull(row.id, "id"),
    dateAdministered: nonNull(row.date_administered, "date_administered"),
    vaccineName: row.vaccine?.name ?? "Vaccine",
    dose: row.dose,
    batchNumber: row.batch_number,
    route: row.route,
    administeredByName: row.administered_by?.full_name ?? null,
    veterinarianName: row.veterinarian?.name ?? null,
    nextDueDate: row.next_due_date,
    notes: row.notes,
  }));
}

export interface Treatment {
  id: string;
  treatmentDate: string;
  medicationName: string | null;
  dosage: string | null;
  route: string | null;
  durationDays: number | null;
  administeredByName: string | null;
  veterinarianName: string | null;
  withdrawalUntil: string | null;
  outcome: string | null;
  followUpDate: string | null;
  notes: string | null;
}

export async function fetchTreatments(animalId: string): Promise<Treatment[]> {
  const { data, error } = await supabase
    .from("treatments")
    .select(
      "id, treatment_date, custom_medication, dosage, route, duration_days, withdrawal_until, outcome, follow_up_date, notes, medication:medications(name), administered_by:profiles!administered_by_profile(full_name), veterinarian:veterinarians(name)",
    )
    .eq("animal_id", animalId)
    .is("deleted_at", null)
    .order("treatment_date", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: nonNull(row.id, "id"),
    treatmentDate: nonNull(row.treatment_date, "treatment_date"),
    medicationName: row.medication?.name ?? row.custom_medication,
    dosage: row.dosage,
    route: row.route,
    durationDays: row.duration_days,
    administeredByName: row.administered_by?.full_name ?? null,
    veterinarianName: row.veterinarian?.name ?? null,
    withdrawalUntil: row.withdrawal_until,
    outcome: row.outcome,
    followUpDate: row.follow_up_date,
    notes: row.notes,
  }));
}

export interface Illness {
  id: string;
  onsetDate: string;
  illnessName: string | null;
  severity: string;
  status: string;
  symptoms: string | null;
  diagnosis: string | null;
  resolvedDate: string | null;
  notes: string | null;
}

export async function fetchIllnesses(animalId: string): Promise<Illness[]> {
  const { data, error } = await supabase
    .from("illnesses")
    .select(
      "id, onset_date, custom_name, severity, status, symptoms, diagnosis, resolved_date, notes, illness_type:illness_types(name)",
    )
    .eq("animal_id", animalId)
    .is("deleted_at", null)
    .order("onset_date", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: nonNull(row.id, "id"),
    onsetDate: nonNull(row.onset_date, "onset_date"),
    illnessName: row.illness_type?.name ?? row.custom_name,
    severity: nonNull(row.severity, "severity"),
    status: nonNull(row.status, "status"),
    symptoms: row.symptoms,
    diagnosis: row.diagnosis,
    resolvedDate: row.resolved_date,
    notes: row.notes,
  }));
}

export interface VetVisit {
  id: string;
  visitDate: string;
  veterinarianName: string | null;
  purpose: string | null;
  findings: string | null;
  recommendations: string | null;
  nextVisitDate: string | null;
}

// vet_visits are many-animals-to-one-visit — queried from the junction
// table, embedding the visit itself, same shape as
// fetchAnimalOverviewSummary's "last vet visit" in features/animals/api.ts.
export async function fetchVetVisits(animalId: string): Promise<VetVisit[]> {
  const { data, error } = await supabase
    .from("vet_visit_animals")
    .select(
      "vet_visit:vet_visits(id, visit_date, purpose, findings, recommendations, next_visit_date, veterinarian:veterinarians(name))",
    )
    .eq("animal_id", animalId)
    .is("deleted_at", null)
    .order("visit_date", { foreignTable: "vet_visits", ascending: false });
  if (error) throw error;

  return (data ?? [])
    .map((row) => row.vet_visit)
    .filter((visit): visit is NonNullable<typeof visit> => !!visit)
    .map((visit) => ({
      id: visit.id,
      visitDate: visit.visit_date,
      veterinarianName: visit.veterinarian?.name ?? null,
      purpose: visit.purpose,
      findings: visit.findings,
      recommendations: visit.recommendations,
      nextVisitDate: visit.next_visit_date,
    }));
}

// ---------------------------------------------------------------------
// Record Vaccination drawer (Session 6) — the canonical "record X"
// pattern every other record flow copies. See docs/patterns/record-drawer.md.
// ---------------------------------------------------------------------

export interface VaccineOption {
  id: string;
  name: string;
  defaultIntervalDays: number | null;
}

// vaccines.species_id is nullable — a vaccine with no species set
// applies to any species (0005_reference.sql), so it's always offered
// alongside whatever's specific to the selected animal(s).
export async function fetchVaccineOptions(orgId: string, speciesId?: string): Promise<VaccineOption[]> {
  let query = supabase.from("vaccines").select("id, name, default_interval_days").eq("org_id", orgId).is("deleted_at", null);
  if (speciesId) query = query.or(`species_id.is.null,species_id.eq.${speciesId}`);
  const { data, error } = await query.order("name");
  if (error) throw error;
  return (data ?? []).map((v) => ({ id: v.id, name: v.name, defaultIntervalDays: v.default_interval_days }));
}

// The inline "add new vaccine" affordance — vaccines are reference data
// any org member can extend since 0021_reference_catalogue_manager_write.sql,
// not just the owner.
export async function createVaccine(orgId: string, name: string, speciesId: string | undefined): Promise<VaccineOption> {
  const { data, error } = await supabase
    .from("vaccines")
    .insert({ org_id: orgId, name, species_id: speciesId })
    .select("id, name, default_interval_days")
    .single();
  if (error) throw error;
  return { id: data.id, name: data.name, defaultIntervalDays: data.default_interval_days };
}

export interface AdministeredByOption {
  type: "profile" | "veterinarian";
  id: string;
  name: string;
}

// "Administered by" combines staff (profiles) and veterinarians into
// one searchable list (session-pack.md, Session 6) — the two are
// mutually exclusive on the vaccinations row itself
// (administered_by_profile vs veterinarian_id), never both.
export async function fetchAdministeredByOptions(orgId: string): Promise<AdministeredByOption[]> {
  const [profilesRes, vetsRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("org_id", orgId).eq("is_active", true).order("full_name"),
    supabase.from("veterinarians").select("id, name").eq("org_id", orgId).is("deleted_at", null).order("name"),
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (vetsRes.error) throw vetsRes.error;

  return [
    ...profilesRes.data.map((p): AdministeredByOption => ({ type: "profile", id: p.id, name: p.full_name })),
    ...vetsRes.data.map((v): AdministeredByOption => ({ type: "veterinarian", id: v.id, name: v.name })),
  ];
}

export type RecordVaccinationResult =
  | { mode: "online"; vaccinationIds: string[] }
  | { mode: "offline"; queueEntryId: string };

// Online: bulk_health_event() directly — the same RPC the offline sync
// worker replays through (lib/offline/sync.ts), so the two paths never
// diverge on validation. Offline: queued via create_health_event, with
// created_by stamped client-side the same way create_animal is
// (session-pack.md, Session 6). Either way, the result carries what
// the drawer's 8-second Undo needs to actually reverse the write, not
// just show a button — see undoRecordVaccination below.
export async function recordVaccination(values: VaccinationFormValues, createdBy: string): Promise<RecordVaccinationResult> {
  const administeredByProfile = values.administeredBy.type === "profile" ? values.administeredBy.id : undefined;
  const veterinarianId = values.administeredBy.type === "veterinarian" ? values.administeredBy.id : undefined;

  if (!navigator.onLine) {
    const queueEntryId = await enqueueCreateHealthEvent({
      animalIds: values.animalIds,
      vaccineId: values.vaccineId,
      dateAdministered: values.dateAdministered,
      dose: values.dose,
      batchNumber: values.batchNumber,
      route: values.route,
      administeredByProfile,
      veterinarianId,
      nextDueDate: values.nextDueDate,
      notes: values.notes,
      createdBy,
    });
    return { mode: "offline", queueEntryId };
  }

  const { data, error } = await supabase.rpc("bulk_health_event", {
    p_animal_ids: values.animalIds,
    p_vaccine_id: values.vaccineId,
    p_date_administered: values.dateAdministered,
    p_dose: values.dose,
    p_batch_number: values.batchNumber,
    p_route: values.route,
    p_administered_by_profile: administeredByProfile,
    p_veterinarian_id: veterinarianId,
    p_next_due_date: values.nextDueDate,
    p_notes: values.notes,
  });
  if (error) throw error;
  return { mode: "online", vaccinationIds: (data ?? []).map((v) => v.id) };
}

// The 8-second Undo (session-pack.md, Session 6) — a real reversal,
// not a cosmetic button. Online, soft-deletes the exact rows
// bulk_health_event just created (the standard "no hard DELETE"
// pattern, CLAUDE.md §6, applies to an undo too — it's still a
// deletion). Offline, cancels the queued entry outright, since nothing
// was ever written anywhere yet.
export async function undoRecordVaccination(result: RecordVaccinationResult): Promise<boolean> {
  if (result.mode === "offline") {
    return cancelQueuedEntry(result.queueEntryId);
  }
  if (result.vaccinationIds.length === 0) return false;
  const { error } = await supabase
    .from("vaccinations")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", result.vaccinationIds);
  if (error) throw error;
  return true;
}

// ---------------------------------------------------------------------
// Record Treatment / Record Illness / Record Vet Visit (Session 8 —
// M3 remainder). All three are online-only: treatment/illness/vet
// visit are not among the five offline-queued operations (CLAUDE.md
// §8), so there is no enqueue path here the way recordVaccination has
// one — callers check useOnlineStatus() and disable submission instead.
// ---------------------------------------------------------------------

export interface MedicationOption {
  id: string;
  name: string;
}

export async function fetchMedicationOptions(orgId: string): Promise<MedicationOption[]> {
  const { data, error } = await supabase.from("medications").select("id, name").eq("org_id", orgId).is("deleted_at", null).order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createMedication(orgId: string, name: string): Promise<MedicationOption> {
  const { data, error } = await supabase.from("medications").insert({ org_id: orgId, name }).select("id, name").single();
  if (error) throw error;
  return data;
}

export interface IllnessTypeOption {
  id: string;
  name: string;
}

export async function fetchIllnessTypeOptions(orgId: string): Promise<IllnessTypeOption[]> {
  const { data, error } = await supabase.from("illness_types").select("id, name").eq("org_id", orgId).is("deleted_at", null).order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createIllnessType(orgId: string, name: string): Promise<IllnessTypeOption> {
  const { data, error } = await supabase.from("illness_types").insert({ org_id: orgId, name }).select("id, name").single();
  if (error) throw error;
  return data;
}

export interface VeterinarianOption {
  id: string;
  name: string;
}

export async function fetchVeterinarianOptions(orgId: string): Promise<VeterinarianOption[]> {
  const { data, error } = await supabase.from("veterinarians").select("id, name").eq("org_id", orgId).is("deleted_at", null).order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createVeterinarian(orgId: string, name: string): Promise<VeterinarianOption> {
  const { data, error } = await supabase.from("veterinarians").insert({ org_id: orgId, name }).select("id, name").single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------
// Veterinarians directory (session-pack.md, Session 8) — the fuller
// record (practice/phone/email) the dedicated screen wants, versus the
// name-only inline-create the Record Vet Visit drawer's combobox uses
// above. Same reference-catalogue table, any org member can write
// (0021_reference_catalogue_manager_write.sql).
// ---------------------------------------------------------------------
export interface VeterinarianRecord {
  id: string;
  name: string;
  practice: string | null;
  phone: string | null;
  email: string | null;
}

export async function fetchVeterinarianDirectory(orgId: string): Promise<VeterinarianRecord[]> {
  const { data, error } = await supabase
    .from("veterinarians")
    .select("id, name, practice, phone, email")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export interface NewVeterinarianInput {
  name: string;
  practice?: string;
  phone?: string;
  email?: string;
}

export async function createVeterinarianDetailed(orgId: string, input: NewVeterinarianInput): Promise<VeterinarianRecord> {
  const { data, error } = await supabase
    .from("veterinarians")
    .insert({ org_id: orgId, name: input.name, practice: input.practice, phone: input.phone, email: input.email })
    .select("id, name, practice, phone, email")
    .single();
  if (error) throw error;
  return data;
}

// Soft delete only (CLAUDE.md §6) — reference catalogues are the one
// place any org member, not just the owner, can remove a row
// (0021_reference_catalogue_manager_write.sql). Goes through a
// SECURITY DEFINER RPC (0032_soft_delete_rpcs.sql), not a plain
// client-side update: Postgres RLS requires the row resulting from an
// UPDATE to still satisfy the table's own SELECT policy, and
// veterinarians_select filters deleted_at is null, so a plain
// `.update({deleted_at})` here rejects its own write with 42501 — this
// button has been broken since it shipped in Session 8, only caught
// now that the pgTAP suite has actually run for the first time.
export async function softDeleteVeterinarian(id: string): Promise<void> {
  const { error } = await supabase.rpc("soft_delete_reference_row", { p_table: "veterinarians", p_id: id });
  if (error) throw error;
}

export interface RecordTreatmentResult {
  treatmentIds: string[];
}

export async function recordTreatment(values: TreatmentFormValues): Promise<RecordTreatmentResult> {
  const administeredByProfile = values.administeredBy.type === "profile" ? values.administeredBy.id : undefined;
  const veterinarianId = values.administeredBy.type === "veterinarian" ? values.administeredBy.id : undefined;
  const medicationId = values.medication.type === "catalogue" ? values.medication.id : undefined;
  const customMedication = values.medication.type === "custom" ? values.medication.name : undefined;

  const { data, error } = await supabase.rpc("bulk_treatment_event", {
    p_animal_ids: values.animalIds,
    p_treatment_date: values.treatmentDate,
    p_illness_id: emptyToUndefined(values.illnessId),
    p_medication_id: medicationId,
    p_custom_medication: customMedication,
    p_dosage: values.dosage,
    p_route: values.route,
    p_duration_days: values.durationDays ? Number(values.durationDays) : undefined,
    p_administered_by_profile: administeredByProfile,
    p_veterinarian_id: veterinarianId,
    p_withdrawal_until: emptyToUndefined(values.withdrawalUntil),
    p_outcome: values.outcome,
    p_follow_up_date: emptyToUndefined(values.followUpDate),
    p_notes: values.notes,
  });
  if (error) throw error;
  return { treatmentIds: (data ?? []).map((t) => t.id) };
}

export async function undoRecordTreatment(result: RecordTreatmentResult): Promise<boolean> {
  if (result.treatmentIds.length === 0) return false;
  const { error } = await supabase.from("treatments").update({ deleted_at: new Date().toISOString() }).in("id", result.treatmentIds);
  if (error) throw error;
  return true;
}

export interface RecordIllnessResult {
  illnessIds: string[];
}

export async function recordIllness(values: IllnessFormValues): Promise<RecordIllnessResult> {
  const illnessTypeId = values.illnessName.type === "catalogue" ? values.illnessName.id : undefined;
  const customName = values.illnessName.type === "custom" ? values.illnessName.name : undefined;

  const { data, error } = await supabase.rpc("bulk_illness_event", {
    p_animal_ids: values.animalIds,
    p_onset_date: values.onsetDate,
    p_severity: values.severity,
    p_illness_type_id: illnessTypeId,
    p_custom_name: customName,
    p_symptoms: values.symptoms,
    p_diagnosis: values.diagnosis,
    p_diagnosed_by: values.diagnosedBy,
    p_status: values.status,
    p_resolved_date: emptyToUndefined(values.resolvedDate),
    p_notes: values.notes,
  });
  if (error) throw error;
  return { illnessIds: (data ?? []).map((i) => i.id) };
}

export async function undoRecordIllness(result: RecordIllnessResult): Promise<boolean> {
  if (result.illnessIds.length === 0) return false;
  const { error } = await supabase.from("illnesses").update({ deleted_at: new Date().toISOString() }).in("id", result.illnessIds);
  if (error) throw error;
  return true;
}

export interface RecordVetVisitResult {
  vetVisitId: string;
}

export async function recordVetVisit(values: VetVisitFormValues): Promise<RecordVetVisitResult> {
  // record_vet_visit returns a single `vet_visits` row, not `setof` —
  // unlike the two bulk_*_event RPCs above, the client never calls
  // `.single()` here, since the generated type already reflects a
  // single object rather than an array (no `.single()` overload
  // applies to that shape).
  const { data, error } = await supabase.rpc("record_vet_visit", {
    p_animal_ids: values.animalIds,
    p_visit_date: values.visitDate,
    p_veterinarian_id: emptyToUndefined(values.veterinarianId),
    p_purpose: values.purpose,
    p_findings: values.findings,
    p_recommendations: values.recommendations,
    p_next_visit_date: emptyToUndefined(values.nextVisitDate),
    p_notes: values.notes,
  });
  if (error) throw error;
  return { vetVisitId: data.id };
}

export async function undoRecordVetVisit(result: RecordVetVisitResult): Promise<boolean> {
  const { error } = await supabase.from("vet_visits").update({ deleted_at: new Date().toISOString() }).eq("id", result.vetVisitId);
  if (error) throw error;
  return true;
}

// ---------------------------------------------------------------------
// Standalone health registers (session-pack.md Part 5 — "M3 remainder":
// Health Hub + Vaccinations/Treatments/Illnesses/Vet Visits register
// screens, alongside the per-animal Health tab these same tables
// already power above). Server-side paginated, same shape as
// fetchAnimalRegister (features/animals/api.ts) — `.range()` +
// `count: "exact"`, never fetched-and-sliced client-side.
//
// RLS on vaccinations/treatments/illnesses is `has_animal_access(animal_id)`
// (0014_rls.sql) — already ranch-scoped per row with no explicit filter
// needed for a Manager to only see their own ranches. The optional
// `ranchId` param narrows further, the same "one specific ranch from
// the global switcher" case get_dashboard_stats handles — done via an
// `!inner` join to animals so `.eq("animal.ranch_id", ...)` is a real
// server-side filter, not a client-side one.
//
// Sorting is deliberately not exposed on these registers — each has one
// natural date column and no register-specific reason to sort any
// other way, unlike the animal register's many comparable columns.
// ---------------------------------------------------------------------

export interface HealthRegisterParams {
  ranchId?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}

export interface VaccinationRegisterRow {
  id: string;
  dateAdministered: string;
  animalId: string;
  tagNumber: string;
  animalName: string | null;
  speciesName: string | null;
  vaccineName: string;
  dose: string | null;
  administeredByName: string | null;
  veterinarianName: string | null;
  nextDueDate: string | null;
}

export interface VaccinationRegisterResult {
  rows: VaccinationRegisterRow[];
  totalCount: number;
}

export async function fetchVaccinationRegister(params: HealthRegisterParams): Promise<VaccinationRegisterResult> {
  let query = supabase
    .from("vaccinations")
    .select(
      "id, date_administered, dose, next_due_date, vaccine:vaccines(name), administered_by:profiles!administered_by_profile(full_name), veterinarian:veterinarians(name), animal:animals!inner(id, tag_number, name, ranch_id, species:species(name))",
      { count: "exact" },
    )
    .is("deleted_at", null);

  if (params.ranchId) query = query.eq("animal.ranch_id", params.ranchId);
  if (params.dateFrom) query = query.gte("date_administered", params.dateFrom);
  if (params.dateTo) query = query.lte("date_administered", params.dateTo);

  query = query
    .order("date_administered", { ascending: false })
    .range(params.page * params.pageSize, params.page * params.pageSize + params.pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    rows: (data ?? []).map((row) => ({
      id: nonNull(row.id, "id"),
      dateAdministered: nonNull(row.date_administered, "date_administered"),
      animalId: row.animal.id,
      tagNumber: row.animal.tag_number,
      animalName: row.animal.name,
      speciesName: row.animal.species?.name ?? null,
      vaccineName: row.vaccine?.name ?? "Vaccine",
      dose: row.dose,
      administeredByName: row.administered_by?.full_name ?? null,
      veterinarianName: row.veterinarian?.name ?? null,
      nextDueDate: row.next_due_date,
    })),
    totalCount: count ?? 0,
  };
}

export interface TreatmentRegisterRow {
  id: string;
  treatmentDate: string;
  animalId: string;
  tagNumber: string;
  animalName: string | null;
  speciesName: string | null;
  medicationName: string | null;
  dosage: string | null;
  withdrawalUntil: string | null;
  outcome: string | null;
}

export interface TreatmentRegisterResult {
  rows: TreatmentRegisterRow[];
  totalCount: number;
}

export async function fetchTreatmentRegister(params: HealthRegisterParams): Promise<TreatmentRegisterResult> {
  let query = supabase
    .from("treatments")
    .select(
      "id, treatment_date, custom_medication, dosage, withdrawal_until, outcome, medication:medications(name), animal:animals!inner(id, tag_number, name, ranch_id, species:species(name))",
      { count: "exact" },
    )
    .is("deleted_at", null);

  if (params.ranchId) query = query.eq("animal.ranch_id", params.ranchId);
  if (params.dateFrom) query = query.gte("treatment_date", params.dateFrom);
  if (params.dateTo) query = query.lte("treatment_date", params.dateTo);

  query = query
    .order("treatment_date", { ascending: false })
    .range(params.page * params.pageSize, params.page * params.pageSize + params.pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    rows: (data ?? []).map((row) => ({
      id: nonNull(row.id, "id"),
      treatmentDate: nonNull(row.treatment_date, "treatment_date"),
      animalId: row.animal.id,
      tagNumber: row.animal.tag_number,
      animalName: row.animal.name,
      speciesName: row.animal.species?.name ?? null,
      medicationName: row.medication?.name ?? row.custom_medication,
      dosage: row.dosage,
      withdrawalUntil: row.withdrawal_until,
      outcome: row.outcome,
    })),
    totalCount: count ?? 0,
  };
}

export interface IllnessRegisterRow {
  id: string;
  onsetDate: string;
  animalId: string;
  tagNumber: string;
  animalName: string | null;
  speciesName: string | null;
  illnessName: string | null;
  severity: string;
  status: string;
  resolvedDate: string | null;
}

export interface IllnessRegisterResult {
  rows: IllnessRegisterRow[];
  totalCount: number;
}

export async function fetchIllnessRegister(params: HealthRegisterParams): Promise<IllnessRegisterResult> {
  let query = supabase
    .from("illnesses")
    .select(
      "id, onset_date, custom_name, severity, status, resolved_date, illness_type:illness_types(name), animal:animals!inner(id, tag_number, name, ranch_id, species:species(name))",
      { count: "exact" },
    )
    .is("deleted_at", null);

  if (params.ranchId) query = query.eq("animal.ranch_id", params.ranchId);
  if (params.dateFrom) query = query.gte("onset_date", params.dateFrom);
  if (params.dateTo) query = query.lte("onset_date", params.dateTo);

  query = query
    .order("onset_date", { ascending: false })
    .range(params.page * params.pageSize, params.page * params.pageSize + params.pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    rows: (data ?? []).map((row) => ({
      id: nonNull(row.id, "id"),
      onsetDate: nonNull(row.onset_date, "onset_date"),
      animalId: row.animal.id,
      tagNumber: row.animal.tag_number,
      animalName: row.animal.name,
      speciesName: row.animal.species?.name ?? null,
      illnessName: row.illness_type?.name ?? row.custom_name,
      severity: nonNull(row.severity, "severity"),
      status: nonNull(row.status, "status"),
      resolvedDate: row.resolved_date,
    })),
    totalCount: count ?? 0,
  };
}

export interface VetVisitRegisterRow {
  id: string;
  visitDate: string;
  ranchName: string;
  veterinarianName: string | null;
  purpose: string | null;
  nextVisitDate: string | null;
  animals: { id: string; tagNumber: string }[];
}

export interface VetVisitRegisterResult {
  rows: VetVisitRegisterRow[];
  totalCount: number;
}

// vet_visits carries ranch_id directly (a visit happens at one physical
// place, 0028_health_bulk_rpcs.sql) — no `!inner` join needed for the
// ranch filter here, unlike the three animal-linked registers above.
// The animal list comes from the vet_visit_animals junction, joined and
// flattened to tag numbers for the row.
export async function fetchVetVisitRegister(params: HealthRegisterParams): Promise<VetVisitRegisterResult> {
  let query = supabase
    .from("vet_visits")
    .select(
      "id, visit_date, purpose, next_visit_date, ranch:ranches(name), veterinarian:veterinarians(name), vet_visit_animals(animal:animals(id, tag_number))",
      { count: "exact" },
    )
    .is("deleted_at", null);

  if (params.ranchId) query = query.eq("ranch_id", params.ranchId);
  if (params.dateFrom) query = query.gte("visit_date", params.dateFrom);
  if (params.dateTo) query = query.lte("visit_date", params.dateTo);

  query = query
    .order("visit_date", { ascending: false })
    .range(params.page * params.pageSize, params.page * params.pageSize + params.pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    rows: (data ?? []).map((row) => ({
      id: nonNull(row.id, "id"),
      visitDate: nonNull(row.visit_date, "visit_date"),
      ranchName: row.ranch?.name ?? "—",
      veterinarianName: row.veterinarian?.name ?? null,
      purpose: row.purpose,
      nextVisitDate: row.next_visit_date,
      animals: (row.vet_visit_animals ?? [])
        .map((vva) => (vva.animal ? { id: vva.animal.id, tagNumber: vva.animal.tag_number } : null))
        .filter((a): a is { id: string; tagNumber: string } => !!a),
    })),
    totalCount: count ?? 0,
  };
}
