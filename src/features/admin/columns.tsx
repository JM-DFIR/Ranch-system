import type { ColumnDef } from "@tanstack/react-table";

import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import type { AuditLogEntry, OrgMember } from "./api";

const ROLE_LABEL: Record<OrgMember["role"], string> = { owner: "Owner", ranch_manager: "Ranch manager" };

export const usersColumns: ColumnDef<OrgMember>[] = [
  {
    accessorKey: "fullName",
    id: "name",
    header: "Name",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-foreground">{row.original.fullName}</p>
        <p className="text-13 text-muted-foreground">{row.original.email}</p>
      </div>
    ),
    enableSorting: false,
  },
  {
    id: "role",
    header: "Role",
    cell: ({ row }) => <Badge variant={row.original.role === "owner" ? "info" : "neutral"}>{ROLE_LABEL[row.original.role]}</Badge>,
    enableSorting: false,
  },
  {
    id: "ranches",
    header: "Ranches",
    cell: ({ row }) =>
      row.original.role === "owner" ? (
        <span className="text-muted-foreground">All ranches</span>
      ) : row.original.ranchNames.length > 0 ? (
        row.original.ranchNames.join(", ")
      ) : (
        <span className="text-muted-foreground">None assigned</span>
      ),
    enableSorting: false,
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <Badge variant={row.original.isActive ? "ok" : "neutral"}>{row.original.isActive ? "Active" : "Deactivated"}</Badge>,
    enableSorting: false,
  },
  {
    id: "lastSeen",
    header: "Last seen",
    cell: ({ row }) => (
      <span className="font-mono text-13 tabular-nums text-muted-foreground">
        {row.original.lastSeenAt ? formatDateTime(row.original.lastSeenAt) : "Never"}
      </span>
    ),
    enableSorting: false,
  },
];

const ACTION_VARIANT: Record<AuditLogEntry["action"], "ok" | "info" | "critical" | "warn"> = {
  insert: "ok",
  update: "info",
  delete: "critical",
  restore: "warn",
};

const ACTION_LABEL: Record<AuditLogEntry["action"], string> = {
  insert: "Created",
  update: "Updated",
  delete: "Deleted",
  restore: "Restored",
};

const TABLE_LABEL: Record<string, string> = {
  animals: "Animal",
  movements: "Movement",
  mortalities: "Death",
  breeding_events: "Breeding event",
  births: "Birth",
  vaccinations: "Vaccination",
  treatments: "Treatment",
  illnesses: "Illness",
};

export const auditLogColumns: ColumnDef<AuditLogEntry>[] = [
  {
    accessorKey: "occurredAt",
    id: "occurredAt",
    header: "When",
    cell: ({ row }) => <span className="font-mono text-13 tabular-nums">{formatDateTime(row.original.occurredAt)}</span>,
    enableSorting: false,
  },
  {
    id: "actor",
    header: "Who",
    cell: ({ row }) => row.original.actorName ?? <span className="text-muted-foreground">System</span>,
    enableSorting: false,
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => <Badge variant={ACTION_VARIANT[row.original.action]}>{ACTION_LABEL[row.original.action]}</Badge>,
    enableSorting: false,
  },
  {
    id: "table",
    header: "Record type",
    cell: ({ row }) => TABLE_LABEL[row.original.tableName] ?? row.original.tableName,
    enableSorting: false,
  },
  {
    id: "recordId",
    header: "Record",
    cell: ({ row }) => <span className="font-mono text-12 tabular-nums text-muted-foreground">{row.original.recordId?.slice(0, 8) ?? "—"}</span>,
    enableSorting: false,
  },
];
