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
import { createMedicationDetailed } from "../../api";
import { newMedicationSchema, type NewMedicationFormValues } from "../../schema";

interface AddMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMedicationDialog({ open, onOpenChange }: AddMedicationDialogProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewMedicationFormValues>({
    resolver: zodResolver(newMedicationSchema),
    defaultValues: { name: "", activeIngredient: "", defaultWithdrawalDays: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: NewMedicationFormValues) => {
      if (!profile) throw new Error("Not signed in");
      return createMedicationDetailed(profile.orgId, values);
    },
    onSuccess: () => {
      if (profile) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.admin.medications(profile.orgId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.health.medicationOptions(profile.orgId) });
      }
      toast.success("Medication added");
      reset();
      onOpenChange(false);
    },
    onError: (error) => toast.error("Couldn't add medication", { description: error instanceof Error ? error.message : undefined }),
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a medication</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="medication-name">Name</Label>
            <Input id="medication-name" {...register("name")} />
            {errors.name ? <p className="text-13 text-status-critical">{errors.name.message}</p> : null}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="medication-ingredient">Active ingredient</Label>
              <Input id="medication-ingredient" {...register("activeIngredient")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="medication-withdrawal">Withdrawal (days)</Label>
              <Input id="medication-withdrawal" type="number" min={0} {...register("defaultWithdrawalDays")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding…" : "Add medication"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
