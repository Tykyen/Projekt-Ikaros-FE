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
    {/* QueryClientProvider MUSÍ být nad ThemeProvider — ThemeProvider přes
        useThemeSync volá useQueryClient (jinak „No QueryClient set" a bílá
        stránka po načtení). */}
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <GlobalErrorBoundary>
          <AuthBootstrap />
          <RouterProvider router={router} />
          <Toaster position="bottom-right" theme="dark" richColors />
        </GlobalErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);

// 13.2c — registrace service workeru pro push notifikace (PWA). SW neřeší
// offline cache (žádný fetch handler), jen příjem push + klik na notifikaci,
// takže je bezpečný i v dev. Reálné doručení push vyžaduje HTTPS/server.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
