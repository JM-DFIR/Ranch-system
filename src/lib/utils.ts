import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Postgres views report every column as nullable to PostgREST's
// codegen, even when the underlying structure guarantees a value (an
// INNER JOIN's columns, a NOT NULL base column, a COALESCE(...,
// literal)). This narrows that at the one place a query maps a row,
// rather than threading `| null` through the whole app for values
// that can't actually be null — and throws instead of silently
// coercing, so a wrong assumption fails loudly if a future migration
// ever makes it false. Not a substitute for `!`: this is a documented,
// checked assertion, not a silenced one.
export function nonNull<T>(value: T | null, field: string): T {
  if (value === null) {
    throw new Error(`Expected "${field}" to be non-null — check the view's JOIN/NOT NULL structure`);
  }
  return value;
}

// An untouched optional react-hook-form text field holds "" at
// submit time, not undefined — but a Postgres `uuid`/`date` RPC
// parameter rejects "" with an invalid-input-syntax error where it
// would happily accept NULL. `value || undefined` reads right here but
// trips `@typescript-eslint/prefer-nullish-coalescing`, and `??` is
// actually wrong (it only replaces null/undefined, not ""), so this
// names the real intent instead of fighting the linter with `||`.
export function emptyToUndefined(value: string | undefined): string | undefined {
  return value === undefined || value === "" ? undefined : value;
}
