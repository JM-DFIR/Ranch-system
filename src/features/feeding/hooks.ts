import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { fetchCareActivities, fetchFeedingRecords } from "./api";

export function useFeedingRecords(animalId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.feeding.records(animalId ?? ""),
    queryFn: () => fetchFeedingRecords(animalId ?? ""),
    enabled: !!animalId,
  });
}

export function useCareActivities(animalId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.feeding.careActivities(animalId ?? ""),
    queryFn: () => fetchCareActivities(animalId ?? ""),
    enabled: !!animalId,
  });
}
