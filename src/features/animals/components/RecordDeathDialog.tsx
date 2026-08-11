import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AnimalProfile } from "../api";

interface RecordDeathDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animal: AnimalProfile;
}

const CAUSE_SUGGESTIONS = ["Disease", "Predation", "Accident", "Old age", "Complications", "Unknown"];

// cause_category is plain freeform text in the schema (no lookup table,
// no CHECK constraint — mortalities.cause_category, 0010_movement_
// mortality.sql), same "suggest, never constrain" philosophy as tag
// numbers — a datalist of common values, not a rigid Select.
//
// Deliberately smaller than the RPC's full surface: postmortem_done and
// disposal_method stay at record_death()'s own defaults (false/null)
// for this first version rather than growing this dialog past what a
// death actually needs to be recorded — they're always editable later
// once record_death's data lands and a fuller edit path exists.
export function RecordDeathDialog({ open, onOpenChange, animal }: RecordDeathDialogProps) {
  const [dateOfDeath, setDateOfDeath] = useState(() => new Date().toISOString().slice(0, 10));
  const [causeCategory, setCauseCategory] = useState("");
  const [causeDetails, setCauseDetails] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("record_death", {
        p_animal_id: animal.id,
        p_date_of_death: dateOfDeath,
        p_cause_category: causeCategory.trim(),
        p_cause_details: causeDetails.trim() || undefined,
        p_notes: notes.trim() || undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(animal.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.animals.all(animal.orgId) });
      toast.success(`Death recorded for ${animal.tagNumber}`);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Couldn't record death", { description: error instanceof Error ? error.message : undefined });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record the death of {animal.tagNumber}?</DialogTitle>
          <DialogDescription>
            This moves {animal.tagNumber} to Deceased status. It stays fully browsable in the register's history.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="date-of-death">Date of death</Label>
            <Input
              id="date-of-death"
              type="date"
              value={dateOfDeath}
              onChange={(e) => setDateOfDeath(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cause-category">Cause</Label>
            <Input
              id="cause-category"
              list="cause-suggestions"
              value={causeCategory}
              onChange={(e) => setCauseCategory(e.target.value)}
              placeholder="e.g. Disease"
            />
            <datalist id="cause-suggestions">
              {CAUSE_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cause-details">Details (optional)</Label>
            <Textarea id="cause-details" value={causeDetails} onChange={(e) => setCauseDetails(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="death-notes">Notes (optional)</Label>
            <Textarea id="death-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !dateOfDeath || !causeCategory.trim()}
          >
            Record death
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
