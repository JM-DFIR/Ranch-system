import { beforeEach, describe, expect, it, vi } from "vitest";
import Dexie from "dexie";

// fake-indexeddb/auto (vite.config.ts's setupFiles) gives Dexie a real
// IndexedDB to open against — these tests exercise the actual queue
// and sync worker, not a re-implementation of their logic.

interface MockError {
  code?: string;
  message?: string;
}

const mockState = {
  insertError: null as MockError | null,
  updateSelectData: [{ id: "existing" }] as { id: string }[] | null,
  updateSelectError: null as MockError | null,
  uploadError: null as MockError | null,
  rpcError: null as MockError | null,
  rpcData: null as unknown,
};

const callOrder: string[] = [];

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({
      // Plain (non-async) functions returning a plain object — `await`
      // on a non-Promise value just resolves to it immediately, so this
      // is a faithful stand-in for the real thenable query builder
      // without an `async` keyword that has nothing to actually await.
      insert: () => {
        callOrder.push("insert");
        return { error: mockState.insertError };
      },
      update: () => ({
        eq: () => ({
          select: () => {
            callOrder.push("update");
            return { data: mockState.updateSelectData, error: mockState.updateSelectError };
          },
        }),
      }),
    }),
    storage: {
      from: () => ({
        upload: () => {
          callOrder.push("upload");
          return { error: mockState.uploadError };
        },
      }),
    },
    rpc: (name: string) => {
      callOrder.push(`rpc:${name}`);
      return { error: mockState.rpcError, data: mockState.rpcData };
    },
  },
}));

// Imported after the mock so sync.ts picks up the mocked module — vi.mock
// is hoisted above imports by Vitest regardless of source order, but
// this ordering keeps the file honest about what depends on what.
const { offlineDb } = await import("./db");
const { drainQueue } = await import("./sync");

function baseEntry(overrides: Partial<import("./db").QueueEntry>): import("./db").QueueEntry {
  return {
    id: crypto.randomUUID(),
    operationType: "create_animal",
    payload: { orgId: "org-1", ranchId: "ranch-1", statusId: "status-1", tagNumber: "M1" },
    status: "pending",
    createdAt: new Date().toISOString(),
    createdBy: "user-1",
    attemptCount: 0,
    ...overrides,
  };
}

beforeEach(async () => {
  await offlineDb.writeQueue.clear();
  callOrder.length = 0;
  mockState.insertError = null;
  mockState.updateSelectData = [{ id: "existing" }];
  mockState.updateSelectError = null;
  mockState.uploadError = null;
  mockState.rpcError = null;
  mockState.rpcData = null;
});

describe("write queue persistence", () => {
  it("records survive a page reload", async () => {
    const entry = baseEntry({ id: "animal-1" });
    await offlineDb.writeQueue.add(entry);

    // A reload opens a fresh connection to the same IndexedDB database
    // — not the same in-memory Dexie instance.
    const reopened = new Dexie("lims-offline");
    reopened.version(2).stores({ writeQueue: "id, status, operationType, createdAt" });
    const rows = await reopened.table("writeQueue").toArray();
    reopened.close();

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: "animal-1", operationType: "create_animal" });
  });
});

describe("drainQueue", () => {
  it("drains create_animal before attach_photo, regardless of enqueue order", async () => {
    // attach_photo enqueued first (older createdAt) but should still
    // sync second — see sync.ts's documented reversal of "photo first."
    await offlineDb.writeQueue.add(
      baseEntry({
        id: "photo-1",
        operationType: "attach_photo",
        payload: { animalId: "animal-1", orgId: "org-1" },
        photoBlobs: [new Blob(["x"]), new Blob(["y"])],
        createdAt: new Date(Date.now() - 1000).toISOString(),
      }),
    );
    await offlineDb.writeQueue.add(baseEntry({ id: "animal-1", createdAt: new Date().toISOString() }));

    await drainQueue();

    expect(callOrder).toEqual(["insert", "upload", "upload", "update"]);
  });

  it("retries a transient failure with backoff, then succeeds once the failure clears", async () => {
    mockState.insertError = { message: "network hiccup" };
    await offlineDb.writeQueue.add(baseEntry({ id: "animal-2" }));

    await drainQueue();

    let entry = await offlineDb.writeQueue.get("animal-2");
    expect(entry?.status).toBe("pending");
    expect(entry?.attemptCount).toBe(1);
    expect(entry?.nextRetryAt).toBeTruthy();
    if (entry?.nextRetryAt) {
      expect(new Date(entry.nextRetryAt).getTime()).toBeGreaterThan(Date.now());
    }

    // Not due yet — draining again right away must not retry early.
    await drainQueue();
    expect(callOrder).toEqual(["insert"]);

    // The failure clears, and the entry becomes due.
    mockState.insertError = null;
    await offlineDb.writeQueue.update("animal-2", { nextRetryAt: new Date(Date.now() - 1000).toISOString() });
    await drainQueue();

    entry = await offlineDb.writeQueue.get("animal-2");
    expect(entry?.status).toBe("synced");
  });

  it("attempts a sync even when navigator.onLine (wrongly) reports offline", async () => {
    // navigator.onLine is known to get stuck false on mobile browsers
    // after a network handoff even with a real connection — drainQueue
    // must not treat it as a hard gate. Real offline still fails
    // naturally via the mocked network call below, same as any other
    // transient error (see the retry-with-backoff test above).
    const originalOnLine = Object.getOwnPropertyDescriptor(navigator, "onLine") ?? Object.getOwnPropertyDescriptor(Navigator.prototype, "onLine");
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });

    try {
      await offlineDb.writeQueue.add(baseEntry({ id: "animal-offline-flag" }));
      await drainQueue();

      const entry = await offlineDb.writeQueue.get("animal-offline-flag");
      expect(entry?.status).toBe("synced");
      expect(callOrder).toEqual(["insert"]);
    } finally {
      if (originalOnLine) {
        Object.defineProperty(navigator, "onLine", originalOnLine);
      }
    }
  });

  it("lands a unique_violation in 'conflict' rather than retrying it forever or dropping it", async () => {
    mockState.insertError = { code: "23505" };
    await offlineDb.writeQueue.add(baseEntry({ id: "animal-3", payload: { orgId: "org-1", ranchId: "ranch-1", statusId: "status-1", tagNumber: "M47" } }));

    await drainQueue();

    const entry = await offlineDb.writeQueue.get("animal-3");
    expect(entry?.status).toBe("conflict");
    expect(entry?.attemptCount).toBe(0);
    expect(entry?.nextRetryAt).toBeUndefined();
    expect(entry?.lastError).toContain("M47");

    // A second drain must not touch a conflict entry — it's excluded
    // from the 'pending' query entirely, not retried and not silently
    // resolved on its own.
    callOrder.length = 0;
    await drainQueue();
    expect(callOrder).toEqual([]);
  });
});
