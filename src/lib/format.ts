const DATE_FORMATTER = new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" });

// Shared short date format (e.g. "11 Aug 2026") — every feature that
// renders a Postgres date/timestamptz column funnels through this one
// formatter rather than each inventing its own.
export function formatDate(value: string): string {
  return DATE_FORMATTER.format(new Date(value));
}

const DATETIME_FORMATTER = new Intl.DateTimeFormat("en-KE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

// "11 Aug 2026, 3:45 pm" — Admin's Audit Log and "last seen" (Users &
// Roles), the two places this project shows a timestamp down to the
// minute rather than just a date.
export function formatDateTime(value: string): string {
  return DATETIME_FORMATTER.format(new Date(value));
}

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-KE", { month: "long", year: "numeric" });

// "August 2026" — the Timeline's sticky month headers.
export function formatMonthHeading(value: string): string {
  return MONTH_FORMATTER.format(new Date(value));
}

// "~2y 3m" when estimated (session-pack.md, Session 3/4) — "0m" for a
// newborn rather than a fussier "<1 month". Shared by the register
// column and the profile header, so both read an animal's age the same
// way.
export function formatAge(dateOfBirth: string | null, isEstimated: boolean): string {
  if (!dateOfBirth) return "—";
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  if (now.getDate() < dob.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const age = years > 0 ? `${years}y ${months}m` : `${months}m`;
  return isEstimated ? `~${age}` : age;
}
