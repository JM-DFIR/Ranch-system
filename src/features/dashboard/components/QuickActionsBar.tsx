import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRightLeft, Baby, Heart, Pill, ScanLine, Scale, Skull, Stethoscope, Syringe, type LucideIcon } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { RecordVaccinationDrawer } from "@/features/health/components/RecordVaccinationDrawer";
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
// than guessed silently). Only two open a real drawer today — Add
// animal (Enrollment Mode, Session 5b) and Record vaccination (Session
// 6). The other seven need "record X" flows that don't exist until
// later sessions (M3/M4 per blueprint.md Part 7) and render disabled
// with the same "Coming in a later session" convention EmptyState and
// ProfileHeader already use, rather than a button that does nothing.
export function QuickActionsBar({ ranch }: QuickActionsBarProps) {
  const { profile } = useAuth();
  const [recordVaccinationOpen, setRecordVaccinationOpen] = useState(false);
  const { data: searchableAnimals } = useAnimalSearchOptions(profile?.orgId, ranch);

  const actions: QuickAction[] = [
    { label: "Add animal", icon: ScanLine, to: "/enroll" },
    { label: "Record vaccination", icon: Syringe, onClick: () => setRecordVaccinationOpen(true) },
    { label: "Record treatment", icon: Pill },
    { label: "Record weight", icon: Scale },
    { label: "Record movement", icon: ArrowRightLeft },
    { label: "Record death", icon: Skull },
    { label: "Record breeding event", icon: Heart },
    { label: "Record birth", icon: Baby },
    { label: "Record vet visit", icon: Stethoscope },
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
    </>
  );
}
