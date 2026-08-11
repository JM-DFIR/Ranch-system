import { formatDate } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMovements } from "@/features/movements/hooks";
import { RecordSection } from "../RecordSection";

interface MovementsTabProps {
  animalId: string;
}

// No record action here — "Transfer" already lives in the profile
// header's primary actions (ProfileHeader.tsx). This tab is the read
// history; record_movement() (0017_rpc.sql) is the only write path.
export function MovementsTab({ animalId }: MovementsTabProps) {
  const { data: movements, isLoading } = useMovements(animalId);

  return (
    <RecordSection
      title="Movement history"
      isLoading={isLoading}
      isEmpty={!movements?.length}
      emptyMessage="No movements recorded yet — this animal has stayed at its enrolled ranch."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Permit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements?.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-mono tabular-nums">{formatDate(m.movementDate)}</TableCell>
              <TableCell>
                {m.fromRanchName ?? "—"}
                {m.fromSectionName ? ` · ${m.fromSectionName}` : ""}
              </TableCell>
              <TableCell>
                {m.toRanchName ?? "—"}
                {m.toSectionName ? ` · ${m.toSectionName}` : ""}
              </TableCell>
              <TableCell>{m.reason ?? "—"}</TableCell>
              <TableCell>{m.permitNumber ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </RecordSection>
  );
}
