import { useState } from "react";
import { Download, Syringe, Stethoscope, Scale, ArrowRightLeft, RefreshCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RecordVaccinationDrawer } from "@/features/health/components/RecordVaccinationDrawer";
import { RecordTreatmentDrawer } from "@/features/health/components/RecordTreatmentDrawer";
import { RecordWeightDrawer } from "@/features/weights/components/RecordWeightDrawer";
import type { AnimalRegisterRow } from "../api";

interface BulkAction {
  label: string;
  icon: typeof Download;
  /** Undefined = the record flow doesn't exist yet (later session) — renders disabled, not hidden. */
  onSelect?: (rows: AnimalRegisterRow[]) => void;
}

function exportCsv(rows: AnimalRegisterRow[]) {
  const headers = ["Tag", "Name", "Species", "Breed", "Sex", "Ranch", "Section", "Status", "Last event"];
  const lines = rows.map((r) =>
    [r.tagNumber, r.name ?? "", r.speciesName ?? "", r.breedName ?? "", r.sex, r.ranchName, r.sectionName ?? "", r.statusName, r.lastEventDate ?? ""]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(","),
  );
  const csv = [headers.join(","), ...lines].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `animals-export-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

interface BulkActionBarProps {
  selectedRows: AnimalRegisterRow[];
  onClearSelection: () => void;
}

// Record vaccination (Session 6), treatment and weight (Session 8) are
// all real now. Transfer/Change status still depend on the movements
// module (M4) — listed per spec so the bar's shape is locked, wired for
// real as each lands, same pattern as the sidebar's "Soon" nav items
// (Session 2).
export function BulkActionBar({ selectedRows, onClearSelection }: BulkActionBarProps) {
  const [recordVaccinationOpen, setRecordVaccinationOpen] = useState(false);
  const [recordTreatmentOpen, setRecordTreatmentOpen] = useState(false);
  const [recordWeightOpen, setRecordWeightOpen] = useState(false);

  const actions: BulkAction[] = [
    { label: "Record vaccination", icon: Syringe, onSelect: () => setRecordVaccinationOpen(true) },
    { label: "Record treatment", icon: Stethoscope, onSelect: () => setRecordTreatmentOpen(true) },
    { label: "Record weight", icon: Scale, onSelect: () => setRecordWeightOpen(true) },
    { label: "Transfer", icon: ArrowRightLeft },
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
    </>
  );
}
