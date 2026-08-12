import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { fetchMovementRegister, fetchMovements, recordTransfer, type MovementRegisterParams, type RecordTransferResult } from "./api";
import type { TransferFormValues } from "./schema";

export function useMovements(animalId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.movements.list(animalId ?? ""),
    queryFn: () => fetchMovements(animalId ?? ""),
    enabled: !!animalId,
  });
}

// No optimistic patch — same reasoning as useRecordVaccination's own
// bulk case: a transfer's real effect (the animal's ranch/section
// changing) is exactly the kind of thing worth waiting for the real
// data on, not guessing at ahead of the round trip.
export function useRecordTransfer() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: TransferFormValues): Promise<{ values: TransferFormValues; result: RecordTransferResult }> => {
      if (!profile) throw new Error("Not signed in");
      const result = await recordTransfer(values, profile.id);
      return { values, result };
    },
    onSuccess: ({ values }) => {
      for (const animalId of values.animalIds) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.movements.list(animalId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(animalId) });
      }
      if (profile?.orgId) void queryClient.invalidateQueries({ queryKey: queryKeys.animals.all(profile.orgId) });
    },
  });
}

export function useMovementRegister(orgId: string | undefined, params: MovementRegisterParams) {
  return useQuery({
    queryKey: queryKeys.movements.register(orgId ?? "", params),
    queryFn: () => fetchMovementRegister(params),
    enabled: !!orgId,
  });
}
