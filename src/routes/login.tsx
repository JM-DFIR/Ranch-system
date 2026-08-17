import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { signIn } from "@/features/auth/api";
import { setSessionQueryData } from "@/lib/auth";
import { loginSchema, type LoginInput } from "@/features/auth/schema";
import { AuthPageShell } from "@/features/auth/components/AuthPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { redirect } = Route.useSearch();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginInput) => {
    setFormError(null);
    let session;
    try {
      session = await signIn(values);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong. Try again.");
      return;
    }
    // Seed the session cache synchronously before navigating — see
    // setSessionQueryData's own comment for why this can't just rely
    // on the auth-state-change listener's async invalidation.
    setSessionQueryData(queryClient, session);
    await navigate({ href: redirect ?? "/" });
  };

  return (
    <AuthPageShell title="Log in" description="Welcome back — enter your details to continue.">
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
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password ? <p className="text-12 text-destructive">{errors.password.message}</p> : null}
        </div>
        {formError ? <p className="text-13 text-destructive">{formError}</p> : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
        <p className="text-center text-13 text-muted-foreground">
          <Link to="/forgot-password" className="text-primary underline-offset-4 hover:underline">
            Forgot your password?
          </Link>
        </p>
      </form>
    </AuthPageShell>
  );
}
