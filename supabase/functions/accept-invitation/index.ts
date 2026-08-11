Security Definer View
View public.v_animal_attention_summary is defined with the SECURITY DEFINER property// Validates an invitation token and creates the invited user's
// auth.users account + profiles row in one privileged operation.
//
// This has to run server-side under service_role — the client can't do
// any part of it: `invitations` SELECT is owner-only under RLS
// (supabase/migrations/0014_rls.sql), an invitee reading their own
// invitation is not a case that policy allows, and creating an
// auth.users row at all requires the Admin API, which is
// service_role-only by design regardless of RLS.
//
// Deployment note: not deployed or tested from this environment (no
// Docker here — see the Session 1 conversation). Deploy via
// `supabase functions deploy accept-invitation` once linked, or paste
// this file into the Supabase Dashboard's Edge Functions editor, which
// doesn't need Docker at all.
import { createClient } from "jsr:@supabase/supabase-js@2";

interface AcceptInvitationRequest {
  token: string;
  fullName: string;
  password: string;
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let body: AcceptInvitationRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const { token, fullName, password } = body;
  if (!token || !fullName || !password) {
    return jsonResponse({ error: "Missing token, fullName, or password" }, 400);
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { data: invitation, error: invitationError } = await supabaseAdmin
    .from("invitations")
    .select("id, org_id, email, role, expires_at, accepted_at")
    .eq("token", token)
    .is("deleted_at", null)
    .maybeSingle();

  if (invitationError || !invitation) {
    return jsonResponse({ error: "This invitation link is invalid." }, 404);
  }

  if (invitation.accepted_at) {
    return jsonResponse({ error: "This invitation has already been accepted." }, 409);
  }

  if (new Date(invitation.expires_at as string) < new Date()) {
    return jsonResponse({ error: "This invitation has expired." }, 410);
  }

  const { data: created, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
    email: invitation.email as string,
    password,
    email_confirm: true,
  });

  if (createUserError || !created.user) {
    return jsonResponse({ error: createUserError?.message ?? "Could not create the account." }, 400);
  }

  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: created.user.id,
    org_id: invitation.org_id,
    full_name: fullName,
    email: invitation.email,
    role: invitation.role,
  });

  if (profileError) {
    // Roll back the auth user so a failed profile insert doesn't leave
    // an orphaned login with no profile behind it.
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    return jsonResponse({ error: "Could not finish setting up your account." }, 500);
  }

  await supabaseAdmin
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  return jsonResponse({ success: true }, 200);
});
