import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchAdministeredByOptions,
  fetchIllnessRegister,
  fetchIllnessTypeOptions,
  fetchIllnesses,
  fetchMedicationOptions,
  fetchTreatmentRegister,
  fetchTreatments,
  fetchVaccinationRegister,
  fetchVaccinations,
  fetchVaccineOptions,
  fetchVeterinarianDirectory,
  fetchVeterinarianOptions,
  fetchVetVisitRegister,
  fetchVetVisits,
  recordIllness,
  recordTreatment,
  recordVaccination,
  recordVetVisit,
  type HealthRegisterParams,
  type RecordIllnessResult,
  type RecordTreatmentResult,
  type RecordVaccinationResult,
  type RecordVetVisitResult,
  type Vaccination,
} from "./api";
import type { IllnessFormValues, TreatmentFormValues, VaccinationFormValues, VetVisitFormValues } from "./schema";

export function useVaccinations(animalId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.health.vaccinations(animalId ?? ""),
    queryFn: () => fetchVaccinations(animalId ?? ""),
    enabled: !!animalId,
  });
}

export function useTreatments(animalId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.health.treatments(animalId ?? ""),
    queryFn: () => fetchTreatments(animalId ?? ""),
    enabled: !!animalId,
  });
}

export function useIllnesses(animalId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.health.illnesses(animalId ?? ""),
    queryFn: () => fetchIllnesses(animalId ?? ""),
    enabled: !!animalId,
  });
}

export function useVetVisits(animalId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.health.vetVisits(animalId ?? ""),
    queryFn: () => fetchVetVisits(animalId ?? ""),
    enabled: !!animalId,
  });
}

export function useVaccineOptions(orgId: string | undefined, speciesId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.health.vaccineOptions(orgId ?? "", speciesId),
    queryFn: () => fetchVaccineOptions(orgId ?? "", speciesId),
    enabled: !!orgId,
  });
}

export function useAdministeredByOptions(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.health.administeredByOptions(orgId ?? ""),
    queryFn: () => fetchAdministeredByOptions(orgId ?? ""),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

// The canonical "record X" mutation shape (session-pack.md, Session 6)
// — optimistic update + rollback, then invalidation once the write
// settles. Optimistic patching only covers the single-animal case (the
// Health tab's own vaccinations list, the most likely thing already on
// screen when this fires from a profile) — for a bulk selection,
// patching N separate caches ahead of the real data isn't worth the
// complexity when the toast + invalidation already confirm it.
export function useRecordVaccination() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: VaccinationFormValues): Promise<{ values: VaccinationFormValues; result: RecordVaccinationResult }> => {
      if (!profile) throw new Error("Not signed in");
      const result = await recordVaccination(values, profile.id);
      return { values, result };
    },
    onMutate: async (values) => {
      if (values.animalIds.length !== 1) return undefined;
      const animalId = values.animalIds[0];
      if (!animalId) return undefined;

      const key = queryKeys.health.vaccinations(animalId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Vaccination[]>(key);

      const optimistic: Vaccination = {
        id: `optimistic-${Date.now()}`,
        dateAdministered: values.dateAdministered,
        vaccineName: "Saving…",
        dose: values.dose ?? null,
        batchNumber: values.batchNumber ?? null,
        route: values.route ?? null,
        administeredByName: null,
        veterinarianName: null,
        nextDueDate: values.nextDueDate ?? null,
        notes: values.notes ?? null,
      };
      queryClient.setQueryData<Vaccination[]>(key, (old) => [optimistic, ...(old ?? [])]);

      return { key, previous };
    },
    onError: (_error, _values, context) => {
      if (context) queryClient.setQueryData(context.key, context.previous);
    },
    onSettled: (data) => {
      if (!data) return;
      for (const animalId of data.values.animalIds) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.health.vaccinations(animalId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(animalId) });
      }
      if (profile?.orgId) void queryClient.invalidateQueries({ queryKey: queryKeys.animals.all(profile.orgId) });
    },
  });
}

// ---------------------------------------------------------------------
// Session 8 — Record Treatment / Illness / Vet Visit reference options.
// ---------------------------------------------------------------------

export function useMedicationOptions(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.health.medicationOptions(orgId ?? ""),
    queryFn: () => fetchMedicationOptions(orgId ?? ""),
    enabled: !!orgId,
  });
}

export function useIllnessTypeOptions(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.health.illnessTypeOptions(orgId ?? ""),
    queryFn: () => fetchIllnessTypeOptions(orgId ?? ""),
    enabled: !!orgId,
  });
}

export function useVeterinarianOptions(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.health.veterinarianOptions(orgId ?? ""),
    queryFn: () => fetchVeterinarianOptions(orgId ?? ""),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useVeterinarianDirectory(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.health.veterinarianDirectory(orgId ?? ""),
    queryFn: () => fetchVeterinarianDirectory(orgId ?? ""),
    enabled: !!orgId,
  });
}

// No offline branch and no optimistic patch on any of the three
// mutations below — treatment/illness/vet visit are online-only
// (CLAUDE.md §8), and each write settles fast enough online that
// invalidate-on-settle alone is enough (same call the vaccination
// mutation makes for its own bulk/multi-animal case).

export function useRecordTreatment() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: TreatmentFormValues): Promise<{ values: TreatmentFormValues; result: RecordTreatmentResult }> => {
      const result = await recordTreatment(values);
      return { values, result };
    },
    onSuccess: ({ values }) => {
      for (const animalId of values.animalIds) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.health.treatments(animalId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(animalId) });
      }
      if (profile?.orgId) void queryClient.invalidateQueries({ queryKey: queryKeys.animals.all(profile.orgId) });
    },
  });
}

export function useRecordIllness() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: IllnessFormValues): Promise<{ values: IllnessFormValues; result: RecordIllnessResult }> => {
      const result = await recordIllness(values);
      return { values, result };
    },
    onSuccess: ({ values }) => {
      for (const animalId of values.animalIds) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.health.illnesses(animalId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(animalId) });
      }
      if (profile?.orgId) void queryClient.invalidateQueries({ queryKey: queryKeys.animals.all(profile.orgId) });
    },
  });
}

export function useRecordVetVisit() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: VetVisitFormValues): Promise<{ values: VetVisitFormValues; result: RecordVetVisitResult }> => {
      const result = await recordVetVisit(values);
      return { values, result };
    },
    onSuccess: ({ values }) => {
      for (const animalId of values.animalIds) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.health.vetVisits(animalId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(animalId) });
      }
      if (profile?.orgId) void queryClient.invalidateQueries({ queryKey: queryKeys.animals.all(profile.orgId) });
    },
  });
}

// ---------------------------------------------------------------------
// The four standalone health registers (Part 5 — "M3 remainder").
// ---------------------------------------------------------------------

export function useVaccinationRegister(orgId: string | undefined, params: HealthRegisterParams) {
  return useQuery({
    queryKey: queryKeys.health.vaccinationRegister(orgId ?? "", params),
    queryFn: () => fetchVaccinationRegister(params),
    enabled: !!orgId,
  });
}

export function useTreatmentRegister(orgId: string | undefined, params: HealthRegisterParams) {
  return useQuery({
    queryKey: queryKeys.health.treatmentRegister(orgId ?? "", params),
    queryFn: () => fetchTreatmentRegister(params),
    enabled: !!orgId,
  });
}

export function useIllnessRegister(orgId: string | undefined, params: HealthRegisterParams) {
  return useQuery({
    queryKey: queryKeys.health.illnessRegister(orgId ?? "", params),
    queryFn: () => fetchIllnessRegister(params),
    enabled: !!orgId,
  });
}

export function useVetVisitRegister(orgId: string | undefined, params: HealthRegisterParams) {
  return useQuery({
    queryKey: queryKeys.health.vetVisitRegister(orgId ?? "", params),
    queryFn: () => fetchVetVisitRegister(params),
    enabled: !!orgId,
  });
}
