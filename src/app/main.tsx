import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { router } from "./router";
import { GlobalErrorBoundary } from "@/shared/ui/GlobalErrorBoundary";
import { MaintenanceOverlay } from "@/shared/ui/MaintenanceOverlay";
import { AuthBootstrap } from '@/features/auth/components';
import { ThemeProvider } from "@/themes/ThemeProvider";
import { InstallBanner, UpdateBanner } from "@/features/pwa";
import { PrerenderReady } from "./PrerenderReady";
import { initMonitoring } from "@/shared/lib/monitoring";
import "./index.css";

// Monitoring (3. noha) — error tracking + globální záchyt async/promise chyb.
// Co nejdřív, ať pokryje i chyby při startu.
initMonitoring();

// STAB (styl 29) — po deployi má starý tab stale hash lazy chunků → dynamic
// import route selže (`vite:preloadError`) = bílá stránka. Jednorázový reload
// načte nový index.html + správné chunky. Guard 10 s: když ani reload nepomůže
// (2. chyba do 10 s), přestaň loopovat; pozdější chyba (>10 s) reload povolí.
window.addEventListener('vite:preloadError', () => {
  const last = Number(sessionStorage.getItem('vite-preload-reload-ts') ?? '0');
  if (Date.now() - last < 10_000) return;
  sessionStorage.setItem('vite-preload-reload-ts', String(Date.now()));
  window.location.reload();
});

// 10.2d-prep-A C14 — registrace per-system schémat.
// D-AUDIT bundle: dřív statický import + sync call → ~60 kB schémat v entry
// chunku, ačkoli je první render nepotřebuje. Teď: (a) routy, které registry
// čtou (taktická mapa, bestiáře, world chat, pop-out token), mají deterministický
// gating v router.tsx (`withSchemas` — bootstrap doběhne PŘED renderem stránky);
// (b) tady jen pojistka na pozadí pro případné budoucí negated-konzumenty.
// `bootstrapSchemas()` je idempotentní, dvojí volání je no-op.
window.setTimeout(() => {
  void import("@/features/world/tactical-map/schemas/bootstrap").then((m) =>
    m.bootstrapSchemas(),
  );
}, 1000);

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
          {/* 15B.1 — signál pro prerender (kdy je SPA domalovaná). No-op pro lidi. */}
          <PrerenderReady />
          <RouterProvider router={router} />
          {/* Spec 26.1 — offset: toasty stackují NAD FAB Vypravěče (16+56+12). */}
          <Toaster
            position="bottom-right"
            theme="dark"
            richColors
            offset={{ bottom: 84, right: 16 }}
            mobileOffset={{ bottom: 76 }}
          />
          {/* 15.1 — PWA install hint (sám se skryje ve standalone / po dismissu) */}
          <InstallBanner />
          {/* 15.1-followup — detekce nasazené nové verze → „Obnovit" (řeší
              zaseknutou starou PWA, která se sama neaktualizuje) */}
          <UpdateBanner />
          {/* Globální údržbový overlay — při výpadku BE (deploy/restart) ukáže
              „Probíhá údržba" místo matoucího „svět nenalezen"; sám se schová. */}
          <MaintenanceOverlay />
        </GlobalErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);

// 15B.1 — tvrdý strop pro prerender: kdyby se data nikdy neustálila
// (poll / živé WS), nečeká věčně — po 10 s ho pustíme renderovat, co je.
window.setTimeout(() => {
  window.__PRERENDER_READY__ = true;
}, 10000);

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
