import { useMemo, useState } from "react";
import type { OnChangeFn, PaginationState, RowSelectionState, SortingState } from "@tanstack/react-table";
import { PawPrint } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/patterns/PageHeader";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ErrorState } from "@/components/patterns/ErrorState";
import { DataTable } from "@/components/patterns/DataTable";
import { Route as AnimalsRoute } from "@/routes/_authenticated/animals.index";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import { buildAnimalColumns } from "../columns";
import { useAnimalPhotoUrls, useAnimalRegister } from "../hooks";
import { useColumnVisibility, useDensity } from "../usePreferences";
import { DEFAULT_PAGE_SIZE, DEFAULT_SORT, DEFAULT_SORT_DIR, hasActiveAnimalFilters, type PageSize } from "../schema";
import type { AnimalRegisterParams } from "../api";
import { FilterBar } from "./FilterBar";
import { BulkActionBar } from "./BulkActionBar";
import { TableToolbar } from "./TableToolbar";
import { PaginationFooter } from "./PaginationFooter";

// Composes the pieces built across this session: FilterBar (faceted
// filters + search), DataTable (sorting/pagination), TableToolbar
// (density/columns), PaginationFooter, BulkActionBar. All state that
// should survive a refresh or be shareable as a link lives in the URL
// (this route's search schema, plus `ranch` on the parent
// `_authenticated` route); selection is the one thing that's
// deliberately session-only (session-pack.md, Session 3).
//
// Row hover "quick-actions menu" from the spec is not built here: every
// action it would offer (record health event, transfer, etc.) depends
// on drawers that don't exist until later sessions, same as the bulk
// bar's disabled actions — an all-disabled hover menu would add UI
// with no function yet, so it's deferred rather than half-built.
export function AnimalRegisterPage() {
  const { profile } = useAuth();
  const navigate = AnimalsRoute.useNavigate();
  const search = AnimalsRoute.useSearch();
  const { ranch } = AuthenticatedRoute.useSearch();
  const authNavigate = AuthenticatedRoute.useNavigate();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(profile?.id);
  const [density, setDensity] = useDensity(profile?.id);

  const page = search.page ?? 0;
  const pageSize = search.pageSize ?? DEFAULT_PAGE_SIZE;
  const sortColumn = search.sort ?? DEFAULT_SORT;
  const sortDir = search.sortDir ?? DEFAULT_SORT_DIR;

  const sorting: SortingState = [{ id: sortColumn, desc: sortDir === "desc" }];
  const pagination: PaginationState = { pageIndex: page, pageSize };

  const params: AnimalRegisterParams = { ...search, ranchId: ranch, page, pageSize, sort: sortColumn, sortDir };
  const hasActiveFilters = hasActiveAnimalFilters(search, ranch);

  // Selection resets when the filtered working set changes, but
  // survives page/sort navigation within it — rows are keyed by their
  // real id (getRowId below), so a selection made on page 1 is still
  // meaningful after moving to page 2. Adjusted during render (React's
  // documented pattern for "reset state when a prop changes") rather
  // than in an effect, which would cost an extra commit for the same
  // result.
  const filterKey = JSON.stringify({
    ...search,
    ranch,
    page: undefined,
    pageSize: undefined,
    sort: undefined,
    sortDir: undefined,
  });
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setRowSelection({});
  }

  const { data, isLoading, isError, error, refetch } = useAnimalRegister(profile?.orgId, params);
  const rows = useMemo(() => data?.rows ?? [], [data?.rows]);
  const totalCount = data?.totalCount ?? 0;
  const selectedRows = rows.filter((row) => rowSelection[row.id]);

  // One signed-URL request for every photo on the current page, not one
  // per row (see useAnimalPhotoUrls) — columns are rebuilt only when
  // that map actually changes, not on every render.
  const photoPaths = useMemo(() => rows.map((r) => r.photoPath).filter((p): p is string => !!p), [rows]);
  const { data: photoUrls } = useAnimalPhotoUrls(photoPaths);
  const columns = useMemo(() => buildAnimalColumns(photoUrls ?? {}), [photoUrls]);

  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const first = next[0];
    void navigate({
      search: (prev) => ({
        ...prev,
        sort: first?.id,
        sortDir: first ? (first.desc ? "desc" : "asc") : undefined,
        page: 0,
      }),
    });
  };

  const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === "function" ? updater(pagination) : updater;
    void navigate({ search: (prev) => ({ ...prev, page: next.pageIndex, pageSize: next.pageSize as PageSize }) });
  };

  const clearFilters = () => {
    void navigate({ search: {} });
    void authNavigate({ search: (prev) => ({ ...prev, ranch: undefined }) });
  };

  const emptyState = hasActiveFilters ? (
    <EmptyState
      icon={PawPrint}
      title="No animals match these filters"
      description="Try widening the date range, or clear a filter to see more of the register."
      action={{ label: "Clear filters", onClick: clearFilters }}
    />
  ) : (
    <EmptyState
      icon={PawPrint}
      title="No animals recorded yet"
      description="Enrol your first animal to start building the register."
      action={{ label: "Start Enrollment Mode" }}
      secondaryAction={{ label: "Add one animal" }}
    />
  );

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <PageHeader
        title="Animals"
        description={totalCount > 0 ? `${totalCount.toLocaleString()} animals in the register` : undefined}
        actions={
          <TableToolbar
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            density={density}
            onDensityChange={setDensity}
          />
        }
      />
      <div className="overflow-hidden rounded-card border border-line">
        {isError ? (
          <div className="p-4">
            <ErrorState
              title="Couldn't load the animal register"
              description={error instanceof Error ? error.message : "Check your connection and try again."}
              onRetry={() => void refetch()}
            />
          </div>
        ) : (
          <>
            <FilterBar />
            <DataTable
              columns={columns}
              data={rows}
              rowCount={totalCount}
              isLoading={isLoading}
              sorting={sorting}
              onSortingChange={onSortingChange}
              pagination={pagination}
              onPaginationChange={onPaginationChange}
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={setColumnVisibility}
              getRowId={(row) => row.id}
              density={density}
              onRowClick={(row) => void navigate({ to: "/animals/$animalId", params: { animalId: row.id }, search: { ranch } })}
              emptyState={emptyState}
            />
            {rows.length > 0 ? (
              <PaginationFooter
                page={page}
                pageSize={pageSize}
                totalCount={totalCount}
                onPageChange={(p) => void navigate({ search: (prev) => ({ ...prev, page: p }) })}
                onPageSizeChange={(size) => void navigate({ search: (prev) => ({ ...prev, pageSize: size, page: 0 }) })}
              />
            ) : null}
          </>
        )}
      </div>
      <BulkActionBar selectedRows={selectedRows} onClearSelection={() => setRowSelection({})} />
    </div>
  );
}
