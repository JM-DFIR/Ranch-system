import { useState } from "react";

import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBirths, useBreedingEvents } from "@/features/breeding/hooks";
import { RecordBreedingDrawer } from "@/features/breeding/components/RecordBreedingDrawer";
import { RecordBirthDrawer } from "@/features/breeding/components/RecordBirthDrawer";
import { RecordPregnancyCheckDialog } from "@/features/breeding/components/RecordPregnancyCheckDialog";
import { RecordSection } from "../RecordSection";

interface BreedingTabProps {
  animalId: string;
  tagNumber: string;
  sex: string;
}

function formatDueDate(event: { expectedDueDate: string | null; expectedDueWindowStart: string | null; expectedDueWindowEnd: string | null }) {
  if (event.expectedDueDate) return formatDate(event.expectedDueDate);
  if (event.expectedDueWindowStart) {
    return `${formatDate(event.expectedDueWindowStart)}${event.expectedDueWindowEnd ? ` – ${formatDate(event.expectedDueWindowEnd)}` : ""}`;
  }
  return "—";
}

// Breeding events are recorded against the dam (breeding_events.dam_id
// is not null; sire_id is optional — 0009_breeding.sql), so a male
// animal's profile shows an empty state here rather than the events he
// sired on other dams' profiles — those are each dam's own record, not
// his.
export function BreedingTab({ animalId, tagNumber, sex }: BreedingTabProps) {
  const { data: events, isLoading: eventsLoading } = useBreedingEvents(animalId);
  const { data: births, isLoading: birthsLoading } = useBirths(animalId);
  const [recordBreedingOpen, setRecordBreedingOpen] = useState(false);
  const [recordBirthOpen, setRecordBirthOpen] = useState(false);
  const [checkEventId, setCheckEventId] = useState<string | null>(null);

  const emptyMessage =
    sex === "male"
      ? "Breeding events are recorded on the dam's profile, not the sire's."
      : "No breeding events recorded yet.";

  return (
    <div className="flex flex-col gap-4">
      <RecordSection
        title="Breeding events"
        recordActionLabel="Record breeding"
        onRecordAction={sex === "female" ? () => setRecordBreedingOpen(true) : undefined}
        isLoading={eventsLoading}
        isEmpty={!events?.length}
        emptyMessage={emptyMessage}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Sire</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expected due</TableHead>
              <TableHead>Pregnancy checks</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {events?.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-mono tabular-nums">
                  {e.serviceDate ? formatDate(e.serviceDate) : e.joiningStart ? formatDate(e.joiningStart) : "—"}
                </TableCell>
                <TableCell className="capitalize">{e.method.replace(/_/g, " ")}</TableCell>
                <TableCell>{e.sireTagNumber ?? e.externalSireNote ?? "—"}</TableCell>
                <TableCell className="capitalize">{e.status.replace(/_/g, " ")}</TableCell>
                <TableCell className="font-mono tabular-nums">{formatDueDate(e)}</TableCell>
                <TableCell>
                  {e.pregnancyChecks.length > 0
                    ? e.pregnancyChecks.map((c) => `${c.result} (${formatDate(c.checkDate)})`).join(", ")
                    : "—"}
                </TableCell>
                <TableCell>
                  {e.status === "served" ? (
                    <Button size="sm" variant="ghost" onClick={() => setCheckEventId(e.id)}>
                      Record check
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </RecordSection>

      <RecordSection
        title="Births"
        recordActionLabel="Record birth"
        onRecordAction={sex === "female" ? () => setRecordBirthOpen(true) : undefined}
        isLoading={birthsLoading}
        isEmpty={!births?.length}
        emptyMessage={sex === "male" ? "Births are recorded on the dam's profile." : "No births recorded yet."}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Litter size</TableHead>
              <TableHead>Ease</TableHead>
              <TableHead>Offspring</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {births?.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-mono tabular-nums">{formatDate(b.birthDate)}</TableCell>
                <TableCell className="font-mono tabular-nums">{b.litterSize}</TableCell>
                <TableCell className="capitalize">{b.ease}</TableCell>
                <TableCell>
                  {b.offspring.map((o) => o.tagNumber).filter(Boolean).join(", ") || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </RecordSection>

      {sex === "female" ? (
        <>
          <RecordBreedingDrawer
            open={recordBreedingOpen}
            onOpenChange={setRecordBreedingOpen}
            preselectedAnimals={[{ id: animalId, tagNumber }]}
          />
          <RecordBirthDrawer open={recordBirthOpen} onOpenChange={setRecordBirthOpen} dam={{ id: animalId, tagNumber }} />
          {checkEventId ? (
            <RecordPregnancyCheckDialog
              open={!!checkEventId}
              onOpenChange={(open) => !open && setCheckEventId(null)}
              damId={animalId}
              damTagNumber={tagNumber}
              breedingEventId={checkEventId}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
