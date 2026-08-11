import type { ReactNode } from "react";

interface AuthPageShellProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function AuthPageShell({ title, description, children }: AuthPageShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="font-display text-20 font-semibold text-acacia-900">LIMS</p>
          <h1 className="mt-4 font-display text-26 font-semibold text-foreground">{title}</h1>
          {description ? <p className="mt-1 text-14 text-muted-foreground">{description}</p> : null}
        </div>
        <div className="rounded-card border border-line bg-card p-6">{children}</div>
      </div>
    </main>
  );
}
