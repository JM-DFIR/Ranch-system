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
import { createFeedItemDetailed } from "../../api";
import { newFeedItemSchema, type NewFeedItemFormValues } from "../../schema";

interface AddFeedItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddFeedItemDialog({ open, onOpenChange }: AddFeedItemDialogProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewFeedItemFormValues>({
    resolver: zodResolver(newFeedItemSchema),
    defaultValues: { name: "", unit: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: NewFeedItemFormValues) => {
      if (!profile) throw new Error("Not signed in");
      return createFeedItemDetailed(profile.orgId, values);
    },
    onSuccess: () => {
      if (profile) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.admin.feedItems(profile.orgId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.feeding.feedItemOptions(profile.orgId) });
      }
      toast.success("Feed item added");
      reset();
      onOpenChange(false);
    },
    onError: (error) => toast.error("Couldn't add feed item", { description: error instanceof Error ? error.message : undefined }),
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a feed item</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="feed-name">Name</Label>
            <Input id="feed-name" {...register("name")} />
            {errors.name ? <p className="text-13 text-status-critical">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="feed-unit">Unit</Label>
            <Input id="feed-unit" placeholder="e.g. kg, bales" {...register("unit")} />
            {errors.unit ? <p className="text-13 text-status-critical">{errors.unit.message}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding…" : "Add feed item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
