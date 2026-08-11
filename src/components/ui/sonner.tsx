import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

// Vendored shadcn primitive, adapted: the stock version reads
// next-themes' useTheme(), which doesn't exist in this stack (no
// Next.js, no theme toggle in scope). "system" lets Sonner's own CSS
// follow prefers-color-scheme directly, same as the rest of the app's
// dark-mode handling (tokens.css) — restyle freely per CLAUDE.md §3.
function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
