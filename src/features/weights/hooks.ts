import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { fetchWeightSeries, recordWeight, type RecordWeightResult } from "./api";
import type { WeightFormValues } from "./schema";

export function useWeightSeries(animalId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.weights.series(animalId ?? ""),
    queryFn: () => fetchWeightSeries(animalId ?? ""),
    enabled: !!animalId,
  });
}

// Same invalidate-on-settle shape as useRecordVaccination — no
// optimistic patch here either (multi-animal bulk case is the norm for
// this one, via Bulk Weigh Day).
export function useRecordWeight() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: WeightFormValues): Promise<{ values: WeightFormValues; result: RecordWeightResult }> => {
      if (!profile) throw new Error("Not signed in");
      const result = await recordWeight(values, profile.id);
      return { values, result };
    },
    onSuccess: ({ values }) => {
      for (const animalId of values.animalIds) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.weights.series(animalId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(animalId) });
      }
      if (profile?.orgId) void queryClient.invalidateQueries({ queryKey: queryKeys.animals.all(profile.orgId) });
    },
  });
}
