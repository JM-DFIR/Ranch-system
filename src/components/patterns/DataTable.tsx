import type { ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export type Density = "comfortable" | "compact";

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  rowCount: number;
  isLoading?: boolean;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  getRowId?: (row: TData) => string;
  density?: Density;
  onRowClick?: (row: TData) => void;
  emptyState?: ReactNode;
}

// The register's reusable server-side table: full manual mode
// (manualSorting/manualFiltering/manualPagination, and only
// getCoreRowModel — no getSorted/getFiltered/getPaginationRowModel at
// all) — the `data` prop is already sorted, filtered and paginated by
// the caller's Postgres query by the time it reaches this component
// (blueprint.md, Session 3).
//
// Row virtualization above page size 100 is NOT implemented here yet —
// deliberately scoped out rather than silently skipped: at 200 rows
// plain DOM rendering still works correctly, it's a performance
// optimisation for the "dense view" option, not a correctness
// requirement, and this session is already large. Flagged as a
// follow-up, not swept under the rug.
export function DataTable<TData>({
  columns,
  data,
  rowCount,
  isLoading = false,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  rowSelection,
  onRowSelectionChange,
  columnVisibility,
  onColumnVisibilityChange,
  getRowId,
  density = "comfortable",
  onRowClick,
  emptyState,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    rowCount,
    state: { sorting, pagination, rowSelection, columnVisibility },
    onSortingChange,
    onPaginationChange,
    onRowSelectionChange,
    onColumnVisibilityChange,
    getRowId,
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: !!onRowSelectionChange,
  });

  const rowHeightClass = density === "compact" ? "py-1.5" : "py-3";
  const visibleLeafColumns = table.getAllLeafColumns().filter((c) => c.getIsVisible());

  if (!isLoading && data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="overflow-x-auto rounded-card border border-line">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sortDirection = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    className={cn(header.column.getCanSort() && "cursor-pointer select-none")}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sortDirection === "asc" ? <ArrowUp className="size-3" aria-hidden /> : null}
                        {sortDirection === "desc" ? <ArrowDown className="size-3" aria-hidden /> : null}
                      </div>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: Math.min(pagination.pageSize, 10) }).map((_, i) => (
              // Skeleton rows match the real column widths, never a
              // spinner (CLAUDE.md's definition of done). Index-as-key
              // is fine here — skeleton rows have no stable identity.
              <TableRow key={`skeleton-${i}`}>
                {visibleLeafColumns.map((col) => (
                  <TableCell key={col.id} className={rowHeightClass}>
                    <Skeleton className="h-4 w-full max-w-32" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
                className={cn(onRowClick && "cursor-pointer")}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={rowHeightClass}
                    onClick={(e) => {
                      // Interactive cell content (the selection
                      // checkbox, a quick-actions menu) opts out of the
                      // row's own onRowClick navigation by carrying
                      // this data attribute, rather than every such
                      // column needing its own stopPropagation.
                      if ((e.target as HTMLElement).closest("[data-stop-row-click]")) {
                        e.stopPropagation();
                      }
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
