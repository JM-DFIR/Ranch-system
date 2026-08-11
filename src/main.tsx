import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

import { router } from "./app/router";
import { queryClient } from "./app/query-client";
import { queryPersister } from "./app/query-persister";
import { initAuthListener } from "./lib/auth";
import { TooltipProvider } from "./components/ui/tooltip";
import "./styles/tokens.css";

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
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: queryPersister, maxAge: 24 * 60 * 60 * 1000 }}
      >
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </PersistQueryClientProvider>
    </StrictMode>,
  );
}
