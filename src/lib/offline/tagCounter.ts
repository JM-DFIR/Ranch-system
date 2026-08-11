// A small local per-prefix counter the client tracks itself while
// offline, so Enrollment Mode's tag suggestion never needs a round
// trip (session-pack.md, Session 5b). This is NOT a second numbering
// system — it's a local guess that will very plausibly diverge from
// the server's real tag_sequences counter (another device, or this
// same device on a previous offline session, may have already used
// numbers this counter doesn't know about). That divergence is
// expected and handled entirely by the existing sync-time conflict
// path (sync.ts's unique_violation → 'conflict' handling), the same
// as any other offline tag collision — deliberately not a separate
// reconciliation scheme (CLAUDE.md §8).
const STORAGE_KEY_PREFIX = "lims:enroll:local-tag-counter:";

export function nextLocalTagNumber(prefix: string): string {
  const key = STORAGE_KEY_PREFIX + prefix;
  const current = Number(window.localStorage.getItem(key) ?? "0");
  const next = current + 1;
  window.localStorage.setItem(key, String(next));
  return `${prefix}${next}`;
}
