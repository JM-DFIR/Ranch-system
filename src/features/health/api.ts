import { supabase } from "@/lib/supabase";
import { nonNull } from "@/lib/utils";

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
