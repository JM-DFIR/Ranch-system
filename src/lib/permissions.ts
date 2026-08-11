// Mirrors the RLS matrix in CLAUDE.md §7 for UI affordances only — this
// is a convenience layer, never the enforcement layer. RLS is the
// enforcement layer; hiding a button here does not make the underlying
// query safe, and every check here has a matching Postgres policy that
// is the actual source of truth.
//
// In particular:
// - Movements: permission follows the animal's CURRENT ranch only,
//   never "either endpoint" — mirrors the v3.0 correction in
//   record_movement() (supabase/migrations/0017_rpc.sql). Do not widen
//   this to also check the destination ranch; that is the exact hole
//   blueprint.md §3.3 documents closing.
// - Profiles: any user may edit their own row's safe fields; only an
//   owner may edit anyone else's, or change role/org_id at all.

export type Role = "owner" | "ranch_manager";

export interface PermissionContext {
  role: Role;
  userId: string;
  assignedRanchIds: readonly string[];
}

function hasRanchAccess(ctx: PermissionContext, ranchId: string): boolean {
  return ctx.role === "owner" || ctx.assignedRanchIds.includes(ranchId);
}

export type Action =
  | { kind: "view_ranch"; ranchId: string }
  | { kind: "create_ranch" }
  | { kind: "edit_ranch"; ranchId: string }
  | { kind: "record_on_ranch"; ranchId: string } // animals, health, weights, breeding, feeding
  | { kind: "record_movement"; fromRanchId: string }
  | { kind: "record_death"; ranchId: string }
  | { kind: "manage_users" }
  | { kind: "edit_reference_data" }
  | { kind: "edit_org_settings" }
  | { kind: "view_audit_log" }
  | { kind: "edit_profile"; profileId: string };

export function can(ctx: PermissionContext, action: Action): boolean {
  switch (action.kind) {
    case "view_ranch":
    case "record_on_ranch":
      return hasRanchAccess(ctx, action.ranchId);

    case "record_movement":
      // Access is required to the animal's CURRENT ranch only — no
      // check against a destination, ever. See the module comment.
      return hasRanchAccess(ctx, action.fromRanchId);

    case "record_death":
      return hasRanchAccess(ctx, action.ranchId);

    case "edit_reference_data":
      // Reopened from owner-only to any org member, 2026-08-11 —
      // 0021_reference_catalogue_manager_write.sql. Kept as its own
      // Action kind rather than folded into record_on_ranch: reference
      // catalogues are org-wide, not ranch-scoped, so there's no
      // ranchId to check here at all.
      return true;

    case "create_ranch":
    case "edit_ranch":
    case "manage_users":
    case "edit_org_settings":
    case "view_audit_log":
      return ctx.role === "owner";

    case "edit_profile":
      return ctx.role === "owner" || ctx.userId === action.profileId;
  }
}
