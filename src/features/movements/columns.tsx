import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";

import { formatDate } from "@/lib/format";
import type { MovementRegisterRow } from "./api";

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
        <Link to="/animals/$animalId" params={{ animalId: row.original.animalId }} className="hover:underline">
          <span className="font-mono tabular-nums">{row.original.tagNumber}</span>
          {row.original.animalName ? <span className="ml-1.5 text-muted-foreground">{row.original.animalName}</span> : null}
        </Link>
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
