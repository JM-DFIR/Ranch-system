import { useEffect } from "react";

import { drainQueue } from "./sync";

const INTERVAL_MS = 30_000;

// Mounted once (AppShell.tsx) — drains on reconnect, on a 30s interval
// as a fallback for connections that come back without a clean
// browser 'online' event (common on flaky rural signal), and once on
// mount to pick up anything left over from a previous offline session.
export function useSyncWorker(): void {
  useEffect(() => {
    void drainQueue();

    const onOnline = () => void drainQueue();
    window.addEventListener("online", onOnline);
    const interval = window.setInterval(() => void drainQueue(), INTERVAL_MS);

    return () => {
      window.removeEventListener("online", onOnline);
      window.clearInterval(interval);
    };
  }, []);
}
