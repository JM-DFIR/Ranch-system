import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchAdministeredByOptions,
  fetchIllnesses,
  fetchTreatments,
  fetchVaccinations,
  fetchVaccineOptions,
  fetchVetVisits,
  recordVaccination,
  type RecordVaccinationResult,
  type Vaccination,
} from "./api";
import type { VaccinationFormValues } from "./schema";

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
