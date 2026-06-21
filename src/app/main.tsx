import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { router } from "./router";
import { GlobalErrorBoundary } from "@/shared/ui/GlobalErrorBoundary";
import { AuthBootstrap } from '@/features/auth/components';
import { ThemeProvider } from "@/themes/ThemeProvider";
import { InstallBanner } from "@/features/pwa";
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
          {/* 15.1 — PWA install hint (sám se skryje ve standalone / po dismissu) */}
          <InstallBanner />
        </GlobalErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);

// 13.2c — registrace service workeru pro push (PWA).
// 15.1 — + offline shell cache. SW dostane `mode=prod` JEN v produkčním buildu;
// v dev zůstává push-only (žádný fetch handler → HMR netknutý). Reálné doručení
// push vyžaduje HTTPS/server.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // SW běží mimo bundler (nemá `import.meta.env`) → BE origin + režim mu
    // předáme query parametrem. `api` potřebuje při `pushsubscriptionchange`
    // k re-subscribe (fetch VAPID klíče), když se odběr zrotuje bez appky.
    const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
    const mode = import.meta.env.PROD ? "&mode=prod" : "";
    const swUrl = `/sw.js?api=${encodeURIComponent(apiBase)}${mode}`;
    void navigator.serviceWorker.register(swUrl).catch(() => {});
  });
}
