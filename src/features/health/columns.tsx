import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";

import { formatDate } from "@/lib/format";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import type {
  IllnessRegisterRow,
  TreatmentRegisterRow,
  VaccinationRegisterRow,
  VetVisitRegisterRow,
} from "./api";

// Every register links its animal tag back to the profile. The
// vaccination/treatment/illness registers also set their own
// onRowClick to the same destination — data-stop-row-click keeps this
// Link as the thing that actually handles the click rather than
// letting it double-fire alongside the row handler.
function AnimalTagCell({ animalId, tagNumber, animalName }: { animalId: string; tagNumber: string; animalName: string | null }) {
  const { ranch } = AuthenticatedRoute.useSearch();
  return (
    <Link to="/animals/$animalId" params={{ animalId }} search={{ ranch }} data-stop-row-click className="hover:underline">
      <span className="font-mono tabular-nums">{tagNumber}</span>
      {animalName ? <span className="ml-1.5 text-muted-foreground">{animalName}</span> : null}
    </Link>
  );
}

// Vet visits have no row-level onRowClick (see vetVisitRegisterColumns
// below — a visit can cover several animals, so there's no single
// destination for the row itself), so this one needs no
// data-stop-row-click of its own.
function AnimalTagLink({ id, tagNumber }: { id: string; tagNumber: string }) {
  const { ranch } = AuthenticatedRoute.useSearch();
  return (
    <Link to="/animals/$animalId" params={{ animalId: id }} search={{ ranch }} className="font-mono tabular-nums hover:underline">
      {tagNumber}
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
    // A vet visit can cover several animals at once — there's no single
    // "the" animal for a row-level click to target, so each one gets
    // its own link instead (unlike every other health register, which
    // is one row per animal).
    cell: ({ row }) =>
      row.original.animals.length > 0 ? (
        <span className="flex flex-wrap gap-x-1.5 gap-y-0.5">
          {row.original.animals.map((a, i) => (
            <span key={a.id} className="whitespace-nowrap">
              <AnimalTagLink id={a.id} tagNumber={a.tagNumber} />
              {i < row.original.animals.length - 1 ? "," : ""}
            </span>
          ))}
        </span>
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
