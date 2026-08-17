import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";

import { formatDate } from "@/lib/format";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import type { BreedingRegisterRow } from "./api";

function DamCell({ damId, damTagNumber }: { damId: string; damTagNumber: string }) {
  const { ranch } = AuthenticatedRoute.useSearch();
  return (
    <Link to="/animals/$animalId" params={{ animalId: damId }} search={{ ranch }} data-stop-row-click className="hover:underline">
      <span className="font-mono tabular-nums">{damTagNumber}</span>
    </Link>
  );
}

export const breedingRegisterColumns: ColumnDef<BreedingRegisterRow>[] = [
  {
    id: "dam",
    header: "Dam",
    cell: ({ row }) =>
      row.original.damId ? (
        <DamCell damId={row.original.damId} damTagNumber={row.original.damTagNumber} />
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
