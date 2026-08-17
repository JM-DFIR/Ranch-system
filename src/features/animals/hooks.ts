import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  fetchAnimalDocuments,
  fetchAnimalFacetCounts,
  fetchAnimalFilterOptions,
  fetchAnimalLineage,
  fetchAnimalOverviewSummary,
  fetchAnimalProfile,
  fetchAnimalRegister,
  fetchAnimalSummaries,
  fetchAnimalTimeline,
  getAnimalPhotoSignedUrl,
  getAnimalPhotoSignedUrls,
  type AnimalRegisterParams,
  type LineageDirection,
  type TimelineEventType,
} from "./api";

export function useAnimalPhotoUrl(photoPath: string | null | undefined) {
  return useQuery({
    queryKey: ["animals", "photo-url", photoPath],
    queryFn: () => {
      if (!photoPath) throw new Error("No photo set");
      return getAnimalPhotoSignedUrl(photoPath);
    },
    enabled: !!photoPath,
  });
}

// The register's batched counterpart — one request for every photo on
// the current page, not one per row (see getAnimalPhotoSignedUrls).
// Sorted before joining into the key so re-fetching the same page in a
// different row order (a re-sort) doesn't miss the cache.
export function useAnimalPhotoUrls(photoPaths: string[]) {
  const sortedPaths = [...photoPaths].sort();
  return useQuery({
    queryKey: ["animals", "photo-urls", sortedPaths],
    queryFn: () => getAnimalPhotoSignedUrls(sortedPaths),
    enabled: sortedPaths.length > 0,
  });
}

// Three separate queries rather than one combined fetch: register rows
// and facet counts both change on every filter keystroke and should
// race independently, while filter options (reference data) barely
// ever change and shouldn't be re-fetched or re-suspended alongside
// them.
export function useAnimalRegister(orgId: string | undefined, params: AnimalRegisterParams) {
  return useQuery({
    queryKey: queryKeys.animals.register(orgId ?? "", params),
    queryFn: () => fetchAnimalRegister(params),
    enabled: !!orgId,
    placeholderData: (prev) => prev,
  });
}

export function useAnimalFacetCounts(orgId: string | undefined, params: AnimalRegisterParams) {
  return useQuery({
    queryKey: queryKeys.animals.facetCounts(orgId ?? "", params),
    queryFn: () => fetchAnimalFacetCounts(params),
    enabled: !!orgId,
    placeholderData: (prev) => prev,
  });
}

export function useAnimalFilterOptions(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.animals.filterOptions(orgId ?? ""),
    queryFn: fetchAnimalFilterOptions,
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

// Shared by the profile layout route and every tab that needs header
// context (Overview's identity grid, etc.) — one cache entry, same
// query key, so switching tabs never re-fetches it.
export function useAnimalProfile(animalId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.animals.profile(animalId ?? ""),
    queryFn: () => fetchAnimalProfile(animalId ?? ""),
    enabled: !!animalId,
  });
}

export function useAnimalLineage(animalId: string | undefined, direction: LineageDirection, maxDepth = 3) {
  return useQuery({
    queryKey: [...queryKeys.animals.lineage(animalId ?? "", direction), maxDepth] as const,
    queryFn: () => fetchAnimalLineage(animalId ?? "", direction, maxDepth),
    enabled: !!animalId,
  });
}

export function useAnimalDocuments(animalId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.animals.documents(animalId ?? ""),
    queryFn: () => fetchAnimalDocuments(animalId ?? ""),
    enabled: !!animalId,
  });
}

export function useAnimalOverviewSummary(animalId: string | undefined, sex: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.animals.detail(animalId ?? ""), "overview-summary"] as const,
    queryFn: () => fetchAnimalOverviewSummary(animalId ?? "", sex ?? "unknown"),
    enabled: !!animalId && !!sex,
  });
}

export function useAnimalTimeline(animalId: string | undefined, eventType?: TimelineEventType, limit?: number) {
  return useQuery({
    queryKey: [...queryKeys.animals.timeline(animalId ?? "", eventType), limit] as const,
    queryFn: () => fetchAnimalTimeline(animalId ?? "", { eventType, limit }),
    enabled: !!animalId,
  });
}

export function useAnimalSummaries(ids: string[]) {
  return useQuery({
    queryKey: queryKeys.animals.summaries(ids),
    queryFn: () => fetchAnimalSummaries(ids),
    enabled: ids.length > 0,
  });
}
