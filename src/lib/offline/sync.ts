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

function strOpt(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numOpt(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function boolOpt(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function strArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
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
    sex: strOpt(p.sex) ?? "unknown",
    species_id: strOpt(p.speciesId),
    breed_id: strOpt(p.breedId),
    color: strOpt(p.color),
    date_of_birth: strOpt(p.dateOfBirth),
    dob_is_estimated: boolOpt(p.dobIsEstimated) ?? false,
    acquisition_type: strOpt(p.acquisitionType) ?? "unknown",
    acquisition_date: strOpt(p.acquisitionDate),
    dam_id: strOpt(p.damId),
    sire_id: strOpt(p.sireId),
    section_id: strOpt(p.sectionId),
    notes: strOpt(p.notes),
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

// bulk_health_event/bulk_weight_event/record_movement are all the
// established SECURITY DEFINER RPCs these writes already go through
// online (0017_rpc.sql) — the sync worker replays through the same
// path rather than a parallel raw-table-insert route, so validation
// (ranch access, required fields) stays in exactly one place.
async function syncCreateHealthEvent(entry: QueueEntry): Promise<void> {
  const p = entry.payload;
  const { error } = await supabase.rpc("bulk_health_event", {
    p_animal_ids: strArray(p.animalIds),
    p_vaccine_id: str(p.vaccineId),
    p_date_administered: str(p.dateAdministered),
    p_dose: strOpt(p.dose),
    p_batch_number: strOpt(p.batchNumber),
    p_route: strOpt(p.route),
    p_administered_by_profile: strOpt(p.administeredByProfile) ?? entry.createdBy,
    p_veterinarian_id: strOpt(p.veterinarianId),
    p_next_due_date: strOpt(p.nextDueDate),
    p_notes: strOpt(p.notes),
  });
  if (error) throw error;
  await offlineDb.writeQueue.update(entry.id, { status: "synced" });
}

async function syncCreateWeight(entry: QueueEntry): Promise<void> {
  const p = entry.payload;
  const { error } = await supabase.rpc("bulk_weight_event", {
    p_animal_ids: strArray(p.animalIds),
    p_weight_date: str(p.weightDate),
    p_method: str(p.method),
    p_weight_kg: numOpt(p.weightKg),
    p_body_condition_score: numOpt(p.bodyConditionScore),
    p_notes: strOpt(p.notes),
  });
  if (error) throw error;
  await offlineDb.writeQueue.update(entry.id, { status: "synced" });
}

async function syncCreateMovement(entry: QueueEntry): Promise<void> {
  const p = entry.payload;
  const { error } = await supabase.rpc("record_movement", {
    p_animal_id: str(p.animalId),
    p_to_ranch_id: str(p.toRanchId),
    p_to_section_id: strOpt(p.toSectionId),
    p_movement_date: str(p.movementDate),
    p_reason: strOpt(p.reason),
    p_permit_number: strOpt(p.permitNumber),
    p_notes: strOpt(p.notes),
  });
  if (error) throw error;
  await offlineDb.writeQueue.update(entry.id, { status: "synced" });
}

async function syncEntry(entry: QueueEntry): Promise<void> {
  await offlineDb.writeQueue.update(entry.id, { status: "syncing" });

  try {
    switch (entry.operationType) {
      case "create_animal":
        await syncCreateAnimal(entry);
        break;
      case "attach_photo":
        await syncAttachPhoto(entry);
        break;
      case "create_health_event":
        await syncCreateHealthEvent(entry);
        break;
      case "create_weight":
        await syncCreateWeight(entry);
        break;
      case "create_movement":
        await syncCreateMovement(entry);
        break;
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
// an interval, on mount, on a manual "sync now" tap) — re-entrant calls
// are no-ops while a drain is already in flight, and each entry's own
// nextRetryAt is what actually paces retries, not the caller's schedule.
//
// Deliberately does NOT gate on navigator.onLine. That flag is well
// known to be unreliable on mobile browsers — it can get stuck
// reporting "offline" after a network handoff (wifi/cellular, a screen
// lock, a flaky rural signal drop, exactly the conditions CLAUDE.md
// says this feature has to work under) even though the connection is
// genuinely fine, which silently blocked every sync attempt forever,
// including manual retries, with no way to recover short of the flag
// happening to flip back on its own. A genuinely offline attempt just
// fails its network call and falls into the existing retry/backoff
// path below — already the correct, cheap fallback — so there's
// nothing this pre-check was protecting that isn't already handled.
export async function drainQueue(): Promise<void> {
  if (draining) return;
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
