import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { fetchIllnesses, fetchTreatments, fetchVaccinations, fetchVetVisits } from "./api";

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
