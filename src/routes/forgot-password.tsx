import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { requestPasswordReset } from "@/features/auth/api";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/features/auth/schema";
import { AuthPageShell } from "@/features/auth/components/AuthPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordInput) => {
    setFormError(null);
    try {
      await requestPasswordReset(values.email);
      setSent(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong. Try again.");
    }
  };

  if (sent) {
    return (
      <AuthPageShell title="Check your email" description="If that address has an account, a reset link is on its way.">
        <Link to="/login" className="text-13 text-primary underline-offset-4 hover:underline">
          Back to log in
        </Link>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell title="Reset your password" description="Enter your email and we'll send you a reset link.">
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email ? <p className="text-12 text-destructive">{errors.email.message}</p> : null}
        </div>
        {formError ? <p className="text-13 text-destructive">{formError}</p> : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
        <p className="text-center text-13 text-muted-foreground">
          <Link to="/login" className="text-primary underline-offset-4 hover:underline">
            Back to log in
          </Link>
        </p>
      </form>
    </AuthPageShell>
  );
}
