import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  fetchAnimalSearchOptions,
  fetchDashboardStats,
  fetchFirstRunState,
  fetchRanchStats,
  fetchRecentActivity,
  fetchUpcoming,
  type DashboardStatsParams,
  type RecentActivityParams,
  type UpcomingParams,
} from "./api";

export function useDashboardStats(orgId: string | undefined, params: DashboardStatsParams) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(orgId ?? "", params),
    queryFn: () => fetchDashboardStats(params),
    enabled: !!orgId,
  });
}

export function useRanchStats(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.dashboard.ranchStats(orgId ?? ""),
    queryFn: fetchRanchStats,
    enabled: !!orgId,
  });
}

export function useUpcoming(orgId: string | undefined, params: UpcomingParams) {
  return useQuery({
    queryKey: queryKeys.dashboard.upcoming(orgId ?? "", params),
    queryFn: () => fetchUpcoming(params),
    enabled: !!orgId,
  });
}

export function useRecentActivity(orgId: string | undefined, params: RecentActivityParams) {
  return useQuery({
    queryKey: queryKeys.dashboard.recentActivity(orgId ?? "", params),
    queryFn: () => fetchRecentActivity(params),
    enabled: !!orgId,
  });
}

export function useAnimalSearchOptions(orgId: string | undefined, ranchId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.dashboard.animalSearchOptions(orgId ?? ""),
    queryFn: () => fetchAnimalSearchOptions(ranchId),
    enabled: !!orgId,
    staleTime: 60 * 1000,
  });
}

export function useFirstRunState(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.dashboard.firstRun(orgId ?? ""),
    queryFn: fetchFirstRunState,
    enabled: !!orgId,
  });
}
