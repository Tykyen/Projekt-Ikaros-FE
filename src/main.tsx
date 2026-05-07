import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider as JotaiProvider } from "jotai";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { router } from "./router";
import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary";
import { AuthBootstrap } from "./components/auth";
import { ThemeProvider } from "./themes/ThemeProvider";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JotaiProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <GlobalErrorBoundary>
            <AuthBootstrap />
            <RouterProvider router={router} />
            <Toaster position="bottom-right" theme="dark" richColors />
          </GlobalErrorBoundary>
        </QueryClientProvider>
      </ThemeProvider>
    </JotaiProvider>
  </StrictMode>
);
