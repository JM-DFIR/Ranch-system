import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { fetchMovements } from "./api";

export function useMovements(animalId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.movements.list(animalId ?? ""),
    queryFn: () => fetchMovements(animalId ?? ""),
    enabled: !!animalId,
  });
}
