import Dexie, { type EntityTable } from "dexie";

// The five queued write operations, per blueprint.md §2.5 — nothing
// else goes through this queue. Everything else requires connectivity
// and says so plainly.
export type QueueOperationType =
  | "create_animal"
  | "attach_photo"
  | "create_health_event"
  | "create_weight"
  | "create_movement";

// "conflict" is not a transient state — it means a unique_violation on
// replay (most commonly two people claiming the same tag_number while
// both offline) and needs a decision from the user, not just patience.
// Never collapse it into "pending" in the UI (CLAUDE.md §8, blueprint §2.5).
export type QueueEntryStatus = "pending" | "syncing" | "synced" | "conflict" | "failed";

export interface QueueEntry {
  id: string; // client-generated UUIDv7 — never collides with a server-generated id
  operationType: QueueOperationType;
  payload: Record<string, unknown>;
  photoBlobs?: Blob[];
  status: QueueEntryStatus;
  createdAt: string; // ISO timestamp
  createdBy: string; // profile id, stamped client-side — see 0002_helpers.sql's
  // apply_audit_columns(): the trigger only fills created_by if NULL, so a
  // write relayed through an Edge Function under service_role still gets
  // attributed to the person who actually made it, not the service account.
  attemptCount: number;
  lastError?: string;
  // Exponential backoff needs to know when an entry is next allowed to
  // retry, not just how many times it's failed — added in v2 (sync.ts,
  // Session 5a) alongside the sync worker that actually needs it.
  // Undefined means "due now."
  nextRetryAt?: string;
}

// The write queue only — the read-side TanStack Query cache persists
// separately (via a query client persister, wired up alongside actual
// query usage). Two different jobs; deliberately not the same
// mechanism. See CLAUDE.md §2.
class OfflineDatabase extends Dexie {
  writeQueue!: EntityTable<QueueEntry, "id">;

  constructor() {
    super("lims-offline");
    this.version(1).stores({
      writeQueue: "id, status, operationType, createdAt",
    });
    // v2 only adds an optional field (nextRetryAt) — no index change, no
    // data migration needed, existing rows just read back as undefined.
    this.version(2).stores({
      writeQueue: "id, status, operationType, createdAt",
    });
  }
}

export const offlineDb = new OfflineDatabase();
