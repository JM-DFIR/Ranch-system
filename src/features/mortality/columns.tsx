import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";

import { formatDate } from "@/lib/format";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import type { MortalityRegisterRow } from "./api";

function AnimalTagCell({ animalId, tagNumber, animalName }: { animalId: string; tagNumber: string; animalName: string | null }) {
  const { ranch } = AuthenticatedRoute.useSearch();
  return (
    <Link to="/animals/$animalId" params={{ animalId }} search={{ ranch }} className="hover:underline">
      <span className="font-mono tabular-nums">{tagNumber}</span>
      {animalName ? <span className="ml-1.5 text-muted-foreground">{animalName}</span> : null}
    </Link>
  );
}

export const mortalityRegisterColumns: ColumnDef<MortalityRegisterRow>[] = [
  {
    accessorKey: "dateOfDeath",
    id: "date",
    header: "Date",
    cell: ({ row }) => <span className="font-mono tabular-nums">{formatDate(row.original.dateOfDeath)}</span>,
    enableSorting: false,
  },
  {
    id: "animal",
    header: "Animal",
    cell: ({ row }) =>
      row.original.animalId ? (
        <AnimalTagCell animalId={row.original.animalId} tagNumber={row.original.tagNumber} animalName={row.original.animalName} />
      ) : (
        row.original.tagNumber
      ),
    enableSorting: false,
  },
  { accessorKey: "ranchName", id: "ranch", header: "Ranch", enableSorting: false },
  { accessorKey: "causeCategory", id: "cause", header: "Cause", enableSorting: false },
  { accessorKey: "causeDetails", id: "details", header: "Details", cell: ({ row }) => row.original.causeDetails ?? "—", enableSorting: false },
  {
    id: "postmortem",
    header: "Postmortem",
    cell: ({ row }) =>
      row.original.postmortemDone ? (
        <Check className="size-4 text-status-ok" aria-label="Postmortem done" />
      ) : (
        <X className="size-4 text-muted-foreground" aria-label="No postmortem" />
      ),
    enableSorting: false,
  },
];
