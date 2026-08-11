import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnimalFilterOptions } from "../hooks";
import type { AnimalProfile } from "../api";

interface ChangeStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animal: AnimalProfile;
}

// A direct field update, not a "record X" event — animal_statuses is
// read via the same reference-data query the register's filter bar
// already uses (useAnimalFilterOptions), so this doesn't duplicate
// that fetch.
export function ChangeStatusDialog({ open, onOpenChange, animal }: ChangeStatusDialogProps) {
  const { profile } = useAuth();
  const { data: options } = useAnimalFilterOptions(profile?.orgId);
  const [statusId, setStatusId] = useState(animal.statusId);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("animals").update({ status_id: statusId }).eq("id", animal.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(animal.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.animals.all(animal.orgId) });
      const newStatusName = options?.statuses.find((s) => s.id === statusId)?.name ?? "the new status";
      toast.success(`Status changed to ${newStatusName}`);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Couldn't change status", { description: error instanceof Error ? error.message : undefined });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change status for {animal.tagNumber}?</DialogTitle>
          <DialogDescription>This updates the animal's current status immediately.</DialogDescription>
        </DialogHeader>
        <Select value={statusId} onValueChange={setStatusId}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(options?.statuses ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || statusId === animal.statusId}
          >
            Change status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
