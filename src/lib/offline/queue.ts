import { uuidv7 } from "uuidv7";

import { offlineDb, type QueueEntry } from "./db";

interface EnqueueCreateAnimalParams {
  tagNumber: string;
  orgId: string;
  ranchId: string;
  statusId: string;
  createdBy: string;
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
  const entry: QueueEntry = {
    id: animalId,
    operationType: "create_animal",
    payload: {
      tagNumber: params.tagNumber,
      orgId: params.orgId,
      ranchId: params.ranchId,
      statusId: params.statusId,
    },
    status: "pending",
    createdAt: new Date().toISOString(),
    createdBy: params.createdBy,
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
