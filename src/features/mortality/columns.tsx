import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";

import { formatDate } from "@/lib/format";
import type { MortalityRegisterRow } from "./api";

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
        <Link to="/animals/$animalId" params={{ animalId: row.original.animalId }} className="hover:underline">
          <span className="font-mono tabular-nums">{row.original.tagNumber}</span>
          {row.original.animalName ? <span className="ml-1.5 text-muted-foreground">{row.original.animalName}</span> : null}
        </Link>
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
