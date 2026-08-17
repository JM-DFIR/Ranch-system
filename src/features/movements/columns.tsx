import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";

import { formatDate } from "@/lib/format";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import type { MovementRegisterRow } from "./api";

function AnimalTagCell({ animalId, tagNumber, animalName }: { animalId: string; tagNumber: string; animalName: string | null }) {
  const { ranch } = AuthenticatedRoute.useSearch();
  return (
    <Link to="/animals/$animalId" params={{ animalId }} search={{ ranch }} data-stop-row-click className="hover:underline">
      <span className="font-mono tabular-nums">{tagNumber}</span>
      {animalName ? <span className="ml-1.5 text-muted-foreground">{animalName}</span> : null}
    </Link>
  );
}

export const movementRegisterColumns: ColumnDef<MovementRegisterRow>[] = [
  {
    accessorKey: "movementDate",
    id: "date",
    header: "Date",
    cell: ({ row }) => <span className="font-mono tabular-nums">{formatDate(row.original.movementDate)}</span>,
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
  { accessorKey: "fromRanchName", id: "from", header: "From", cell: ({ row }) => row.original.fromRanchName ?? "—", enableSorting: false },
  { accessorKey: "toRanchName", id: "to", header: "To", enableSorting: false },
  { accessorKey: "reason", id: "reason", header: "Reason", cell: ({ row }) => row.original.reason ?? "—", enableSorting: false },
  { accessorKey: "permitNumber", id: "permit", header: "Permit", cell: ({ row }) => row.original.permitNumber ?? "—", enableSorting: false },
];
