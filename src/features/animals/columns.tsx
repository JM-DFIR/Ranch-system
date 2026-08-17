import type { ColumnDef } from "@tanstack/react-table";
import { PawPrint } from "lucide-react";

import { formatAge, formatDate } from "@/lib/format";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { AttentionBadge } from "@/components/patterns/AttentionBadge";
import type { AnimalRegisterRow } from "./api";

// Still the fallback glyph, deliberately — unlike the profile header and
// lineage cards (a handful of photos per view at most), a register page
// can hold up to 200 rows, and useAnimalPhotoUrl fetches one signed URL
// per animal: that's 200 individual Storage requests on a single page
// load, exactly the kind of thing that hurts on the rural signal this
// app is built for. Wiring this up for real needs Supabase's bulk
// createSignedUrls(paths[]) — one request for the whole visible page —
// not this same per-row hook reused blindly. Flagged, not built here.
function AnimalThumbnail() {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <PawPrint className="size-4" aria-hidden />
    </div>
  );
}

// Single source of truth for the "Columns" visibility toggle
// (TableToolbar.tsx) — kept separate from animalColumns' own `header`
// values since several of those are render functions, not plain
// strings. select/photo are excluded: `enableHiding: false` below.
export const HIDEABLE_COLUMNS: { id: string; label: string }[] = [
  { id: "tag_number", label: "Tag" },
  { id: "name", label: "Name" },
  { id: "species", label: "Species" },
  { id: "breed", label: "Breed" },
  { id: "sex", label: "Sex" },
  { id: "age", label: "Age" },
  { id: "ranch", label: "Ranch" },
  { id: "section", label: "Section" },
  { id: "status", label: "Status" },
  { id: "attention", label: "Attention" },
  { id: "last_event_date", label: "Last Event" },
];

export const animalColumns: ColumnDef<AnimalRegisterRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        data-stop-row-click
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() ? "indeterminate" : false)}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all rows on this page"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        data-stop-row-click
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={`Select ${row.original.tagNumber}`}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 36,
  },
  {
    id: "photo",
    header: "",
    cell: () => <AnimalThumbnail />,
    enableSorting: false,
    enableHiding: false,
    size: 48,
  },
  {
    accessorKey: "tagNumber",
    id: "tag_number",
    header: "Tag",
    cell: ({ row }) => <span className="font-mono tabular-nums">{row.original.tagNumber}</span>,
  },
  {
    accessorKey: "name",
    id: "name",
    header: "Name",
    cell: ({ row }) => row.original.name ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: "speciesName",
    id: "species",
    header: "Species",
    cell: ({ row }) => row.original.speciesName ?? "—",
  },
  {
    accessorKey: "breedName",
    id: "breed",
    header: "Breed",
    cell: ({ row }) => row.original.breedName ?? "—",
  },
  {
    accessorKey: "sex",
    id: "sex",
    header: "Sex",
    cell: ({ row }) => <span className="capitalize">{row.original.sex}</span>,
  },
  {
    id: "age",
    accessorFn: (row) => row.dateOfBirth,
    header: "Age",
    cell: ({ row }) => formatAge(row.original.dateOfBirth, row.original.dobIsEstimated),
  },
  {
    accessorKey: "ranchName",
    id: "ranch",
    header: "Ranch",
  },
  {
    accessorKey: "sectionName",
    id: "section",
    header: "Section",
    cell: ({ row }) => row.original.sectionName ?? "—",
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge name={row.original.statusName} colorToken={row.original.statusColorToken} />,
  },
  {
    id: "attention",
    header: "Attention",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.attentionSeverity ? (
        <AttentionBadge severity={row.original.attentionSeverity} reasonCount={row.original.attentionReasonCount} />
      ) : null,
  },
  {
    accessorKey: "lastEventDate",
    id: "last_event_date",
    header: "Last Event",
    cell: ({ row }) => (row.original.lastEventDate ? formatDate(row.original.lastEventDate) : "—"),
  },
];
