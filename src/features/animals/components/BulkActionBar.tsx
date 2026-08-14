import { useState } from "react";
import { Download, Syringe, Stethoscope, Scale, ArrowRightLeft, RefreshCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/csv";
import { RecordVaccinationDrawer } from "@/features/health/components/RecordVaccinationDrawer";
import { RecordTreatmentDrawer } from "@/features/health/components/RecordTreatmentDrawer";
import { RecordWeightDrawer } from "@/features/weights/components/RecordWeightDrawer";
import { RecordTransferDrawer } from "@/features/movements/components/RecordTransferDrawer";
import type { AnimalRegisterRow } from "../api";

interface BulkAction {
  label: string;
  icon: typeof Download;
  /** Undefined = the record flow doesn't exist yet (later session) — renders disabled, not hidden. */
  onSelect?: (rows: AnimalRegisterRow[]) => void;
}

function exportCsv(rows: AnimalRegisterRow[]) {
  const headers = ["Tag", "Name", "Species", "Breed", "Sex", "Ranch", "Section", "Status", "Last event"];
  const lines = rows.map((r) => [
    r.tagNumber,
    r.name ?? "",
    r.speciesName ?? "",
    r.breedName ?? "",
    r.sex,
    r.ranchName,
    r.sectionName ?? "",
    r.statusName,
    r.lastEventDate ?? "",
  ]);
  downloadCsv(`animals-export-${new Date().toISOString().slice(0, 10)}.csv`, headers, lines);
}

interface BulkActionBarProps {
  selectedRows: AnimalRegisterRow[];
  onClearSelection: () => void;
}

// Record vaccination (Session 6), treatment/weight (Session 8) and
// Transfer (M4) are all real now. Change status still has no bulk path
// — it's a plain field update today (ChangeStatusDialog, Session 4),
// single-animal only from the profile; a bulk version is its own,
// separate piece of work, not part of movements/mortality/breeding.
export function BulkActionBar({ selectedRows, onClearSelection }: BulkActionBarProps) {
  const [recordVaccinationOpen, setRecordVaccinationOpen] = useState(false);
  const [recordTreatmentOpen, setRecordTreatmentOpen] = useState(false);
  const [recordWeightOpen, setRecordWeightOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const actions: BulkAction[] = [
    { label: "Record vaccination", icon: Syringe, onSelect: () => setRecordVaccinationOpen(true) },
    { label: "Record treatment", icon: Stethoscope, onSelect: () => setRecordTreatmentOpen(true) },
    { label: "Record weight", icon: Scale, onSelect: () => setRecordWeightOpen(true) },
    { label: "Transfer", icon: ArrowRightLeft, onSelect: () => setTransferOpen(true) },
    { label: "Change status", icon: RefreshCcw },
    { label: "Export", icon: Download, onSelect: exportCsv },
  ];

  if (selectedRows.length === 0) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
        <div className="flex items-center gap-2 rounded-card border border-line bg-card px-4 py-2.5 shadow-lg">
          <span className="text-14 font-medium whitespace-nowrap">
            {selectedRows.length} {selectedRows.length === 1 ? "animal" : "animals"} selected
          </span>
          <div className="mx-1 h-5 w-px bg-line" aria-hidden />
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              size="sm"
              disabled={!action.onSelect}
              title={action.onSelect ? undefined : "Coming in a later session"}
              onClick={() => action.onSelect?.(selectedRows)}
              className="gap-1.5"
            >
              <action.icon className="size-3.5" aria-hidden />
              {action.label}
            </Button>
          ))}
          <div className="mx-1 h-5 w-px bg-line" aria-hidden />
          <Button variant="ghost" size="icon-sm" onClick={onClearSelection} aria-label="Clear selection">
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      <RecordVaccinationDrawer
        open={recordVaccinationOpen}
        onOpenChange={setRecordVaccinationOpen}
        preselectedAnimals={selectedRows.map((r) => ({ id: r.id, tagNumber: r.tagNumber, speciesId: r.speciesId }))}
      />
      <RecordTreatmentDrawer
        open={recordTreatmentOpen}
        onOpenChange={setRecordTreatmentOpen}
        preselectedAnimals={selectedRows.map((r) => ({ id: r.id, tagNumber: r.tagNumber }))}
      />
      <RecordWeightDrawer
        open={recordWeightOpen}
        onOpenChange={setRecordWeightOpen}
        preselectedAnimals={selectedRows.map((r) => ({ id: r.id, tagNumber: r.tagNumber }))}
      />
      <RecordTransferDrawer
        open={transferOpen}
        onOpenChange={setTransferOpen}
        preselectedAnimals={selectedRows.map((r) => ({ id: r.id, tagNumber: r.tagNumber }))}
      />
    </>
  );
}
