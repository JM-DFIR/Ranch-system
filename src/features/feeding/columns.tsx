import type { ColumnDef } from "@tanstack/react-table";

import { formatDate } from "@/lib/format";
import type { CareActivityRegisterRow, FeedingRegisterRow } from "./api";

export const feedingRegisterColumns: ColumnDef<FeedingRegisterRow>[] = [
  {
    accessorKey: "feedDate",
    id: "date",
    header: "Date",
    cell: ({ row }) => <span className="font-mono tabular-nums">{formatDate(row.original.feedDate)}</span>,
    enableSorting: false,
  },
  { accessorKey: "scopeLabel", id: "scope", header: "Where", enableSorting: false },
  { accessorKey: "feedItemName", id: "feed", header: "Feed", enableSorting: false },
  {
    id: "quantity",
    header: "Quantity",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">
        {row.original.quantity} {row.original.unit}
      </span>
    ),
    enableSorting: false,
  },
];

export const careActivityRegisterColumns: ColumnDef<CareActivityRegisterRow>[] = [
  {
    accessorKey: "activityDate",
    id: "date",
    header: "Date",
    cell: ({ row }) => <span className="font-mono tabular-nums">{formatDate(row.original.activityDate)}</span>,
    enableSorting: false,
  },
  { accessorKey: "scopeLabel", id: "scope", header: "Where", enableSorting: false },
  { accessorKey: "activityTypeName", id: "activity", header: "Activity", enableSorting: false },
  { accessorKey: "product", id: "product", header: "Product", cell: ({ row }) => row.original.product ?? "—", enableSorting: false },
  {
    accessorKey: "nextDueDate",
    id: "next_due",
    header: "Next due",
    cell: ({ row }) => (row.original.nextDueDate ? <span className="font-mono tabular-nums">{formatDate(row.original.nextDueDate)}</span> : "—"),
    enableSorting: false,
  },
];
