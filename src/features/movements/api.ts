import { supabase } from "@/lib/supabase";
import { emptyToUndefined, nonNull } from "@/lib/utils";
import { cancelQueuedEntry, enqueueCreateMovement } from "@/lib/offline/queue";
import type { TransferFormValues } from "./schema";

export interface Movement {
  id: string;
  movementDate: string;
  fromRanchName: string | null;
  fromSectionName: string | null;
  toRanchName: string | null;
  toSectionName: string | null;
  reason: string | null;
  permitNumber: string | null;
}

// movements is written only through record_movement() (0017_rpc.sql) —
// this is a read-only history, there's no matching insert path here.
export async function fetchMovements(animalId: string): Promise<Movement[]> {
  const { data, error } = await supabase
    .from("movements")
    .select(
      "id, movement_date, reason, permit_number, from_ranch:ranches!from_ranch_id(name), from_section:ranch_sections!from_section_id(name), to_ranch:ranches!to_ranch_id(name), to_section:ranch_sections!to_section_id(name)",
    )
    .eq("animal_id", animalId)
    .is("deleted_at", null)
    .order("movement_date", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: nonNull(row.id, "id"),
    movementDate: nonNull(row.movement_date, "movement_date"),
    fromRanchName: row.from_ranch?.name ?? null,
    fromSectionName: row.from_section?.name ?? null,
    toRanchName: row.to_ranch?.name ?? null,
    toSectionName: row.to_section?.name ?? null,
    reason: row.reason,
    permitNumber: row.permit_number,
  }));
}

// ---------------------------------------------------------------------
// Record Transfer (M4 — session-pack.md Part 5). record_movement()
// (0017_rpc.sql) is single-animal, so a bulk selection is N calls, not
// one RPC with an array param — that's deliberate: it's the same
// security-hardened RPC either way (from_ranch_id always resolved
// server-side per animal, CLAUDE.md §7), never a parallel bulk path
// that would need re-proving the same guarantee.
// ---------------------------------------------------------------------

export interface TransferResult {
  animalId: string;
  movementId: string;
  fromRanchId: string;
  fromSectionId: string | null;
}

export type RecordTransferResult =
  | { mode: "online"; transfers: TransferResult[] }
  | { mode: "offline"; queueEntryIds: string[] };

export async function recordTransfer(values: TransferFormValues, createdBy: string): Promise<RecordTransferResult> {
  if (!navigator.onLine) {
    const queueEntryIds = await Promise.all(
      values.animalIds.map((animalId) =>
        enqueueCreateMovement({
          animalId,
          toRanchId: values.toRanchId,
          toSectionId: values.toSectionId,
          movementDate: values.movementDate,
          reason: values.reason,
          permitNumber: values.permitNumber,
          notes: values.notes,
          createdBy,
        }),
      ),
    );
    return { mode: "offline", queueEntryIds };
  }

  const transfers = await Promise.all(
    values.animalIds.map(async (animalId): Promise<TransferResult> => {
      // record_movement returns a single `movements` row, not `setof` —
      // no `.single()` here, same reasoning as record_vet_visit.
      const { data, error } = await supabase.rpc("record_movement", {
        p_animal_id: animalId,
        p_to_ranch_id: values.toRanchId,
        p_to_section_id: emptyToUndefined(values.toSectionId),
        p_movement_date: values.movementDate,
        p_reason: values.reason,
        p_permit_number: values.permitNumber,
        p_notes: values.notes,
      });
      if (error) throw error;
      return {
        animalId,
        movementId: data.id,
        fromRanchId: data.from_ranch_id,
        fromSectionId: data.from_section_id,
      };
    }),
  );
  return { mode: "online", transfers };
}

// A real reversal, single-animal only (same "bulk isn't worth the
// complexity" line Session 6 already drew for optimistic updates —
// here it's Undo itself, not just the cache patch). Deleting the
// movements row alone wouldn't move the animal back — record_movement
// also updated animals.ranch_id/section_id in the same transaction
// (0017_rpc.sql) — so undo calls it again to physically reverse the
// position, then hides BOTH the original and the reversal from
// history, so it reads as if the transfer never happened rather than
// as two visible corrections.
export async function undoRecordTransfer(result: RecordTransferResult): Promise<boolean> {
  if (result.mode === "offline") {
    if (result.queueEntryIds.length !== 1) return false;
    const [entryId] = result.queueEntryIds;
    if (!entryId) return false;
    return cancelQueuedEntry(entryId);
  }

  if (result.transfers.length !== 1) return false;
  const [transfer] = result.transfers;
  if (!transfer) return false;

  const { data: reversal, error: reversalError } = await supabase.rpc("record_movement", {
    p_animal_id: transfer.animalId,
    p_to_ranch_id: transfer.fromRanchId,
    p_to_section_id: transfer.fromSectionId ?? undefined,
    p_movement_date: new Date().toISOString().slice(0, 10),
    p_reason: "Undo",
  });
  if (reversalError) throw reversalError;

  const { error: hideError } = await supabase
    .from("movements")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", [transfer.movementId, reversal.id]);
  if (hideError) throw hideError;
  return true;
}

// ---------------------------------------------------------------------
// Movements register (Part 5 — "M4"). The ranch filter matches
// movements_select's own read policy (0014_rls.sql): either endpoint
// counts, not just the destination — a manager who received an animal
// via transfer should see that it happened even without access to
// where it came from.
// ---------------------------------------------------------------------

export interface MovementRegisterParams {
  ranchId?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}

export interface MovementRegisterRow {
  id: string;
  movementDate: string;
  animalId: string;
  tagNumber: string;
  animalName: string | null;
  fromRanchName: string | null;
  toRanchName: string;
  reason: string | null;
  permitNumber: string | null;
}

export interface MovementRegisterResult {
  rows: MovementRegisterRow[];
  totalCount: number;
}

export async function fetchMovementRegister(params: MovementRegisterParams): Promise<MovementRegisterResult> {
  let query = supabase
    .from("movements")
    .select(
      "id, movement_date, reason, permit_number, animal:animals(id, tag_number, name), from_ranch:ranches!from_ranch_id(name), to_ranch:ranches!to_ranch_id(name)",
      { count: "exact" },
    )
    .is("deleted_at", null);

  if (params.ranchId) query = query.or(`from_ranch_id.eq.${params.ranchId},to_ranch_id.eq.${params.ranchId}`);
  if (params.dateFrom) query = query.gte("movement_date", params.dateFrom);
  if (params.dateTo) query = query.lte("movement_date", params.dateTo);

  query = query
    .order("movement_date", { ascending: false })
    .range(params.page * params.pageSize, params.page * params.pageSize + params.pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    rows: (data ?? []).map((row) => ({
      id: nonNull(row.id, "id"),
      movementDate: nonNull(row.movement_date, "movement_date"),
      animalId: row.animal?.id ?? "",
      tagNumber: row.animal?.tag_number ?? "—",
      animalName: row.animal?.name ?? null,
      fromRanchName: row.from_ranch?.name ?? null,
      toRanchName: row.to_ranch?.name ?? "—",
      reason: row.reason,
      permitNumber: row.permit_number,
    })),
    totalCount: count ?? 0,
  };
}
