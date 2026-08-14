import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, MailX } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { revokeInvitation, type InvitationRecord } from "../api";
import { useInvitations } from "../hooks";

function invitationLink(token: string): string {
  return `${window.location.origin}/accept-invitation?token=${token}`;
}

// Pending invitations sit below the Users register — a small,
// non-paginated panel, since an org realistically has a handful of
// outstanding invites at once, never register-scale volume.
export function InvitationsPanel() {
  const { profile } = useAuth();
  const { data: invitations, isLoading } = useInvitations(profile?.orgId);
  const queryClient = useQueryClient();
  const [toRevoke, setToRevoke] = useState<InvitationRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeInvitation(id),
    onSuccess: () => {
      if (profile) void queryClient.invalidateQueries({ queryKey: ["admin", profile.orgId, "invitations"] });
      toast.success("Invitation revoked");
      setToRevoke(null);
    },
    onError: (error) => toast.error("Couldn't revoke invitation", { description: error instanceof Error ? error.message : undefined }),
  });

  const pending = (invitations ?? []).filter((i) => !i.acceptedAt);
  if (!isLoading && pending.length === 0) return null;

  const copyLink = async (invitation: InvitationRecord) => {
    await navigator.clipboard.writeText(invitationLink(invitation.token));
    setCopiedId(invitation.id);
    toast.success("Link copied");
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-14 font-medium text-foreground">Pending invitations</h2>
      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <div className="flex flex-col gap-2">
          {pending.map((invitation) => {
            const expired = new Date(invitation.expiresAt) < new Date();
            return (
              <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-line p-3">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-14 font-medium text-foreground">{invitation.email}</p>
                    <p className="text-13 text-muted-foreground">
                      {invitation.role === "owner" ? "Owner" : "Ranch manager"} · expires {formatDate(invitation.expiresAt)}
                    </p>
                  </div>
                  {expired ? <Badge variant="warn">Expired</Badge> : null}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button size="icon-sm" variant="ghost" aria-label={`Copy invitation link for ${invitation.email}`} onClick={() => void copyLink(invitation)}>
                    {copiedId === invitation.id ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                  </Button>
                  <Button size="icon-sm" variant="ghost" aria-label={`Revoke invitation for ${invitation.email}`} onClick={() => setToRevoke(invitation)}>
                    <MailX className="size-3.5" aria-hidden />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!toRevoke}
        onOpenChange={(open) => !open && setToRevoke(null)}
        title={`Revoke the invitation for ${toRevoke?.email}?`}
        description="The link will stop working. You can invite them again later."
        confirmLabel="Revoke"
        destructive
        isConfirming={revokeMutation.isPending}
        onConfirm={() => toRevoke && revokeMutation.mutate(toRevoke.id)}
      />
    </div>
  );
}
