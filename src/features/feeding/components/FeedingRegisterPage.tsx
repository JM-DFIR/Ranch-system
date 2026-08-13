import { useState } from "react";
import type { OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { Wheat } from "lucide-react";

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
import { Route as FeedingRoute } from "@/routes/_authenticated/feeding.index";
import { feedingRegisterColumns } from "../columns";
import { useFeedingRegister } from "../hooks";
import { RecordFeedingDrawer } from "./RecordFeedingDrawer";

const NO_SORTING: SortingState = [];
const noopSortingChange: OnChangeFn<SortingState> = () => undefined;

// The Feeding register (M5 — session-pack.md Part 5). Org-wide,
// paginated, same shape as the health/movements registers — plus its
// own "Log feeding" action here, since most feeding is ranch-wide and
// has no animal profile to launch from.
export function FeedingRegisterPage() {
  const { profile } = useAuth();
  const { ranch } = AuthenticatedRoute.useSearch();
  const search = FeedingRoute.useSearch();
  const navigate = FeedingRoute.useNavigate();
  const [logOpen, setLogOpen] = useState(false);
  const { data: searchableAnimals } = useAnimalSearchOptions(profile?.orgId, ranch);

  const page = search.page ?? 0;
  const pageSize = search.pageSize ?? DEFAULT_PAGE_SIZE;
  const pagination: PaginationState = { pageIndex: page, pageSize };

  const { data, isLoading, isError, error, refetch } = useFeedingRegister(profile?.orgId, {
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
    <EmptyState icon={Wheat} title="No feeding logged yet" description="Log feeding for a whole ranch or a specific animal to start the log." action={{ label: "Log feeding", onClick: () => setLogOpen(true) }} />
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Feeding log"
        description={totalCount > 0 ? `${totalCount.toLocaleString()} feeding records` : undefined}
        actions={<Button onClick={() => setLogOpen(true)}>Log feeding</Button>}
      />
      <div className="overflow-hidden rounded-card border border-line">
        {isError ? (
          <div className="p-4">
            <ErrorState
              title="Couldn't load the feeding log"
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
              columns={feedingRegisterColumns}
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
      <RecordFeedingDrawer open={logOpen} onOpenChange={setLogOpen} searchableAnimals={searchableAnimals ?? []} />
    </div>
  );
}
