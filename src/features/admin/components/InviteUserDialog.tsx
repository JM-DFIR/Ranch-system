import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inviteUser, type InvitationRecord } from "../api";
import { inviteUserSchema, type InviteUserFormValues } from "../schema";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function invitationLink(token: string): string {
  return `${window.location.origin}/accept-invitation?token=${token}`;
}

// Invite User (blueprint.md §4.1). There's no email sending yet — Resend
// is post-v1 (CLAUDE.md §9's reminders-table sibling) — so this creates
// the invitation row and hands the owner a link to share themselves
// (WhatsApp/SMS, the client's actual channels), rather than pretending
// an email went out.
export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [created, setCreated] = useState<InvitationRecord | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { email: "", role: "ranch_manager" },
  });

  const mutation = useMutation({
    mutationFn: (values: InviteUserFormValues) => {
      if (!profile) throw new Error("Not signed in");
      return inviteUser(profile.orgId, profile.id, values);
    },
    onSuccess: (invitation) => {
      if (profile) void queryClient.invalidateQueries({ queryKey: ["admin", profile.orgId, "invitations"] });
      setCreated(invitation);
      toast.success("Invitation created");
    },
    onError: (error) => toast.error("Couldn't create invitation", { description: error instanceof Error ? error.message : undefined }),
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  const handleClose = (next: boolean) => {
    if (!next) {
      reset();
      setCreated(null);
      setCopied(false);
    }
    onOpenChange(next);
  };

  const copyLink = async () => {
    if (!created) return;
    await navigator.clipboard.writeText(invitationLink(created.token));
    setCopied(true);
    toast.success("Link copied");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Invitation ready</DialogTitle>
              <DialogDescription>Send this link to {created.email} — it expires in 14 days.</DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 rounded-card border border-line bg-secondary/40 p-2">
              <code className="flex-1 overflow-x-auto text-13 whitespace-nowrap">{invitationLink(created.token)}</code>
              <Button type="button" size="icon-sm" variant="outline" aria-label="Copy invitation link" onClick={() => void copyLink()}>
                {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Invite someone</DialogTitle>
              <DialogDescription>They'll set their own name and password from the link you send them.</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="invite-email">Email</Label>
                <Input id="invite-email" type="email" {...register("email")} />
                {errors.email ? <p className="text-13 text-status-critical">{errors.email.message}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-role">Role</Label>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="invite-role" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="ranch_manager">Ranch manager</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role ? <p className="text-13 text-status-critical">{errors.role.message}</p> : null}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={mutation.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Creating…" : "Create invitation"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
