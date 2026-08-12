import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchBirths,
  fetchBreedingCalendar,
  fetchBreedingEvents,
  fetchBreedingRegister,
  fetchSireOptions,
  recordBirth,
  recordBreedingEvent,
  recordPregnancyCheck,
  updateBreedingEventStatus,
  type BreedingRegisterParams,
  type RecordBreedingEventResult,
} from "./api";
import type { BirthFormValues, BreedingEventFormValues, PregnancyCheckFormValues } from "./schema";

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

export function useRecordBreedingEvent() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: BreedingEventFormValues): Promise<{ values: BreedingEventFormValues; result: RecordBreedingEventResult }> => {
      if (!profile) throw new Error("Not signed in");
      const result = await recordBreedingEvent(profile.orgId, values, profile.id);
      return { values, result };
    },
    onSuccess: ({ values }) => {
      for (const damId of values.damIds) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.breeding.events(damId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(damId) });
      }
      if (profile?.orgId) void queryClient.invalidateQueries({ queryKey: queryKeys.animals.all(profile.orgId) });
    },
  });
}

export function useRecordPregnancyCheck(damId: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ breedingEventId, values }: { breedingEventId: string; values: PregnancyCheckFormValues }) => {
      if (!profile) throw new Error("Not signed in");
      const id = await recordPregnancyCheck(profile.orgId, breedingEventId, values, profile.id);
      if (values.result === "pregnant") {
        await updateBreedingEventStatus(breedingEventId, "confirmed_pregnant");
      } else if (values.result === "not_pregnant") {
        await updateBreedingEventStatus(breedingEventId, "not_pregnant");
      }
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.breeding.events(damId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(damId) });
    },
  });
}

export function useRecordBirth() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: BirthFormValues): Promise<{ values: BirthFormValues; birthId: string }> => {
      const birthId = await recordBirth(values);
      return { values, birthId };
    },
    onSuccess: ({ values }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.breeding.births(values.damId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.breeding.events(values.damId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(values.damId) });
      if (profile?.orgId) void queryClient.invalidateQueries({ queryKey: queryKeys.animals.all(profile.orgId) });
    },
  });
}

export function useBreedingRegister(orgId: string | undefined, params: BreedingRegisterParams) {
  return useQuery({
    queryKey: queryKeys.breeding.register(orgId ?? "", params),
    queryFn: () => fetchBreedingRegister(params),
    enabled: !!orgId,
  });
}

export function useBreedingCalendar(orgId: string | undefined, ranchId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.breeding.calendar(orgId ?? "", ranchId),
    queryFn: () => fetchBreedingCalendar(ranchId),
    enabled: !!orgId,
  });
}

export function useSireOptions(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.breeding.sireOptions(orgId ?? ""),
    queryFn: () => fetchSireOptions(orgId ?? ""),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}
