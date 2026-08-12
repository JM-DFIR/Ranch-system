import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { fetchAttentionQueue } from "./api";

export function useAttentionQueue(orgId: string | undefined, ranchId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.health.attentionQueue(orgId ?? "", ranchId),
    queryFn: () => fetchAttentionQueue(ranchId),
    enabled: !!orgId,
  });
}
