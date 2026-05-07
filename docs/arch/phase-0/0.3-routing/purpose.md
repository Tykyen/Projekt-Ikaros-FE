# Účel

Definuje kompletní route tree aplikace a zajišťuje ochranu chráněných routes před neautorizovaným přístupem.

## Odpovědnosti

- `src/router.tsx` — centrální route konfigurace pro celou aplikaci
- `authLoader` — ochrana všech chráněných routes, redirect na `/login`
- `RoleGuard` — ochrana admin routes, zobrazení 403 při nedostatečné roli
- Lazy loading všech page komponent přes `React.lazy + Suspense`
- Stub page komponenty pro všechny routes (kompletní mapa aplikace)

## Mimo rozsah

- Konkrétní obsah stránek (stub komponenty jsou prázdné placeholdery)
- Načítání uživatelských dat po přihlášení (patří do 0.4)
- JotaiProvider, Toaster wrapper v main.tsx (patří do 0.6)

## Kontext

Router je použit v `src/main.tsx` přes `<RouterProvider router={router} />`. Layouty z 0.2 jsou parent routes. Stub stránky pokrývají celou aplikaci (fáze 0–13) — slouží jako živá mapa architektury.
