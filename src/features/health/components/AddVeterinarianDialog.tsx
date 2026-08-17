import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createVeterinarianDetailed } from "../api";
import { newVeterinarianSchema } from "../schema";

interface AddVeterinarianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// A small dialog rather than the full RecordDrawer pattern — this adds
// one reference-catalogue row (org-wide, any member can write per
// 0021_reference_catalogue_manager_write.sql), not an event on an
// animal, same distinction ChangeStatusDialog already draws.
export function AddVeterinarianDialog({ open, onOpenChange }: AddVeterinarianDialogProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(newVeterinarianSchema),
    defaultValues: { name: "", practice: "", phone: "", email: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: { name: string; practice?: string; phone?: string; email?: string }) => {
      if (!profile) throw new Error("Not signed in");
      return createVeterinarianDetailed(profile.orgId, values);
    },
    onSuccess: () => {
      if (profile) void queryClient.invalidateQueries({ queryKey: queryKeys.health.veterinarianDirectory(profile.orgId) });
      if (profile) void queryClient.invalidateQueries({ queryKey: queryKeys.health.veterinarianOptions(profile.orgId) });
      toast.success("Veterinarian added");
      reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Couldn't add veterinarian", { description: error instanceof Error ? error.message : undefined });
    },
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a veterinarian</DialogTitle>
          <DialogDescription>Added to the shared directory every ranch can use.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="vet-name">Name</Label>
            <Input id="vet-name" {...register("name")} />
            {errors.name ? <p className="text-13 text-status-critical">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vet-practice">Practice</Label>
            <Input id="vet-practice" {...register("practice")} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vet-phone">Phone</Label>
              <Input id="vet-phone" {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vet-email">Email</Label>
              <Input id="vet-email" type="email" {...register("email")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding…" : "Add veterinarian"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
