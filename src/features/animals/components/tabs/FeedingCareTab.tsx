import { formatDate } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCareActivities, useFeedingRecords } from "@/features/feeding/hooks";
import { RecordSection } from "../RecordSection";

interface FeedingCareTabProps {
  animalId: string;
}

export function FeedingCareTab({ animalId }: FeedingCareTabProps) {
  const { data: feedingRecords, isLoading: feedingLoading } = useFeedingRecords(animalId);
  const { data: careActivities, isLoading: careLoading } = useCareActivities(animalId);

  return (
    <div className="flex flex-col gap-4">
      <RecordSection
        title="Feeding log"
        recordActionLabel="Log feeding"
        isLoading={feedingLoading}
        isEmpty={!feedingRecords?.length}
        emptyMessage="No individual feeding records for this animal — check the ranch's feeding log for ranch-wide entries."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Feed</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedingRecords?.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-mono tabular-nums">{formatDate(f.feedDate)}</TableCell>
                <TableCell>{f.feedItemName}</TableCell>
                <TableCell className="font-mono tabular-nums">
                  {f.quantity} {f.unit}
                </TableCell>
                <TableCell>{f.notes ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </RecordSection>

      <RecordSection
        title="Care activities"
        recordActionLabel="Log care activity"
        isLoading={careLoading}
        isEmpty={!careActivities?.length}
        emptyMessage="No care activities recorded yet."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Performed by</TableHead>
              <TableHead>Next due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {careActivities?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono tabular-nums">{formatDate(c.activityDate)}</TableCell>
                <TableCell>{c.activityTypeName}</TableCell>
                <TableCell>{c.product ?? "—"}</TableCell>
                <TableCell>{c.performedByName ?? "—"}</TableCell>
                <TableCell className="font-mono tabular-nums">{c.nextDueDate ? formatDate(c.nextDueDate) : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </RecordSection>
    </div>
  );
}
