import { TriangleAlert } from "lucide-react";

import { formatDate } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIllnesses, useTreatments, useVaccinations, useVetVisits } from "@/features/health/hooks";
import { RecordSection } from "../RecordSection";

interface HealthTabProps {
  animalId: string;
}

export function HealthTab({ animalId }: HealthTabProps) {
  const { data: vaccinations, isLoading: vaccinationsLoading } = useVaccinations(animalId);
  const { data: treatments, isLoading: treatmentsLoading } = useTreatments(animalId);
  const { data: illnesses, isLoading: illnessesLoading } = useIllnesses(animalId);
  const { data: vetVisits, isLoading: vetVisitsLoading } = useVetVisits(animalId);

  const activeWithdrawal = treatments?.find(
    (t) => t.withdrawalUntil && new Date(t.withdrawalUntil) >= new Date(new Date().toDateString()),
  );

  return (
    <div className="flex flex-col gap-4">
      {activeWithdrawal ? (
        <div className="flex items-center gap-2 rounded-card border border-status-warn/25 bg-status-warn/10 px-4 py-3 text-14 text-status-warn">
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          Not for sale or slaughter until {formatDate(activeWithdrawal.withdrawalUntil ?? "")}.
        </div>
      ) : null}

      <RecordSection
        title="Vaccinations"
        recordActionLabel="Record vaccination"
        isLoading={vaccinationsLoading}
        isEmpty={!vaccinations?.length}
        emptyMessage="No vaccinations recorded yet."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vaccine</TableHead>
              <TableHead>Dose</TableHead>
              <TableHead>Administered by</TableHead>
              <TableHead>Next due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vaccinations?.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono tabular-nums">{formatDate(v.dateAdministered)}</TableCell>
                <TableCell>{v.vaccineName}</TableCell>
                <TableCell>{v.dose ?? "—"}</TableCell>
                <TableCell>{v.administeredByName ?? v.veterinarianName ?? "—"}</TableCell>
                <TableCell className="font-mono tabular-nums">{v.nextDueDate ? formatDate(v.nextDueDate) : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </RecordSection>

      <RecordSection
        title="Treatments"
        recordActionLabel="Record treatment"
        isLoading={treatmentsLoading}
        isEmpty={!treatments?.length}
        emptyMessage="No treatments recorded yet."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Medication</TableHead>
              <TableHead>Dosage</TableHead>
              <TableHead>Withdrawal until</TableHead>
              <TableHead>Outcome</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {treatments?.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono tabular-nums">{formatDate(t.treatmentDate)}</TableCell>
                <TableCell>{t.medicationName ?? "—"}</TableCell>
                <TableCell>{t.dosage ?? "—"}</TableCell>
                <TableCell className="font-mono tabular-nums">{t.withdrawalUntil ? formatDate(t.withdrawalUntil) : "—"}</TableCell>
                <TableCell>{t.outcome ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </RecordSection>

      <RecordSection
        title="Illnesses"
        recordActionLabel="Record illness"
        isLoading={illnessesLoading}
        isEmpty={!illnesses?.length}
        emptyMessage="No illnesses recorded yet."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Onset</TableHead>
              <TableHead>Illness</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Resolved</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {illnesses?.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono tabular-nums">{formatDate(i.onsetDate)}</TableCell>
                <TableCell>{i.illnessName ?? "—"}</TableCell>
                <TableCell className="capitalize">{i.severity}</TableCell>
                <TableCell className="capitalize">{i.status.replace(/_/g, " ")}</TableCell>
                <TableCell className="font-mono tabular-nums">{i.resolvedDate ? formatDate(i.resolvedDate) : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </RecordSection>

      <RecordSection
        title="Vet visits"
        recordActionLabel="Record vet visit"
        isLoading={vetVisitsLoading}
        isEmpty={!vetVisits?.length}
        emptyMessage="No vet visits recorded yet."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Veterinarian</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Next visit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vetVisits?.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono tabular-nums">{formatDate(v.visitDate)}</TableCell>
                <TableCell>{v.veterinarianName ?? "—"}</TableCell>
                <TableCell>{v.purpose ?? "—"}</TableCell>
                <TableCell className="font-mono tabular-nums">{v.nextVisitDate ? formatDate(v.nextVisitDate) : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </RecordSection>
    </div>
  );
}
