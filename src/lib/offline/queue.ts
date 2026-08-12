import { uuidv7 } from "uuidv7";

import { supabase } from "@/lib/supabase";
import { offlineDb, type QueueEntry } from "./db";

// First line of defence against a duplicate tag_number, checked at
// entry time (session-pack.md, Session 5b) — not the only one. Two
// people enrolling offline at the same moment can't see each other's
// local queues, so the real backstop is the sync-time unique_violation
// → 'conflict' handling already in sync.ts (Session 5a). This just
// catches the much more common case (the same person, or the same
// device, re-using a tag by mistake) without waiting for a sync.
export async function isTagNumberTaken(orgId: string, tagNumber: string): Promise<boolean> {
  const normalized = tagNumber.trim().toLowerCase();
  if (!normalized) return false;

  const queuedMatches = await offlineDb.writeQueue
    .where("operationType")
    .equals("create_animal")
    .filter((e) => {
      const queuedTag = e.payload.tagNumber;
      return e.status !== "conflict" && typeof queuedTag === "string" && queuedTag.trim().toLowerCase() === normalized;
    })
    .count();
  if (queuedMatches > 0) return true;

  // Can't check the server offline — that's exactly what the sync-time
  // conflict path exists to catch instead.
  if (!navigator.onLine) return false;

  const { data, error } = await supabase
    .from("animals")
    .select("id")
    .eq("org_id", orgId)
    .ilike("tag_number", tagNumber.trim())
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export interface EnqueueCreateAnimalParams {
  tagNumber: string;
  orgId: string;
  ranchId: string;
  statusId: string;
  createdBy: string;
  // Everything below is optional — Session 5a's minimal screen only
  // ever sent tag/org/ranch/status; 5b's identity step adds species/
  // sex, and "add more detail" adds the rest (session-pack.md).
  speciesId?: string;
  breedId?: string;
  sex?: "male" | "female" | "unknown";
  color?: string;
  dateOfBirth?: string;
  dobIsEstimated?: boolean;
  acquisitionType?: string;
  acquisitionDate?: string;
  damId?: string;
  sireId?: string;
  sectionId?: string;
  notes?: string;
}

// The animal's own future row id is generated here, client-side, and
// reused as this queue entry's id — the paired attach_photo entry
// (below) references it via payload.animalId, and the sync worker
// inserts the animals row with this exact id rather than letting
// Postgres assign a different one (0006_animals.sql: UUIDv7 primary
// keys, generated client-side — CLAUDE.md §6).
//
// payload.tagNumber is read directly by SyncIndicator.tsx's conflict
// UI (built in Session 2, ahead of this queue actually being drained)
// — this field name is load-bearing, not just a convention.
export async function enqueueCreateAnimal(params: EnqueueCreateAnimalParams): Promise<string> {
  const animalId = uuidv7();
  const { orgId, ranchId, createdBy, ...rest } = params;
  const entry: QueueEntry = {
    id: animalId,
    operationType: "create_animal",
    payload: { orgId, ranchId, ...rest },
    status: "pending",
    createdAt: new Date().toISOString(),
    createdBy,
    attemptCount: 0,
  };
  await offlineDb.writeQueue.add(entry);
  return animalId;
}

interface EnqueueAttachPhotoParams {
  animalId: string;
  orgId: string;
  photo: Blob;
  thumbnail: Blob;
  createdBy: string;
}

export async function enqueueAttachPhoto(params: EnqueueAttachPhotoParams): Promise<void> {
  const entry: QueueEntry = {
    id: uuidv7(),
    operationType: "attach_photo",
    payload: { animalId: params.animalId, orgId: params.orgId },
    photoBlobs: [params.photo, params.thumbnail],
    status: "pending",
    createdAt: new Date().toISOString(),
    createdBy: params.createdBy,
    attemptCount: 0,
  };
  await offlineDb.writeQueue.add(entry);
}

interface EnqueueCreateHealthEventParams {
  animalIds: string[];
  vaccineId: string;
  dateAdministered: string;
  createdBy: string;
  dose?: string;
  batchNumber?: string;
  route?: string;
  administeredByProfile?: string;
  veterinarianId?: string;
  nextDueDate?: string;
  notes?: string;
}

// "create_health_event" covers vaccinations specifically — the RPC it
// replays through (bulk_health_event) only ever wrote vaccinations
// (0017_rpc.sql), matching Session 6's actual scope (the Record
// Vaccination drawer). Treatments/illnesses would need their own
// operation type if a later session queues them offline; not invented
// here ahead of that need.
//
// Returns the queue entry's own id — the Record Vaccination drawer's
// Undo affordance (session-pack.md, Session 6) needs it to cancel the
// entry via cancelQueuedEntry() below, the same way an online write's
// Undo needs the created rows' ids to soft-delete them.
export async function enqueueCreateHealthEvent(params: EnqueueCreateHealthEventParams): Promise<string> {
  const { createdBy, ...payload } = params;
  const id = uuidv7();
  const entry: QueueEntry = {
    id,
    operationType: "create_health_event",
    payload,
    status: "pending",
    createdAt: new Date().toISOString(),
    createdBy,
    attemptCount: 0,
  };
  await offlineDb.writeQueue.add(entry);
  return id;
}

// Undo, for a queued (not yet synced) entry — only removes it while
// it's genuinely still 'pending'. If the sync worker has already
// picked it up ('syncing') or finished ('synced'/'conflict'), there's
// a real write to reason about instead of a queue entry to simply
// drop, so this deliberately does nothing in that case rather than
// racing the sync worker.
export async function cancelQueuedEntry(id: string): Promise<boolean> {
  const entry = await offlineDb.writeQueue.get(id);
  if (entry?.status !== "pending") return false;
  await offlineDb.writeQueue.delete(id);
  return true;
}

interface EnqueueCreateWeightParams {
  animalIds: string[];
  weightDate: string;
  method: string;
  createdBy: string;
  weightKg?: number;
  bodyConditionScore?: number;
  notes?: string;
}

export async function enqueueCreateWeight(params: EnqueueCreateWeightParams): Promise<string> {
  const { createdBy, ...payload } = params;
  const id = uuidv7();
  const entry: QueueEntry = {
    id,
    operationType: "create_weight",
    payload,
    status: "pending",
    createdAt: new Date().toISOString(),
    createdBy,
    attemptCount: 0,
  };
  await offlineDb.writeQueue.add(entry);
  return id;
}

interface EnqueueCreateMovementParams {
  animalId: string;
  toRanchId: string;
  movementDate: string;
  createdBy: string;
  toSectionId?: string;
  reason?: string;
  permitNumber?: string;
  notes?: string;
}

// record_movement() resolves the FROM ranch itself, server-side, from
// the animal's current row (0017_rpc.sql) — this payload deliberately
// carries no from_ranch_id for the sync worker to (mis)trust. See
// CLAUDE.md §7's movements rule; the same reasoning applies whether the
// call happens online, immediately, or replayed later from this queue.
export async function enqueueCreateMovement(params: EnqueueCreateMovementParams): Promise<void> {
  const { createdBy, ...payload } = params;
  const entry: QueueEntry = {
    id: uuidv7(),
    operationType: "create_movement",
    payload,
    status: "pending",
    createdAt: new Date().toISOString(),
    createdBy,
    attemptCount: 0,
  };
  await offlineDb.writeQueue.add(entry);
}
