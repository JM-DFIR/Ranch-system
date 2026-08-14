import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { PageSize } from "@/features/animals/schema";
import {
  fetchAnimalStatusesList,
  fetchAuditLog,
  fetchBreedsList,
  fetchCareActivityTypesList,
  fetchFeedItemsList,
  fetchIllnessTypesList,
  fetchInvitations,
  fetchMedicationsList,
  fetchOrgMembers,
  fetchOrgSettings,
  fetchRanchAssignments,
  fetchSpeciesList,
  fetchVaccinesList,
  type AuditLogParams,
} from "./api";

export function useOrgMembers(orgId: string | undefined, page: number, pageSize: PageSize) {
  return useQuery({
    queryKey: queryKeys.admin.members(orgId ?? "", page, pageSize),
    queryFn: () => fetchOrgMembers(orgId ?? "", page, pageSize),
    enabled: !!orgId,
  });
}

export function useRanchAssignments(profileId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.ranchAssignments(profileId ?? ""),
    queryFn: () => fetchRanchAssignments(profileId ?? ""),
    enabled: !!profileId,
  });
}

export function useInvitations(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.invitations(orgId ?? ""),
    queryFn: () => fetchInvitations(orgId ?? ""),
    enabled: !!orgId,
  });
}

export function useOrgSettings(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.orgSettings(orgId ?? ""),
    queryFn: () => fetchOrgSettings(orgId ?? ""),
    enabled: !!orgId,
  });
}

export function useAuditLog(orgId: string | undefined, params: AuditLogParams) {
  return useQuery({
    queryKey: queryKeys.admin.auditLog(orgId ?? "", params),
    queryFn: () => fetchAuditLog(orgId ?? "", params),
    enabled: !!orgId,
  });
}

export function useSpeciesList(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.species(orgId ?? ""),
    queryFn: () => fetchSpeciesList(orgId ?? ""),
    enabled: !!orgId,
  });
}

export function useBreedsList(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.breeds(orgId ?? ""),
    queryFn: () => fetchBreedsList(orgId ?? ""),
    enabled: !!orgId,
  });
}

export function useAnimalStatusesList(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.animalStatuses(orgId ?? ""),
    queryFn: () => fetchAnimalStatusesList(orgId ?? ""),
    enabled: !!orgId,
  });
}

export function useVaccinesList(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.vaccines(orgId ?? ""),
    queryFn: () => fetchVaccinesList(orgId ?? ""),
    enabled: !!orgId,
  });
}

export function useMedicationsList(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.medications(orgId ?? ""),
    queryFn: () => fetchMedicationsList(orgId ?? ""),
    enabled: !!orgId,
  });
}

export function useIllnessTypesList(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.illnessTypes(orgId ?? ""),
    queryFn: () => fetchIllnessTypesList(orgId ?? ""),
    enabled: !!orgId,
  });
}

export function useFeedItemsList(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.feedItems(orgId ?? ""),
    queryFn: () => fetchFeedItemsList(orgId ?? ""),
    enabled: !!orgId,
  });
}

export function useCareActivityTypesList(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.careActivityTypes(orgId ?? ""),
    queryFn: () => fetchCareActivityTypesList(orgId ?? ""),
    enabled: !!orgId,
  });
}
