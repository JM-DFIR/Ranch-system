import { useState } from "react";
import type { OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { HeartHandshake } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/patterns/PageHeader";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ErrorState } from "@/components/patterns/ErrorState";
import { DataTable } from "@/components/patterns/DataTable";
import { DateRangeFilter } from "@/components/patterns/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { PaginationFooter } from "@/features/animals/components/PaginationFooter";
import { DEFAULT_PAGE_SIZE, type PageSize } from "@/features/animals/schema";
import { useAnimalSearchOptions } from "@/features/dashboard/hooks";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import { Route as CareRoute } from "@/routes/_authenticated/feeding.care";
import { careActivityRegisterColumns } from "../columns";
import { useCareActivityRegister } from "../hooks";
import { RecordCareActivityDrawer } from "./RecordCareActivityDrawer";

const NO_SORTING: SortingState = [];
const noopSortingChange: OnChangeFn<SortingState> = () => undefined;

// The Care Activities register (M5 — session-pack.md Part 5).
export function CareActivityRegisterPage() {
  const { profile } = useAuth();
  const { ranch } = AuthenticatedRoute.useSearch();
  const search = CareRoute.useSearch();
  const navigate = CareRoute.useNavigate();
  const [logOpen, setLogOpen] = useState(false);
  const { data: searchableAnimals } = useAnimalSearchOptions(profile?.orgId, ranch);

  const page = search.page ?? 0;
  const pageSize = search.pageSize ?? DEFAULT_PAGE_SIZE;
  const pagination: PaginationState = { pageIndex: page, pageSize };

  const { data, isLoading, isError, error, refetch } = useCareActivityRegister(profile?.orgId, {
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
      icon={HeartHandshake}
      title="No care activities logged yet"
      description="Log a care activity for a whole ranch or a specific animal to start the log."
      action={{ label: "Log care activity", onClick: () => setLogOpen(true) }}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Care activities"
        description={totalCount > 0 ? `${totalCount.toLocaleString()} care activities` : undefined}
        actions={<Button onClick={() => setLogOpen(true)}>Log care activity</Button>}
      />
      <div className="overflow-hidden rounded-card border border-line">
        {isError ? (
          <div className="p-4">
            <ErrorState
              title="Couldn't load care activities"
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
              columns={careActivityRegisterColumns}
              data={rows}
              rowCount={totalCount}
              isLoading={isLoading}
              sorting={NO_SORTING}
              onSortingChange={noopSortingChange}
              pagination={pagination}
              onPaginationChange={onPaginationChange}
              getRowId={(row) => row.id}
              onRowClick={(row) => {
                if (!row.animalId) return;
                void navigate({ to: "/animals/$animalId", params: { animalId: row.animalId }, search: { ranch } });
              }}
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
      <RecordCareActivityDrawer open={logOpen} onOpenChange={setLogOpen} searchableAnimals={searchableAnimals ?? []} />
    </div>
  );
}
