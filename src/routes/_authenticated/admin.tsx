import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AdminSectionNav } from "@/features/admin/components/AdminSectionNav";

// Admin's layout — same layout+Outlet shape as health.tsx/breeding.tsx.
// No route-level guard here: Reference Data is usable by any org member
// (0021_reference_catalogue_manager_write.sql), so the layout itself
// stays open. The three owner-only destinations guard themselves.
export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <AdminSectionNav />
      <Outlet />
    </div>
  );
}
