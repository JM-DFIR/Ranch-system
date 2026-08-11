import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { acceptInvitation } from "@/features/auth/api";
import { acceptInvitationSchema, type AcceptInvitationInput } from "@/features/auth/schema";
import { AuthPageShell } from "@/features/auth/components/AuthPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const acceptInvitationSearchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/accept-invitation")({
  validateSearch: acceptInvitationSearchSchema,
  component: AcceptInvitationPage,
});

function AcceptInvitationPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInvitationInput>({ resolver: zodResolver(acceptInvitationSchema) });

  if (!token) {
    return (
      <AuthPageShell
        title="Invitation link needed"
        description="Open this page from the link in your invitation email."
      >
        <p className="text-13 text-muted-foreground">
          If you've lost the email, ask your organisation's owner to resend it.
        </p>
      </AuthPageShell>
    );
  }

  const onSubmit = async (values: AcceptInvitationInput) => {
    setFormError(null);
    try {
      await acceptInvitation({ token, ...values });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong. Try again.");
      return;
    }
    await navigate({ to: "/login" });
  };

  return (
    <AuthPageShell title="Set up your account" description="Choose a name and password to finish joining.">
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" autoComplete="name" aria-invalid={!!errors.fullName} {...register("fullName")} />
          {errors.fullName ? <p className="text-12 text-destructive">{errors.fullName.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password ? <p className="text-12 text-destructive">{errors.password.message}</p> : null}
        </div>
        {formError ? <p className="text-13 text-destructive">{formError}</p> : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Setting up…" : "Create account"}
        </Button>
      </form>
    </AuthPageShell>
  );
}
