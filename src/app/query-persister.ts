import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { del, get, set } from "idb-keyval";

// The READ cache (TanStack Query), persisted to IndexedDB via
// idb-keyval's own tiny object store — deliberately NOT the same
// mechanism as lib/offline/db.ts's writeQueue (a separate Dexie
// database). One is a cache that can be discarded and rebuilt from the
// server at any time; the other is a durable log of writes that
// haven't happened yet and must never be lost. Conflating "read cache"
// and "write queue" is explicitly warned against (CLAUDE.md §2,
// blueprint.md's stack table) — this file only ever touches the
// former.
export const queryPersister = createAsyncStoragePersister({
  key: "lims-query-cache",
  storage: {
    getItem: (key: string) => get(key),
    setItem: (key: string, value: string) => set(key, value),
    removeItem: (key: string) => del(key),
  },
});
