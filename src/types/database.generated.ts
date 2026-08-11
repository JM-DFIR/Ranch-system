// ---------------------------------------------------------------------
// PLACEHOLDER — not real generated output.
//
// This file is normally produced by `pnpm db:types`
// (`supabase gen types typescript --local`), which requires a running
// local Supabase stack (Docker). This environment has neither Docker
// nor the Supabase CLI available, so the real command could not be run
// for Session 1 — see the migrations in supabase/migrations/ for the
// actual schema this file should reflect once regenerated.
//
// Regenerate for real before any feature code imports from this file:
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
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
