import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";

import { formatDate } from "@/lib/format";
import type {
  IllnessRegisterRow,
  TreatmentRegisterRow,
  VaccinationRegisterRow,
  VetVisitRegisterRow,
} from "./api";

// Every register links its animal tag back to the profile — `data-stop-row-click`
// isn't needed here since these registers don't set an onRowClick of
// their own (unlike the animal register), so the Link is the only
// interactive element in the cell.
function AnimalTagCell({ animalId, tagNumber, animalName }: { animalId: string; tagNumber: string; animalName: string | null }) {
  return (
    <Link to="/animals/$animalId" params={{ animalId }} className="hover:underline">
      <span className="font-mono tabular-nums">{tagNumber}</span>
      {animalName ? <span className="ml-1.5 text-muted-foreground">{animalName}</span> : null}
    </Link>
  );
}

export const vaccinationRegisterColumns: ColumnDef<VaccinationRegisterRow>[] = [
  {
    accessorKey: "dateAdministered",
    id: "date",
    header: "Date",
    cell: ({ row }) => <span className="font-mono tabular-nums">{formatDate(row.original.dateAdministered)}</span>,
    enableSorting: false,
  },
  {
    id: "animal",
    header: "Animal",
    cell: ({ row }) => <AnimalTagCell animalId={row.original.animalId} tagNumber={row.original.tagNumber} animalName={row.original.animalName} />,
    enableSorting: false,
  },
  { accessorKey: "speciesName", id: "species", header: "Species", cell: ({ row }) => row.original.speciesName ?? "—", enableSorting: false },
  { accessorKey: "vaccineName", id: "vaccine", header: "Vaccine", enableSorting: false },
  { accessorKey: "dose", id: "dose", header: "Dose", cell: ({ row }) => row.original.dose ?? "—", enableSorting: false },
  {
    id: "administered_by",
    header: "Administered by",
    cell: ({ row }) => row.original.administeredByName ?? row.original.veterinarianName ?? "—",
    enableSorting: false,
  },
  {
    accessorKey: "nextDueDate",
    id: "next_due",
    header: "Next due",
    cell: ({ row }) => (row.original.nextDueDate ? <span className="font-mono tabular-nums">{formatDate(row.original.nextDueDate)}</span> : "—"),
    enableSorting: false,
  },
];

export const treatmentRegisterColumns: ColumnDef<TreatmentRegisterRow>[] = [
  {
    accessorKey: "treatmentDate",
    id: "date",
    header: "Date",
    cell: ({ row }) => <span className="font-mono tabular-nums">{formatDate(row.original.treatmentDate)}</span>,
    enableSorting: false,
  },
  {
    id: "animal",
    header: "Animal",
    cell: ({ row }) => <AnimalTagCell animalId={row.original.animalId} tagNumber={row.original.tagNumber} animalName={row.original.animalName} />,
    enableSorting: false,
  },
  { accessorKey: "speciesName", id: "species", header: "Species", cell: ({ row }) => row.original.speciesName ?? "—", enableSorting: false },
  { accessorKey: "medicationName", id: "medication", header: "Medication", cell: ({ row }) => row.original.medicationName ?? "—", enableSorting: false },
  { accessorKey: "dosage", id: "dosage", header: "Dosage", cell: ({ row }) => row.original.dosage ?? "—", enableSorting: false },
  {
    accessorKey: "withdrawalUntil",
    id: "withdrawal",
    header: "Withdrawal until",
    cell: ({ row }) => (row.original.withdrawalUntil ? <span className="font-mono tabular-nums">{formatDate(row.original.withdrawalUntil)}</span> : "—"),
    enableSorting: false,
  },
  { accessorKey: "outcome", id: "outcome", header: "Outcome", cell: ({ row }) => row.original.outcome ?? "—", enableSorting: false },
];

export const illnessRegisterColumns: ColumnDef<IllnessRegisterRow>[] = [
  {
    accessorKey: "onsetDate",
    id: "onset",
    header: "Onset",
    cell: ({ row }) => <span className="font-mono tabular-nums">{formatDate(row.original.onsetDate)}</span>,
    enableSorting: false,
  },
  {
    id: "animal",
    header: "Animal",
    cell: ({ row }) => <AnimalTagCell animalId={row.original.animalId} tagNumber={row.original.tagNumber} animalName={row.original.animalName} />,
    enableSorting: false,
  },
  { accessorKey: "speciesName", id: "species", header: "Species", cell: ({ row }) => row.original.speciesName ?? "—", enableSorting: false },
  { accessorKey: "illnessName", id: "illness", header: "Illness", cell: ({ row }) => row.original.illnessName ?? "—", enableSorting: false },
  { accessorKey: "severity", id: "severity", header: "Severity", cell: ({ row }) => <span className="capitalize">{row.original.severity}</span>, enableSorting: false },
  {
    accessorKey: "status",
    id: "status",
    header: "Status",
    cell: ({ row }) => <span className="capitalize">{row.original.status.replace(/_/g, " ")}</span>,
    enableSorting: false,
  },
  {
    accessorKey: "resolvedDate",
    id: "resolved",
    header: "Resolved",
    cell: ({ row }) => (row.original.resolvedDate ? <span className="font-mono tabular-nums">{formatDate(row.original.resolvedDate)}</span> : "—"),
    enableSorting: false,
  },
];

export const vetVisitRegisterColumns: ColumnDef<VetVisitRegisterRow>[] = [
  {
    accessorKey: "visitDate",
    id: "date",
    header: "Date",
    cell: ({ row }) => <span className="font-mono tabular-nums">{formatDate(row.original.visitDate)}</span>,
    enableSorting: false,
  },
  { accessorKey: "ranchName", id: "ranch", header: "Ranch", enableSorting: false },
  { accessorKey: "veterinarianName", id: "veterinarian", header: "Veterinarian", cell: ({ row }) => row.original.veterinarianName ?? "—", enableSorting: false },
  { accessorKey: "purpose", id: "purpose", header: "Purpose", cell: ({ row }) => row.original.purpose ?? "—", enableSorting: false },
  {
    id: "animals",
    header: "Animals",
    cell: ({ row }) =>
      row.original.animalTags.length > 0 ? (
        <span className="font-mono text-13 tabular-nums">{row.original.animalTags.join(", ")}</span>
      ) : (
        "—"
      ),
    enableSorting: false,
  },
  {
    accessorKey: "nextVisitDate",
    id: "next_visit",
    header: "Next visit",
    cell: ({ row }) => (row.original.nextVisitDate ? <span className="font-mono tabular-nums">{formatDate(row.original.nextVisitDate)}</span> : "—"),
    enableSorting: false,
  },
];
