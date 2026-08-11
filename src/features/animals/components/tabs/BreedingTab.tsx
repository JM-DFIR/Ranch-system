import { formatDate } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBirths, useBreedingEvents } from "@/features/breeding/hooks";
import { RecordSection } from "../RecordSection";

interface BreedingTabProps {
  animalId: string;
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
export function BreedingTab({ animalId, sex }: BreedingTabProps) {
  const { data: events, isLoading: eventsLoading } = useBreedingEvents(animalId);
  const { data: births, isLoading: birthsLoading } = useBirths(animalId);

  const emptyMessage =
    sex === "male"
      ? "Breeding events are recorded on the dam's profile, not the sire's."
      : "No breeding events recorded yet.";

  return (
    <div className="flex flex-col gap-4">
      <RecordSection
        title="Breeding events"
        recordActionLabel="Record breeding"
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </RecordSection>

      <RecordSection
        title="Births"
        recordActionLabel="Record birth"
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
    </div>
  );
}
