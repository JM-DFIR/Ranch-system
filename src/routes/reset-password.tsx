import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { updatePassword } from "@/features/auth/api";
import { resetPasswordSchema, type ResetPasswordInput } from "@/features/auth/schema";
import { AuthPageShell } from "@/features/auth/components/AuthPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

// Landed on via the emailed reset link — Supabase's client picks up the
// recovery token from the URL automatically (detectSessionInUrl: true,
// src/lib/supabase.ts), so by the time this form submits there's
// already a valid session to update.
function ResetPasswordPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values: ResetPasswordInput) => {
    setFormError(null);
    try {
      await updatePassword(values.password);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong. Try again.");
      return;
    }
    await navigate({ to: "/" });
  };

  return (
    <AuthPageShell title="Choose a new password" description="Use at least 8 characters.">
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password ? <p className="text-12 text-destructive">{errors.password.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword ? (
            <p className="text-12 text-destructive">{errors.confirmPassword.message}</p>
          ) : null}
        </div>
        {formError ? <p className="text-13 text-destructive">{formError}</p> : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </AuthPageShell>
  );
}
