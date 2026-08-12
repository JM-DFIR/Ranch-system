import type { OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { ThermometerSun } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/patterns/PageHeader";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ErrorState } from "@/components/patterns/ErrorState";
import { DataTable } from "@/components/patterns/DataTable";
import { PaginationFooter } from "@/features/animals/components/PaginationFooter";
import { DEFAULT_PAGE_SIZE, type PageSize } from "@/features/animals/schema";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import { Route as IllnessesRoute } from "@/routes/_authenticated/health.illnesses";
import { illnessRegisterColumns } from "../columns";
import { useIllnessRegister } from "../hooks";
import { DateRangeFilter } from "./DateRangeFilter";

const NO_SORTING: SortingState = [];
const noopSortingChange: OnChangeFn<SortingState> = () => undefined;

// The Illnesses register (session-pack.md Part 5 — "M3 remainder").
export function IllnessRegisterPage() {
  const { profile } = useAuth();
  const { ranch } = AuthenticatedRoute.useSearch();
  const search = IllnessesRoute.useSearch();
  const navigate = IllnessesRoute.useNavigate();

  const page = search.page ?? 0;
  const pageSize = search.pageSize ?? DEFAULT_PAGE_SIZE;
  const pagination: PaginationState = { pageIndex: page, pageSize };

  const { data, isLoading, isError, error, refetch } = useIllnessRegister(profile?.orgId, {
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
      icon={ThermometerSun}
      title="No illnesses recorded yet"
      description="Illnesses recorded from an animal's profile, the register, or the dashboard's quick actions all show up here."
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Illnesses" description={totalCount > 0 ? `${totalCount.toLocaleString()} illnesses recorded` : undefined} />
      <div className="overflow-hidden rounded-card border border-line">
        {isError ? (
          <div className="p-4">
            <ErrorState
              title="Couldn't load illnesses"
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
              columns={illnessRegisterColumns}
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
