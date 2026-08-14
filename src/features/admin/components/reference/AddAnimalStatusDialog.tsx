import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAnimalStatus } from "../../api";
import { newAnimalStatusSchema, type NewAnimalStatusFormValues } from "../../schema";

interface AddAnimalStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAnimalStatusDialog({ open, onOpenChange }: AddAnimalStatusDialogProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NewAnimalStatusFormValues>({
    resolver: zodResolver(newAnimalStatusSchema),
    defaultValues: { name: "", isActiveStatus: true },
  });

  const mutation = useMutation({
    mutationFn: (values: NewAnimalStatusFormValues) => {
      if (!profile) throw new Error("Not signed in");
      return createAnimalStatus(profile.orgId, values);
    },
    onSuccess: () => {
      if (profile) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.admin.animalStatuses(profile.orgId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.animals.filterOptions(profile.orgId) });
      }
      toast.success("Status added");
      reset();
      onOpenChange(false);
    },
    onError: (error) => toast.error("Couldn't add status", { description: error instanceof Error ? error.message : undefined }),
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a status</DialogTitle>
          <DialogDescription>An "active" status counts toward the herd total; others (sold, deceased…) don't.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="status-name">Name</Label>
            <Input id="status-name" {...register("name")} />
            {errors.name ? <p className="text-13 text-status-critical">{errors.name.message}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="status-active"
              checked={watch("isActiveStatus")}
              onCheckedChange={(checked) => setValue("isActiveStatus", checked === true)}
            />
            <Label htmlFor="status-active" className="font-normal">
              Counts as an active animal
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding…" : "Add status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
