import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { fetchRanchDetail, fetchRanchSections, fetchRanchStats, getRanchCoverSignedUrl } from "./api";

// Shared by RanchCard, RanchDetailPage and RanchFormDrawer — same
// signed-url fetch, same cache entry per path, rather than each
// component repeating the guard/enabled pair.
export function useRanchCoverUrl(coverImagePath: string | null | undefined) {
  return useQuery({
    queryKey: ["ranches", "cover-url", coverImagePath],
    queryFn: () => {
      if (!coverImagePath) throw new Error("No cover image set");
      return getRanchCoverSignedUrl(coverImagePath);
    },
    enabled: !!coverImagePath,
  });
}

export function useRanchStats(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.ranches.statsList(orgId ?? ""),
    queryFn: fetchRanchStats,
    enabled: !!orgId,
  });
}

export function useRanchDetail(ranchId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.ranches.detail(ranchId ?? ""),
    queryFn: () => fetchRanchDetail(ranchId ?? ""),
    enabled: !!ranchId,
  });
}

export function useRanchSections(ranchId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.ranches.sections(ranchId ?? ""),
    queryFn: () => fetchRanchSections(ranchId ?? ""),
    enabled: !!ranchId,
  });
}
