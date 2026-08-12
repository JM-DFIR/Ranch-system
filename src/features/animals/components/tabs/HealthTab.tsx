import { useState } from "react";
import { TriangleAlert } from "lucide-react";

import { formatDate } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIllnesses, useTreatments, useVaccinations, useVetVisits } from "@/features/health/hooks";
import { RecordVaccinationDrawer } from "@/features/health/components/RecordVaccinationDrawer";
import { RecordTreatmentDrawer } from "@/features/health/components/RecordTreatmentDrawer";
import { RecordIllnessDrawer } from "@/features/health/components/RecordIllnessDrawer";
import { RecordVetVisitDrawer } from "@/features/health/components/RecordVetVisitDrawer";
import { useAnimalProfile } from "../../hooks";
import { RecordSection } from "../RecordSection";

interface HealthTabProps {
  animalId: string;
}

export function HealthTab({ animalId }: HealthTabProps) {
  const { data: animal } = useAnimalProfile(animalId);
  const { data: vaccinations, isLoading: vaccinationsLoading } = useVaccinations(animalId);
  const { data: treatments, isLoading: treatmentsLoading } = useTreatments(animalId);
  const { data: illnesses, isLoading: illnessesLoading } = useIllnesses(animalId);
  const { data: vetVisits, isLoading: vetVisitsLoading } = useVetVisits(animalId);

  const [recordVaccinationOpen, setRecordVaccinationOpen] = useState(false);
  const [recordTreatmentOpen, setRecordTreatmentOpen] = useState(false);
  const [recordIllnessOpen, setRecordIllnessOpen] = useState(false);
  const [recordVetVisitOpen, setRecordVetVisitOpen] = useState(false);

  const activeWithdrawal = treatments?.find(
    (t) => t.withdrawalUntil && new Date(t.withdrawalUntil) >= new Date(new Date().toDateString()),
  );

  const preselected = animal ? [{ id: animal.id, tagNumber: animal.tagNumber, speciesId: animal.speciesId }] : undefined;

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
        onRecordAction={() => setRecordVaccinationOpen(true)}
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
        onRecordAction={() => setRecordTreatmentOpen(true)}
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
        onRecordAction={() => setRecordIllnessOpen(true)}
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
        onRecordAction={() => setRecordVetVisitOpen(true)}
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

      <RecordVaccinationDrawer open={recordVaccinationOpen} onOpenChange={setRecordVaccinationOpen} preselectedAnimals={preselected} />
      <RecordTreatmentDrawer open={recordTreatmentOpen} onOpenChange={setRecordTreatmentOpen} preselectedAnimals={preselected} />
      <RecordIllnessDrawer open={recordIllnessOpen} onOpenChange={setRecordIllnessOpen} preselectedAnimals={preselected} />
      <RecordVetVisitDrawer open={recordVetVisitOpen} onOpenChange={setRecordVetVisitOpen} preselectedAnimals={preselected} />
    </div>
  );
}
