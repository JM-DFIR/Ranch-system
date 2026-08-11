// ---------------------------------------------------------------------
// PLACEHOLDER — not real generated output.
//
// This file is normally produced by `pnpm db:types`
// (`supabase gen types typescript --linked`), which requires the
// project to be linked via `supabase link` — see the Session 2
// conversation for why that hasn't happened from this environment yet.
// See supabase/migrations/ for the actual schema this file should
// reflect once regenerated.
//
// Shape note: `Tables`/`Views`/etc. below are empty object type
// literals (`{}`), not `Record<string, never>` — that distinction
// matters. `keyof Record<string, never>` is `string`, not the empty
// set, and that was enough to break supabase-js's internal generic
// resolution for the ENTIRE client (not just `.from()` calls — even
// `.functions.invoke()` was silently degrading to `any`, caught by
// eslint's no-unsafe-* rules rather than a hard tsc error). `keyof {}`
// correctly resolves to `never`, matching what real generated output
// for an empty schema actually looks like.
//
// Regenerate for real before any feature code relies on this further:
//   pnpm db:types
//
// CLAUDE.md §3: this file is never hand-edited once real generated
// output exists. Until then, do not hand-expand this stub table by
// table — that produces exactly the stale, silently-wrong types this
// rule exists to prevent. Regenerate it instead.
// ---------------------------------------------------------------------

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- see shape note above
    Tables: {};
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- see shape note above
    Views: {};
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- see shape note above
    Functions: {};
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- see shape note above
    Enums: {};
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- see shape note above
    CompositeTypes: {};
  };
}
