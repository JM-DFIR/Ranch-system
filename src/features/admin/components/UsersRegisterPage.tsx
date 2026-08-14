import { useState } from "react";
import type { OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { Users } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/patterns/PageHeader";
import { ErrorState } from "@/components/patterns/ErrorState";
import { EmptyState } from "@/components/patterns/EmptyState";
import { DataTable } from "@/components/patterns/DataTable";
import { PaginationFooter } from "@/features/animals/components/PaginationFooter";
import { DEFAULT_PAGE_SIZE, type PageSize } from "@/features/animals/schema";
import { Button } from "@/components/ui/button";
import { Route as AdminUsersRoute } from "@/routes/_authenticated/admin.users";
import { usersColumns } from "../columns";
import { useOrgMembers } from "../hooks";
import type { OrgMember } from "../api";
import { InviteUserDialog } from "./InviteUserDialog";
import { InvitationsPanel } from "./InvitationsPanel";
import { ManageMemberDialog } from "./ManageMemberDialog";

const NO_SORTING: SortingState = [];
const noopSortingChange: OnChangeFn<SortingState> = () => undefined;

// Admin > Users & Roles (blueprint.md §4.1: "Users & Roles · Invite
// User · Ranch Assignments") — owner-only, gated at the route level
// (admin.users.tsx's beforeLoad).
export function UsersRegisterPage() {
  const { profile } = useAuth();
  const search = AdminUsersRoute.useSearch();
  const navigate = AdminUsersRoute.useNavigate();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrgMember | null>(null);

  const page = search.page ?? 0;
  const pageSize = search.pageSize ?? DEFAULT_PAGE_SIZE;
  const pagination: PaginationState = { pageIndex: page, pageSize };

  const { data, isLoading, isError, error, refetch } = useOrgMembers(profile?.orgId, page, pageSize);
  const rows = data?.rows ?? [];
  const totalCount = data?.totalCount ?? 0;

  const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === "function" ? updater(pagination) : updater;
    void navigate({ search: (prev) => ({ ...prev, page: next.pageIndex, pageSize: next.pageSize as PageSize }) });
  };

  const emptyState = (
    <EmptyState icon={Users} title="Just you so far" description="Invite a ranch manager to give them their own login." />
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users & roles"
        description={totalCount > 0 ? `${totalCount.toLocaleString()} people in your organisation` : undefined}
        actions={<Button onClick={() => setInviteOpen(true)}>Invite user</Button>}
      />

      <div className="overflow-hidden rounded-card border border-line">
        {isError ? (
          <div className="p-4">
            <ErrorState
              title="Couldn't load users"
              description={error instanceof Error ? error.message : "Check your connection and try again."}
              onRetry={() => void refetch()}
            />
          </div>
        ) : (
          <>
            <DataTable
              columns={usersColumns}
              data={rows}
              rowCount={totalCount}
              isLoading={isLoading}
              sorting={NO_SORTING}
              onSortingChange={noopSortingChange}
              pagination={pagination}
              onPaginationChange={onPaginationChange}
              getRowId={(row) => row.id}
              onRowClick={(row) => setSelectedMember(row)}
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

      <InvitationsPanel />

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <ManageMemberDialog member={selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)} />
    </div>
  );
}
