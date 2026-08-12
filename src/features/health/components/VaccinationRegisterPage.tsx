import type { OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { Syringe } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/patterns/PageHeader";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ErrorState } from "@/components/patterns/ErrorState";
import { DataTable } from "@/components/patterns/DataTable";
import { PaginationFooter } from "@/features/animals/components/PaginationFooter";
import { DEFAULT_PAGE_SIZE, type PageSize } from "@/features/animals/schema";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import { Route as VaccinationsRoute } from "@/routes/_authenticated/health.vaccinations";
import { vaccinationRegisterColumns } from "../columns";
import { useVaccinationRegister } from "../hooks";
import { DateRangeFilter } from "./DateRangeFilter";

// No columns are sortable (see columns.tsx) — this register has one
// natural date order and no reason to expose sorting, so the DataTable
// still needs a sorting/onSortingChange pair (both required props) but
// there's nothing for the handler to actually do.
const NO_SORTING: SortingState = [];
const noopSortingChange: OnChangeFn<SortingState> = () => undefined;

// The Vaccinations register (session-pack.md Part 5 — "M3 remainder").
// Org-wide, not per-animal — the Health tab on each animal's profile
// already covers the per-animal view; this is the audit/overview
// surface across the whole herd.
export function VaccinationRegisterPage() {
  const { profile } = useAuth();
  const { ranch } = AuthenticatedRoute.useSearch();
  const search = VaccinationsRoute.useSearch();
  const navigate = VaccinationsRoute.useNavigate();

  const page = search.page ?? 0;
  const pageSize = search.pageSize ?? DEFAULT_PAGE_SIZE;
  const pagination: PaginationState = { pageIndex: page, pageSize };

  const { data, isLoading, isError, error, refetch } = useVaccinationRegister(profile?.orgId, {
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
      icon={Syringe}
      title="No vaccinations recorded yet"
      description="Vaccinations recorded from an animal's profile, the register, or the dashboard's quick actions all show up here."
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Vaccinations"
        description={totalCount > 0 ? `${totalCount.toLocaleString()} vaccinations recorded` : undefined}
      />
      <div className="overflow-hidden rounded-card border border-line">
        {isError ? (
          <div className="p-4">
            <ErrorState
              title="Couldn't load vaccinations"
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
              columns={vaccinationRegisterColumns}
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
