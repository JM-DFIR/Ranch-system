import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCareActivityTypeDetailed } from "../../api";
import { newCareActivityTypeSchema, type NewCareActivityTypeFormValues } from "../../schema";

interface AddCareActivityTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCareActivityTypeDialog({ open, onOpenChange }: AddCareActivityTypeDialogProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewCareActivityTypeFormValues>({
    resolver: zodResolver(newCareActivityTypeSchema),
    defaultValues: { name: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: NewCareActivityTypeFormValues) => {
      if (!profile) throw new Error("Not signed in");
      return createCareActivityTypeDetailed(profile.orgId, values);
    },
    onSuccess: () => {
      if (profile) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.admin.careActivityTypes(profile.orgId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.feeding.careActivityTypeOptions(profile.orgId) });
      }
      toast.success("Care activity type added");
      reset();
      onOpenChange(false);
    },
    onError: (error) => toast.error("Couldn't add activity type", { description: error instanceof Error ? error.message : undefined }),
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a care activity type</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="care-activity-name">Name</Label>
            <Input id="care-activity-name" {...register("name")} />
            {errors.name ? <p className="text-13 text-status-critical">{errors.name.message}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding…" : "Add activity type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
