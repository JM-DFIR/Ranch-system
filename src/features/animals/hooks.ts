import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  fetchAnimalFacetCounts,
  fetchAnimalFilterOptions,
  fetchAnimalRegister,
  type AnimalRegisterParams,
} from "./api";

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
