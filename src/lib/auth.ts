import { queryOptions, useQuery, type QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "./supabase";
import type { Role } from "./permissions";

// ---------------------------------------------------------------------
// Session only — used by the protected-route guard (src/routes/
// _authenticated.tsx), which only needs to know whether a session
// exists, not who the user is. getSession()/onAuthStateChange() aren't
// part of the Database schema typing, so this half never depended on
// real generated types.
// ---------------------------------------------------------------------

export interface SessionState {
  session: Session | null;
}

const SESSION_QUERY_KEY = ["auth", "session"] as const;

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async (): Promise<SessionState> => {
      const { data } = await supabase.auth.getSession();
      return { session: data.session };
    },
    // Pushed by the onAuthStateChange listener below via
    // invalidateQueries, not polled — a stale session is never served
    // silently past a sign-in/sign-out event.
    staleTime: Infinity,
  });
}

export function useSession() {
  const { data, isLoading } = useQuery(sessionQueryOptions());
  return {
    session: data?.session ?? null,
    isLoading,
    isAuthenticated: !!data?.session,
  };
}

// The protected-route guard itself, shared between every top-level
// auth-gated layout — _authenticated.tsx (the App Shell) and
// _enrollment.tsx (Session 5b's full-screen, sidebar-free Enrollment
// Mode). Two layouts, one guard, so the redirect-to-login behaviour
// can't drift between them.
export async function requireSession(queryClient: QueryClient, currentUrl: string): Promise<void> {
  const { session } = await queryClient.ensureQueryData(sessionQueryOptions());
  if (!session) {
    throw redirect({ to: "/login", search: { redirect: currentUrl } });
  }
}

// ---------------------------------------------------------------------
// Full auth state — session + profile (role, org_id, full_name) +
// assigned ranch IDs (for permissions.ts's can() and the ranch scope
// switcher's UI affordances). Needs real generated types for
// `.from("profiles")`/`.from("ranch_assignments")`, which now exist.
// ---------------------------------------------------------------------

export interface Profile {
  id: string;
  orgId: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  avatarUrl: string | null;
  phone: string | null;
}

export interface AuthState {
  session: Session | null;
  profile: Profile | null;
  assignedRanchIds: string[];
}

const AUTH_QUERY_KEY = ["auth", "state"] as const;

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, org_id, full_name, email, role, is_active, avatar_url, phone")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    orgId: data.org_id,
    fullName: data.full_name,
    email: data.email,
    // animal_statuses.role et al. are lookup-friendly `text` + CHECK,
    // deliberately not a Postgres enum (blueprint.md §2.1 rule 7) — so
    // generated types see `string`, not the literal union. Narrowed
    // once, here, at the one place data crosses from the database into
    // the app.
    role: data.role === "owner" ? "owner" : "ranch_manager",
    isActive: data.is_active,
    avatarUrl: data.avatar_url,
    phone: data.phone,
  };
}

async function fetchAssignedRanchIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("ranch_assignments").select("ranch_id").eq("profile_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.ranch_id);
}

export function authQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async (): Promise<AuthState> => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        return { session: null, profile: null, assignedRanchIds: [] };
      }
      const [profile, assignedRanchIds] = await Promise.all([
        fetchProfile(session.user.id),
        fetchAssignedRanchIds(session.user.id),
      ]);
      return { session, profile, assignedRanchIds };
    },
    staleTime: Infinity,
  });
}

export function useAuth() {
  const { data, isLoading } = useQuery(authQueryOptions());
  return {
    session: data?.session ?? null,
    profile: data?.profile ?? null,
    assignedRanchIds: data?.assignedRanchIds ?? [],
    isLoading,
    isAuthenticated: !!data?.session,
    isOwner: data?.profile?.role === "owner",
  };
}

// Called once at app bootstrap (src/main.tsx) so both query caches stay
// correct across sign-in, sign-out, and token refresh without every
// consumer re-implementing its own listener.
export function initAuthListener(queryClient: QueryClient) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(() => {
    void queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
  });
  return () => subscription.unsubscribe();
}
