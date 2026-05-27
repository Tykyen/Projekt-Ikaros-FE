import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { router } from "./router";
import { GlobalErrorBoundary } from "@/shared/ui/GlobalErrorBoundary";
import { AuthBootstrap } from '@/features/auth/components';
import { ThemeProvider } from "@/themes/ThemeProvider";
import { bootstrapSchemas } from "@/features/world/tactical-map/schemas/bootstrap";
import "./index.css";

// 10.2d-prep-A C14 — registrace per-system schémat při startup.
// Idempotent (safe pro HMR a test setup). Po tomto volá konzumenti
// (BestiarPage, EntitySchemaForm, EntityStatbar) `systemEntitySchemaRegistry.get()`.
bootstrapSchemas();

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
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <GlobalErrorBoundary>
          <AuthBootstrap />
          <RouterProvider router={router} />
          <Toaster position="bottom-right" theme="dark" richColors />
        </GlobalErrorBoundary>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
