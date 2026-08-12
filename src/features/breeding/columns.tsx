import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";

import { formatDate } from "@/lib/format";
import type { BreedingRegisterRow } from "./api";

export const breedingRegisterColumns: ColumnDef<BreedingRegisterRow>[] = [
  {
    id: "dam",
    header: "Dam",
    cell: ({ row }) =>
      row.original.damId ? (
        <Link to="/animals/$animalId" params={{ animalId: row.original.damId }} className="hover:underline">
          <span className="font-mono tabular-nums">{row.original.damTagNumber}</span>
        </Link>
      ) : (
        row.original.damTagNumber
      ),
    enableSorting: false,
  },
  {
    accessorKey: "method",
    id: "method",
    header: "Method",
    cell: ({ row }) => <span className="capitalize">{row.original.method.replace(/_/g, " ")}</span>,
    enableSorting: false,
  },
  { accessorKey: "sireLabel", id: "sire", header: "Sire", cell: ({ row }) => row.original.sireLabel ?? "—", enableSorting: false },
  {
    accessorKey: "serviceOrJoiningDate",
    id: "date",
    header: "Date",
    cell: ({ row }) => (row.original.serviceOrJoiningDate ? <span className="font-mono tabular-nums">{formatDate(row.original.serviceOrJoiningDate)}</span> : "—"),
    enableSorting: false,
  },
  {
    accessorKey: "status",
    id: "status",
    header: "Status",
    cell: ({ row }) => <span className="capitalize">{row.original.status.replace(/_/g, " ")}</span>,
    enableSorting: false,
  },
  {
    accessorKey: "expectedDueDate",
    id: "due",
    header: "Expected due",
    cell: ({ row }) => (row.original.expectedDueDate ? <span className="font-mono tabular-nums">{formatDate(row.original.expectedDueDate)}</span> : "—"),
    enableSorting: false,
  },
];
