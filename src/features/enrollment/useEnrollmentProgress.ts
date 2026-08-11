import { useLiveQuery } from "dexie-react-hooks";

import { offlineDb } from "@/lib/offline/db";

export interface EnrollmentProgress {
  recordedToday: number;
  waitingToSync: number;
}

// The persistent progress strip's numbers (session-pack.md, Session
// 5b: "63 animals recorded today · 12 waiting to sync") — read
// entirely from the local Dexie queue, not the server, so it keeps
// working with no connection at all. "Today" is local calendar-day
// creation time, matching how someone standing in a field thinks about
// "what I've done today," not a UTC boundary.
export function useEnrollmentProgress(): EnrollmentProgress {
  return useLiveQuery(
    async () => {
      const entries = await offlineDb.writeQueue.where("operationType").equals("create_animal").toArray();
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startOfTodayIso = startOfToday.toISOString();

      const recordedToday = entries.filter((e) => e.createdAt >= startOfTodayIso).length;
      const waitingToSync = entries.filter((e) => e.status !== "synced").length;

      return { recordedToday, waitingToSync };
    },
    [],
    { recordedToday: 0, waitingToSync: 0 },
  );
}
