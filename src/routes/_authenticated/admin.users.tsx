import { createFileRoute } from "@tanstack/react-router";

import { requireOwner } from "@/lib/auth";
import { usersRegisterSearchSchema } from "@/features/admin/schema";
import { UsersRegisterPage } from "@/features/admin/components/UsersRegisterPage";

export const Route = createFileRoute("/_authenticated/admin/users")({
  validateSearch: usersRegisterSearchSchema,
  beforeLoad: ({ context }) => requireOwner(context.queryClient),
  component: UsersRegisterPage,
});
