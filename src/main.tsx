import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import * as Sentry from "@sentry/react";

import { router } from "./app/router";
import { queryClient } from "./app/query-client";
import { queryPersister } from "./app/query-persister";
import { initAuthListener } from "./lib/auth";
import { initSentry } from "./lib/sentry";
import { TooltipProvider } from "./components/ui/tooltip";
import { AppCrashFallback } from "./components/patterns/AppCrashFallback";
import "./styles/tokens.css";

initSentry();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found in index.html");
}

function App() {
  useEffect(() => initAuthListener(queryClient), []);
  return <RouterProvider router={router} />;
}

if (!rootElement.innerHTML) {
  createRoot(rootElement).render(
    <StrictMode>
      {/* Reports to Sentry only once VITE_SENTRY_DSN is set (initSentry
          above); the fallback UI itself works either way — this is the
          last line of defence for a crash outside any single screen's
          own error handling. */}
      <Sentry.ErrorBoundary fallback={<AppCrashFallback />}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: queryPersister, maxAge: 24 * 60 * 60 * 1000 }}
        >
          <TooltipProvider>
            <App />
          </TooltipProvider>
        </PersistQueryClientProvider>
      </Sentry.ErrorBoundary>
    </StrictMode>,
  );
}
