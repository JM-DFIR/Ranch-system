import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRightLeft, Baby, Heart, Pill, ScanLine, Scale, Skull, Stethoscope, Syringe, type LucideIcon } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { RecordVaccinationDrawer } from "@/features/health/components/RecordVaccinationDrawer";
import { RecordTreatmentDrawer } from "@/features/health/components/RecordTreatmentDrawer";
import { RecordVetVisitDrawer } from "@/features/health/components/RecordVetVisitDrawer";
import { RecordWeightDrawer } from "@/features/weights/components/RecordWeightDrawer";
import { RecordTransferDrawer } from "@/features/movements/components/RecordTransferDrawer";
import { RecordDeathQuickAction } from "@/features/animals/components/RecordDeathQuickAction";
import { RecordBreedingDrawer } from "@/features/breeding/components/RecordBreedingDrawer";
import { RecordBirthDrawer } from "@/features/breeding/components/RecordBirthDrawer";
import { useAnimalSearchOptions } from "../hooks";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  to?: "/enroll";
}

interface QuickActionsBarProps {
  ranch: string | undefined;
}

// The persistent Quick Actions bar (session-pack.md, Session 7) — the
// nine actions reconstructed from the modules already scoped in
// blueprint.md Part 4 (the client PRD's own §7.2 list isn't reproduced
// anywhere in this repo; confirmed with the client 2026-08-12 rather
// than guessed silently). All nine now open a real drawer (Sessions 6,
// 8, and M4). Breeding event/birth offer only female animals in their
// free-pick list — breeding_events.dam_id and births.dam_id are both
// females-only by the schema's own design.
export function QuickActionsBar({ ranch }: QuickActionsBarProps) {
  const { profile } = useAuth();
  const [recordVaccinationOpen, setRecordVaccinationOpen] = useState(false);
  const [recordTreatmentOpen, setRecordTreatmentOpen] = useState(false);
  const [recordWeightOpen, setRecordWeightOpen] = useState(false);
  const [recordVetVisitOpen, setRecordVetVisitOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [recordDeathOpen, setRecordDeathOpen] = useState(false);
  const [recordBreedingOpen, setRecordBreedingOpen] = useState(false);
  const [recordBirthOpen, setRecordBirthOpen] = useState(false);
  const { data: searchableAnimals } = useAnimalSearchOptions(profile?.orgId, ranch);
  const femaleAnimals = (searchableAnimals ?? []).filter((a) => a.sex === "female");

  const actions: QuickAction[] = [
    { label: "Add animal", icon: ScanLine, to: "/enroll" },
    { label: "Record vaccination", icon: Syringe, onClick: () => setRecordVaccinationOpen(true) },
    { label: "Record treatment", icon: Pill, onClick: () => setRecordTreatmentOpen(true) },
    { label: "Record weight", icon: Scale, onClick: () => setRecordWeightOpen(true) },
    { label: "Record movement", icon: ArrowRightLeft, onClick: () => setTransferOpen(true) },
    { label: "Record death", icon: Skull, onClick: () => setRecordDeathOpen(true) },
    { label: "Record breeding event", icon: Heart, onClick: () => setRecordBreedingOpen(true) },
    { label: "Record birth", icon: Baby, onClick: () => setRecordBirthOpen(true) },
    { label: "Record vet visit", icon: Stethoscope, onClick: () => setRecordVetVisitOpen(true) },
  ];

  return (
    <>
      <div className="flex gap-2 overflow-x-auto rounded-card border border-line bg-card p-3">
        {actions.map((action) => {
          const Icon = action.icon;
          if (action.to) {
            return (
              <Button key={action.label} variant="outline" size="sm" className="shrink-0 gap-1.5" asChild>
                <Link to={action.to} search={{ ranch }}>
                  <Icon aria-hidden />
                  {action.label}
                </Link>
              </Button>
            );
          }
          return (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              disabled={!action.onClick}
              title={action.onClick ? undefined : "Coming in a later session"}
              onClick={action.onClick}
            >
              <Icon aria-hidden />
              {action.label}
            </Button>
          );
        })}
      </div>
      <RecordVaccinationDrawer
        open={recordVaccinationOpen}
        onOpenChange={setRecordVaccinationOpen}
        searchableAnimals={searchableAnimals ?? []}
      />
      <RecordTreatmentDrawer
        open={recordTreatmentOpen}
        onOpenChange={setRecordTreatmentOpen}
        searchableAnimals={searchableAnimals ?? []}
      />
      <RecordVetVisitDrawer
        open={recordVetVisitOpen}
        onOpenChange={setRecordVetVisitOpen}
        searchableAnimals={searchableAnimals ?? []}
      />
      <RecordWeightDrawer
        open={recordWeightOpen}
        onOpenChange={setRecordWeightOpen}
        searchableAnimals={searchableAnimals ?? []}
      />
      <RecordTransferDrawer
        open={transferOpen}
        onOpenChange={setTransferOpen}
        searchableAnimals={searchableAnimals ?? []}
      />
      {profile?.orgId ? (
        <RecordDeathQuickAction
          open={recordDeathOpen}
          onOpenChange={setRecordDeathOpen}
          orgId={profile.orgId}
          searchableAnimals={searchableAnimals ?? []}
        />
      ) : null}
      <RecordBreedingDrawer
        open={recordBreedingOpen}
        onOpenChange={setRecordBreedingOpen}
        searchableAnimals={femaleAnimals}
      />
      <RecordBirthDrawer
        open={recordBirthOpen}
        onOpenChange={setRecordBirthOpen}
        searchableAnimals={femaleAnimals}
      />
    </>
  );
}
