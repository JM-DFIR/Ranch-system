import { queryOptions, useQuery, type QueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "./supabase";

// Session only, for now. `useAuth()` (session + profile: role, org_id,
// full_name — see blueprint.md's role-aware nav and the ranch switcher)
// needs `.from("profiles")`, which needs real generated types; the
// placeholder stub's empty Tables map makes that a hard type error,
// not just a style problem (CLAUDE.md §3: never hand-expand the stub
// table by table). Session-only auth doesn't touch `.from()` at all —
// getSession()/onAuthStateChange() aren't part of the Database schema
// typing — so the protected-route guard is fully buildable now; the
// rest lands once `pnpm db:types` produces real output.

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

// Called once at app bootstrap (src/main.tsx) so the session query
// cache stays correct across sign-in, sign-out, and token refresh
// without every consumer re-implementing its own listener.
export function initAuthListener(queryClient: QueryClient) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(() => {
    void queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
  });
  return () => subscription.unsubscribe();
}
