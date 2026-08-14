import type { OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { ScrollText } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/patterns/PageHeader";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ErrorState } from "@/components/patterns/ErrorState";
import { DataTable } from "@/components/patterns/DataTable";
import { DateRangeFilter } from "@/components/patterns/DateRangeFilter";
import { PaginationFooter } from "@/features/animals/components/PaginationFooter";
import { DEFAULT_PAGE_SIZE, type PageSize } from "@/features/animals/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Route as AdminAuditLogRoute } from "@/routes/_authenticated/admin.audit-log";
import { AUDIT_LOG_TABLES } from "../api";
import { auditLogColumns } from "../columns";
import { useAuditLog } from "../hooks";

const NO_SORTING: SortingState = [];
const noopSortingChange: OnChangeFn<SortingState> = () => undefined;

const TABLE_LABEL: Record<string, string> = {
  animals: "Animals",
  movements: "Movements",
  mortalities: "Deaths",
  breeding_events: "Breeding events",
  births: "Births",
  vaccinations: "Vaccinations",
  treatments: "Treatments",
  illnesses: "Illnesses",
};

// Admin > Audit Log (blueprint.md §4.1) — owner-only, read-only. Filters
// by record type, action and date range; the log itself has no write
// path (audit_log's own design, 0012_system.sql).
export function AuditLogRegisterPage() {
  const { profile } = useAuth();
  const search = AdminAuditLogRoute.useSearch();
  const navigate = AdminAuditLogRoute.useNavigate();

  const page = search.page ?? 0;
  const pageSize = search.pageSize ?? DEFAULT_PAGE_SIZE;
  const pagination: PaginationState = { pageIndex: page, pageSize };

  const { data, isLoading, isError, error, refetch } = useAuditLog(profile?.orgId, {
    tableName: search.tableName,
    action: search.action,
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
      icon={ScrollText}
      title="Nothing recorded yet"
      description="Every change to an animal, movement, death, breeding event, birth or health record shows up here as it happens."
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Audit log"
        description={totalCount > 0 ? `${totalCount.toLocaleString()} changes recorded` : "Who changed what, across every ranch."}
      />

      <div className="overflow-hidden rounded-card border border-line">
        {isError ? (
          <div className="p-4">
            <ErrorState
              title="Couldn't load the audit log"
              description={error instanceof Error ? error.message : "Check your connection and try again."}
              onRetry={() => void refetch()}
            />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 border-b border-line p-3">
              <Select
                value={search.tableName ?? "all"}
                onValueChange={(v) => void navigate({ search: (prev) => ({ ...prev, tableName: v === "all" ? undefined : v, page: 0 }) })}
              >
                <SelectTrigger size="sm" className="w-44">
                  <SelectValue placeholder="Record type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All record types</SelectItem>
                  {AUDIT_LOG_TABLES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TABLE_LABEL[t] ?? t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={search.action ?? "all"}
                onValueChange={(v) =>
                  void navigate({
                    search: (prev) => ({ ...prev, action: v === "all" ? undefined : (v as "insert" | "update"), page: 0 }),
                  })
                }
              >
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any action</SelectItem>
                  <SelectItem value="insert">Created</SelectItem>
                  <SelectItem value="update">Updated</SelectItem>
                </SelectContent>
              </Select>

              <DateRangeFilter
                dateFrom={search.dateFrom}
                dateTo={search.dateTo}
                onChange={(range) => void navigate({ search: (prev) => ({ ...prev, ...range, page: 0 }) })}
              />
            </div>
            <DataTable
              columns={auditLogColumns}
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
