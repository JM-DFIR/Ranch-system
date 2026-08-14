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
import { createSpecies } from "../../api";
import { newSpeciesSchema, type NewSpeciesFormValues } from "../../schema";

interface AddSpeciesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSpeciesDialog({ open, onOpenChange }: AddSpeciesDialogProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewSpeciesFormValues>({
    resolver: zodResolver(newSpeciesSchema),
    defaultValues: { name: "", defaultTagPrefix: "", defaultGestationDays: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: NewSpeciesFormValues) => {
      if (!profile) throw new Error("Not signed in");
      return createSpecies(profile.orgId, values);
    },
    onSuccess: () => {
      if (profile) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.admin.species(profile.orgId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.animals.filterOptions(profile.orgId) });
      }
      toast.success("Species added");
      reset();
      onOpenChange(false);
    },
    onError: (error) => toast.error("Couldn't add species", { description: error instanceof Error ? error.message : undefined }),
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a species</DialogTitle>
          <DialogDescription>The tag prefix, if set, seeds the next-tag suggestion during enrollment.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="species-name">Name</Label>
            <Input id="species-name" {...register("name")} />
            {errors.name ? <p className="text-13 text-status-critical">{errors.name.message}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="species-prefix">Tag prefix</Label>
              <Input id="species-prefix" placeholder="e.g. MUX" {...register("defaultTagPrefix")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="species-gestation">Gestation (days)</Label>
              <Input id="species-gestation" type="number" min={1} {...register("defaultGestationDays")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding…" : "Add species"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
