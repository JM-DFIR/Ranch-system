import type { OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { Heart } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/patterns/PageHeader";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ErrorState } from "@/components/patterns/ErrorState";
import { DataTable } from "@/components/patterns/DataTable";
import { DateRangeFilter } from "@/components/patterns/DateRangeFilter";
import { PaginationFooter } from "@/features/animals/components/PaginationFooter";
import { DEFAULT_PAGE_SIZE, type PageSize } from "@/features/animals/schema";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import { Route as BreedingRoute } from "@/routes/_authenticated/breeding.index";
import { breedingRegisterColumns } from "../columns";
import { useBreedingRegister } from "../hooks";

const NO_SORTING: SortingState = [];
const noopSortingChange: OnChangeFn<SortingState> = () => undefined;

// The Breeding register (M4 — session-pack.md Part 5). Org-wide,
// paginated, same shape as the health registers.
export function BreedingRegisterPage() {
  const { profile } = useAuth();
  const { ranch } = AuthenticatedRoute.useSearch();
  const search = BreedingRoute.useSearch();
  const navigate = BreedingRoute.useNavigate();

  const page = search.page ?? 0;
  const pageSize = search.pageSize ?? DEFAULT_PAGE_SIZE;
  const pagination: PaginationState = { pageIndex: page, pageSize };

  const { data, isLoading, isError, error, refetch } = useBreedingRegister(profile?.orgId, {
    ranchId: ranch,
    dateFrom: search.dateFrom,
    dateTo: search.dateTo,
    page,
    pageSize,
  });
  const rows = data?.rows ?? [];
  const totalCount = data?.totalCount ?? 0;

  const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === "function" ? updater(pagination) : updater;
    void navigate({ search: (prev) => ({ ...prev, page: next.pageIndex, pageSize: next.pageSize as PageSize }) });
  };

  const emptyState = (
    <EmptyState
      icon={Heart}
      title="No breeding events recorded yet"
      description="Breeding events recorded from a dam's profile, the register, or the dashboard's quick actions all show up here."
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Breeding" description={totalCount > 0 ? `${totalCount.toLocaleString()} breeding events recorded` : undefined} />
      <div className="overflow-hidden rounded-card border border-line">
        {isError ? (
          <div className="p-4">
            <ErrorState
              title="Couldn't load the breeding register"
              description={error instanceof Error ? error.message : "Check your connection and try again."}
              onRetry={() => void refetch()}
            />
          </div>
        ) : (
          <>
            <DateRangeFilter
              dateFrom={search.dateFrom}
              dateTo={search.dateTo}
              onChange={(range) => void navigate({ search: (prev) => ({ ...prev, ...range, page: 0 }) })}
            />
            <DataTable
              columns={breedingRegisterColumns}
              data={rows}
              rowCount={totalCount}
              isLoading={isLoading}
              sorting={NO_SORTING}
              onSortingChange={noopSortingChange}
              pagination={pagination}
              onPaginationChange={onPaginationChange}
              getRowId={(row) => row.id}
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
    </div>
  );
}
