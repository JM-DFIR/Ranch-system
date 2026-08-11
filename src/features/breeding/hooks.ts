import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { fetchBirths, fetchBreedingEvents } from "./api";

export function useBreedingEvents(damId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.breeding.events(damId ?? ""),
    queryFn: () => fetchBreedingEvents(damId ?? ""),
    enabled: !!damId,
  });
}

export function useBirths(damId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.breeding.births(damId ?? ""),
    queryFn: () => fetchBirths(damId ?? ""),
    enabled: !!damId,
  });
}
