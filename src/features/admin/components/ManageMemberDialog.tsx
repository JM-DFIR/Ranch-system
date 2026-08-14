import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { fetchRanchList } from "@/features/ranches/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { assignRanch, unassignRanch, updateProfileActive, updateProfileRole } from "../api";
import { useRanchAssignments } from "../hooks";
import type { OrgMember } from "../api";

interface ManageMemberDialogProps {
  member: OrgMember | null;
  onOpenChange: (open: boolean) => void;
}

// Users & Roles' row-click destination — role, active status and ranch
// assignments for one member, in one dialog rather than three, since an
// owner adjusting a manager typically touches more than one of these in
// the same visit. Ranch assignments only matter for a ranch_manager —
// an owner already has access to every ranch (permissions.ts).
export function ManageMemberDialog({ member, onOpenChange }: ManageMemberDialogProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const isSelf = !!member && member.id === profile?.id;

  const { data: assignments, isLoading: assignmentsLoading } = useRanchAssignments(member?.id);
  const { data: ranchOptions } = useQuery({
    queryKey: queryKeys.ranches.list(profile?.orgId ?? ""),
    queryFn: fetchRanchList,
    enabled: !!profile?.orgId && member?.role === "ranch_manager",
  });

  const invalidateMember = () => {
    if (!profile) return;
    void queryClient.invalidateQueries({ queryKey: ["admin", profile.orgId, "members"] });
  };

  const memberId = member?.id;

  const roleMutation = useMutation({
    mutationFn: (role: "owner" | "ranch_manager") => {
      if (!memberId) throw new Error("No member selected");
      return updateProfileRole(memberId, role);
    },
    onSuccess: () => {
      invalidateMember();
      toast.success("Role updated");
    },
    onError: (error) => toast.error("Couldn't update role", { description: error instanceof Error ? error.message : undefined }),
  });

  const activeMutation = useMutation({
    mutationFn: (isActive: boolean) => {
      if (!memberId) throw new Error("No member selected");
      return updateProfileActive(memberId, isActive);
    },
    onSuccess: (_data, isActive) => {
      invalidateMember();
      toast.success(isActive ? "Account reactivated" : "Account deactivated");
    },
    onError: (error) => toast.error("Couldn't update status", { description: error instanceof Error ? error.message : undefined }),
  });

  const assignMutation = useMutation({
    mutationFn: (ranchId: string) => {
      if (!profile || !memberId) throw new Error("Not signed in");
      return assignRanch(profile.orgId, ranchId, memberId);
    },
    onSuccess: () => {
      if (memberId) void queryClient.invalidateQueries({ queryKey: queryKeys.admin.ranchAssignments(memberId) });
      invalidateMember();
      toast.success("Ranch assigned");
    },
    onError: (error) => toast.error("Couldn't assign ranch", { description: error instanceof Error ? error.message : undefined }),
  });

  const unassignMutation = useMutation({
    mutationFn: (assignmentId: string) => unassignRanch(assignmentId),
    onSuccess: () => {
      if (memberId) void queryClient.invalidateQueries({ queryKey: queryKeys.admin.ranchAssignments(memberId) });
      invalidateMember();
      toast.success("Ranch unassigned");
    },
    onError: (error) => toast.error("Couldn't unassign ranch", { description: error instanceof Error ? error.message : undefined }),
  });

  if (!member) return null;

  const unassignedRanches = (ranchOptions ?? []).filter((r) => !(assignments ?? []).some((a) => a.ranchId === r.id));

  return (
    <Dialog open={!!member} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member.fullName}</DialogTitle>
          <DialogDescription>{member.email}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {isSelf ? (
            <p className="rounded-card border border-line bg-secondary/40 px-3 py-2 text-13 text-muted-foreground">
              You can't change your own role or status here — ask another owner.
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="member-role">Role</Label>
            <Select
              value={member.role}
              disabled={isSelf || roleMutation.isPending}
              onValueChange={(v) => roleMutation.mutate(v as "owner" | "ranch_manager")}
            >
              <SelectTrigger id="member-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="ranch_manager">Ranch manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="member-active"
              checked={member.isActive}
              disabled={isSelf || activeMutation.isPending}
              onCheckedChange={(checked) => activeMutation.mutate(checked === true)}
            />
            <Label htmlFor="member-active" className="font-normal">
              Active — can sign in and record activity
            </Label>
          </div>

          {member.role === "ranch_manager" ? (
            <div className="space-y-1.5">
              <Label>Ranch assignments</Label>
              {assignmentsLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex flex-col gap-1.5">
                  {(assignments ?? []).length === 0 ? (
                    <p className="text-13 text-muted-foreground">Not assigned to any ranch yet.</p>
                  ) : (
                    (assignments ?? []).map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded-card border border-line px-3 py-1.5">
                        <span className="text-14">{a.ranchName}</span>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Unassign ${a.ranchName}`}
                          disabled={unassignMutation.isPending}
                          onClick={() => unassignMutation.mutate(a.id)}
                        >
                          <X className="size-3.5" aria-hidden />
                        </Button>
                      </div>
                    ))
                  )}
                  {unassignedRanches.length > 0 ? (
                    <Select
                      value=""
                      disabled={assignMutation.isPending}
                      onValueChange={(ranchId) => assignMutation.mutate(ranchId)}
                    >
                      <SelectTrigger className="mt-1 w-full">
                        <Plus className="size-3.5" aria-hidden />
                        <SelectValue placeholder="Assign to a ranch…" />
                      </SelectTrigger>
                      <SelectContent>
                        {unassignedRanches.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
