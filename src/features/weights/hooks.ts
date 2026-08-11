import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { fetchWeightSeries } from "./api";

export function useWeightSeries(animalId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.weights.series(animalId ?? ""),
    queryFn: () => fetchWeightSeries(animalId ?? ""),
    enabled: !!animalId,
  });
}
