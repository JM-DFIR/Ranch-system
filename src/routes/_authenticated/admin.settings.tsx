import { createFileRoute } from "@tanstack/react-router";

import { requireOwner } from "@/lib/auth";
import { OrgSettingsPage } from "@/features/admin/components/OrgSettingsPage";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  beforeLoad: ({ context }) => requireOwner(context.queryClient),
  component: OrgSettingsPage,
});
