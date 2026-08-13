import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchCareActivities,
  fetchCareActivityRegister,
  fetchCareActivityTypeOptions,
  fetchFeedingRecords,
  fetchFeedingRegister,
  fetchFeedItemOptions,
  fetchOrgMembers,
  recordCareActivity,
  recordFeeding,
  type FeedingCareRegisterParams,
  type RecordCareActivityResult,
  type RecordFeedingResult,
} from "./api";
import type { CareActivityFormValues, FeedingFormValues } from "./schema";

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

export function useFeedItemOptions(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.feeding.feedItemOptions(orgId ?? ""),
    queryFn: () => fetchFeedItemOptions(orgId ?? ""),
    enabled: !!orgId,
  });
}

export function useCareActivityTypeOptions(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.feeding.careActivityTypeOptions(orgId ?? ""),
    queryFn: () => fetchCareActivityTypeOptions(orgId ?? ""),
    enabled: !!orgId,
  });
}

export function useOrgMembers(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.feeding.orgMembers(orgId ?? ""),
    queryFn: () => fetchOrgMembers(orgId ?? ""),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

// Invalidates both the animal-scoped detail queries (when the scope was
// animals) and the org-wide register — same shape as every other
// record mutation, just branching on which scope was actually used.
export function useRecordFeeding() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: FeedingFormValues): Promise<{ values: FeedingFormValues; result: RecordFeedingResult }> => {
      if (!profile) throw new Error("Not signed in");
      const result = await recordFeeding(profile.orgId, values, profile.id);
      return { values, result };
    },
    onSuccess: ({ values }) => {
      if (values.scope.type === "animal") {
        for (const animalId of values.scope.animalIds) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.feeding.records(animalId) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(animalId) });
        }
      }
      if (profile?.orgId) void queryClient.invalidateQueries({ queryKey: ["feeding", profile.orgId, "feeding-register"] });
    },
  });
}

export function useRecordCareActivity() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      values: CareActivityFormValues,
    ): Promise<{ values: CareActivityFormValues; result: RecordCareActivityResult }> => {
      if (!profile) throw new Error("Not signed in");
      const result = await recordCareActivity(profile.orgId, values, profile.id);
      return { values, result };
    },
    onSuccess: ({ values }) => {
      if (values.scope.type === "animal") {
        for (const animalId of values.scope.animalIds) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.feeding.careActivities(animalId) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(animalId) });
        }
      }
      if (profile?.orgId) void queryClient.invalidateQueries({ queryKey: ["feeding", profile.orgId, "care-activity-register"] });
    },
  });
}

export function useFeedingRegister(orgId: string | undefined, params: FeedingCareRegisterParams) {
  return useQuery({
    queryKey: queryKeys.feeding.feedingRegister(orgId ?? "", params),
    queryFn: () => fetchFeedingRegister(params),
    enabled: !!orgId,
  });
}

export function useCareActivityRegister(orgId: string | undefined, params: FeedingCareRegisterParams) {
  return useQuery({
    queryKey: queryKeys.feeding.careActivityRegister(orgId ?? "", params),
    queryFn: () => fetchCareActivityRegister(params),
    enabled: !!orgId,
  });
}
