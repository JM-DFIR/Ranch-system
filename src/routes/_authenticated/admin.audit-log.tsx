import { createFileRoute } from "@tanstack/react-router";

import { requireOwner } from "@/lib/auth";
import { auditLogRegisterSearchSchema } from "@/features/admin/schema";
import { AuditLogRegisterPage } from "@/features/admin/components/AuditLogRegisterPage";

export const Route = createFileRoute("/_authenticated/admin/audit-log")({
  validateSearch: auditLogRegisterSearchSchema,
  beforeLoad: ({ context }) => requireOwner(context.queryClient),
  component: AuditLogRegisterPage,
});
