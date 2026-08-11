import { supabase } from "@/lib/supabase";
import type { LoginInput } from "./schema";

export async function signIn({ email, password }: LoginInput) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

interface AcceptInvitationInput {
  token: string;
  fullName: string;
  password: string;
}

interface AcceptInvitationResponse {
  success?: boolean;
  error?: string;
}

// Routes through supabase/functions/accept-invitation — has to run
// under service_role since `invitations` SELECT is owner-only under
// RLS and creating an auth.users row needs the Admin API regardless.
// Not deployed/tested from this environment (no Docker here — see the
// Session 1 conversation); verify the error-shape handling below once
// it's actually live, since the exact place a non-2xx Edge Function
// response's body ends up (data vs. error) is worth confirming against
// the real deployed function rather than assumed.
export async function acceptInvitation(input: AcceptInvitationInput) {
  const result = await supabase.functions.invoke<AcceptInvitationResponse>("accept-invitation", {
    body: input,
  });

  // @supabase/functions-js types FunctionsResponseFailure.error as
  // `any` in its own public types (every concrete error class —
  // FunctionsHttpError/FunctionsRelayError/FunctionsFetchError —
  // extends Error, but the union isn't modelled precisely upstream).
  // Widen to `unknown` immediately at this boundary and narrow
  // properly, rather than let the library's `any` leak any further.
  const rawError: unknown = result.error;
  if (rawError) {
    const message = rawError instanceof Error ? rawError.message : "Something went wrong. Try again.";
    throw new Error(typeof result.data?.error === "string" ? result.data.error : message);
  }
  if (result.data?.error) {
    throw new Error(result.data.error);
  }
}
