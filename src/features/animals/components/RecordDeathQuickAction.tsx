import { useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/patterns/Combobox";
import { RecordDeathDialog } from "./RecordDeathDialog";

interface AnimalOption {
  id: string;
  tagNumber: string;
}

interface RecordDeathQuickActionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  searchableAnimals: AnimalOption[];
}

// Record death has no `preselectedAnimals`/searchable-multi-select
// shape like the record-drawer pattern — it's deliberately
// single-animal only (record_death() takes one p_animal_id, and
// CLAUDE.md's own confirm-dialog example is singular: "Record the
// death of goat GP-0447?"). This is the dashboard quick-action's free-
// pick entry point: a small "which animal?" step in front of the real
// RecordDeathDialog (already built in Session 4 for the profile's own
// entry point), rather than teaching that dialog a second selection UI.
export function RecordDeathQuickAction({ open, onOpenChange, orgId, searchableAnimals }: RecordDeathQuickActionProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selected = searchableAnimals.find((a) => a.id === selectedId);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) setSelectedId(undefined);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record a death</DialogTitle>
            <DialogDescription>Which animal?</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Animal</Label>
            <Combobox
              options={searchableAnimals.map((a) => ({ value: a.id, label: a.tagNumber }))}
              value={selectedId}
              onChange={setSelectedId}
              placeholder="Search by tag number…"
              searchPlaceholder="Search animals…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!selected}
              onClick={() => {
                onOpenChange(false);
                setConfirmOpen(true);
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selected ? (
        <RecordDeathDialog
          open={confirmOpen}
          onOpenChange={(next) => {
            setConfirmOpen(next);
            if (!next) setSelectedId(undefined);
          }}
          animal={{ id: selected.id, orgId, tagNumber: selected.tagNumber }}
        />
      ) : null}
    </>
  );
}
