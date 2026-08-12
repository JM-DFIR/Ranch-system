import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { fetchMortalityRegister, type MortalityRegisterParams } from "./api";

export function useMortalityRegister(orgId: string | undefined, params: MortalityRegisterParams) {
  return useQuery({
    queryKey: queryKeys.mortality.register(orgId ?? "", params),
    queryFn: () => fetchMortalityRegister(params),
    enabled: !!orgId,
  });
}
