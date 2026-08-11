import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";

import { router } from "./app/router";
import { queryClient } from "./app/query-client";
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
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}
