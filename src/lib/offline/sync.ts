import { supabase } from "@/lib/supabase";
import { offlineDb, type QueueEntry } from "./db";

const BASE_BACKOFF_MS = 2000;
const MAX_BACKOFF_MS = 5 * 60 * 1000;

function backoffDelayMs(attemptCount: number): number {
  return Math.min(BASE_BACKOFF_MS * 2 ** attemptCount, MAX_BACKOFF_MS);
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// Postgres's unique_violation — the specific, expected shape of "two
// people offline both claimed the same tag_number" (CLAUDE.md §8). This
// is the one failure this function does NOT retry as a transient error:
// it needs a decision from the user, made in SyncIndicator's conflict
// UI, not another attempt with the same payload.
function isUniqueViolation(error: { code?: string }): boolean {
  return error.code === "23505";
}

async function syncCreateAnimal(entry: QueueEntry): Promise<void> {
  const p = entry.payload;
  const { error } = await supabase.from("animals").insert({
    id: entry.id,
    org_id: str(p.orgId),
    ranch_id: str(p.ranchId),
    tag_number: str(p.tagNumber),
    status_id: str(p.statusId),
    sex: "unknown",
    created_by: entry.createdBy,
    updated_by: entry.createdBy,
  });

  if (error) {
    if (isUniqueViolation(error)) {
      await offlineDb.writeQueue.update(entry.id, {
        status: "conflict",
        lastError: `Tag ${str(p.tagNumber)} is already in use.`,
      });
      return;
    }
    throw error;
  }

  await offlineDb.writeQueue.update(entry.id, { status: "synced" });
}

async function syncAttachPhoto(entry: QueueEntry): Promise<void> {
  const p = entry.payload;
  const animalId = str(p.animalId);
  const orgId = str(p.orgId);
  const [photo, thumbnail] = entry.photoBlobs ?? [];

  if (!photo) {
    await offlineDb.writeQueue.update(entry.id, { status: "failed", lastError: "No photo data was saved with this entry." });
    return;
  }

  const photoPath = `${orgId}/${animalId}/photo.webp`;
  const { error: uploadError } = await supabase.storage
    .from("animal-photos")
    .upload(photoPath, photo, { contentType: "image/webp", upsert: true });
  if (uploadError) throw uploadError;

  if (thumbnail) {
    const thumbPath = `${orgId}/${animalId}/thumb.webp`;
    const { error: thumbError } = await supabase.storage
      .from("animal-photos")
      .upload(thumbPath, thumbnail, { contentType: "image/webp", upsert: true });
    if (thumbError) throw thumbError;
  }

  // The animal row is created by a separate, paired create_animal entry
  // that may not have synced yet — this update legitimately affects
  // zero rows in that case. That's not an error, just "not ready,"
  // handled the same way as any other transient failure: retry with
  // backoff on the next drain pass. See drainQueue()'s ordering below
  // for why this is rare in practice.
  const { data, error: updateError } = await supabase
    .from("animals")
    .update({ photo_path: photoPath, updated_by: entry.createdBy })
    .eq("id", animalId)
    .select("id");
  if (updateError) throw updateError;
  if (!data || data.length === 0) {
    throw new Error("Waiting for the animal record to sync first.");
  }

  await offlineDb.writeQueue.update(entry.id, { status: "synced" });
}

async function syncEntry(entry: QueueEntry): Promise<void> {
  await offlineDb.writeQueue.update(entry.id, { status: "syncing" });

  try {
    if (entry.operationType === "create_animal") {
      await syncCreateAnimal(entry);
    } else if (entry.operationType === "attach_photo") {
      await syncAttachPhoto(entry);
    } else {
      // create_health_event / create_weight / create_movement — arrive
      // in Session 5b (session-pack.md). Left visibly failed rather than
      // silently stuck, in the unlikely event one predates this build.
      await offlineDb.writeQueue.update(entry.id, {
        status: "failed",
        lastError: "This kind of record can't sync yet — not supported until a later update.",
      });
    }
  } catch (error) {
    const attemptCount = entry.attemptCount + 1;
    await offlineDb.writeQueue.update(entry.id, {
      status: "pending",
      attemptCount,
      nextRetryAt: new Date(Date.now() + backoffDelayMs(attemptCount)).toISOString(),
      lastError: error instanceof Error ? error.message : "Sync failed — will retry.",
    });
  }
}

let draining = false;

// Drains every due entry once. Safe to call repeatedly (on 'online', on
// an interval, on mount) — re-entrant calls are no-ops while a drain is
// already in flight, and each entry's own nextRetryAt is what actually
// paces retries, not the caller's schedule.
export async function drainQueue(): Promise<void> {
  if (draining || !navigator.onLine) return;
  draining = true;

  try {
    const all = await offlineDb.writeQueue.where("status").equals("pending").toArray();
    const now = new Date().toISOString();
    const due = all.filter((e) => !e.nextRetryAt || e.nextRetryAt <= now);

    // create_animal before attach_photo — a deliberate reversal of
    // "photo first" as literally read from session-pack.md's Session 5a
    // text. The photo's own Storage upload doesn't need the animal row
    // (animal-photos' RLS is org-scoped only — 0025_animal_photos_storage.sql),
    // but the final `animals.photo_path` update does. Ordering this way
    // means attach_photo succeeds in one pass instead of needing an
    // extra retry round-trip on every single enrollment.
    const ordered = [...due].sort((a, b) => {
      if (a.operationType !== b.operationType) {
        if (a.operationType === "create_animal") return -1;
        if (b.operationType === "create_animal") return 1;
      }
      return a.createdAt.localeCompare(b.createdAt);
    });

    for (const entry of ordered) {
      await syncEntry(entry);
    }
  } finally {
    draining = false;
  }
}
