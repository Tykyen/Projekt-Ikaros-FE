# Účel

Zachytit všechny unhandled chyby v aplikaci — rendering pády i API selhání — a zajistit, že uživatel nikdy neuvidí prázdnou stránku nebo broken UI.

## Odpovědnosti

- `GlobalErrorBoundary` (React class component) — záchranná síť pro rendering chyby které `errorElement` nepokryje
- Zobrazení recovery UI při kritickém pádu (tlačítko "Obnovit stránku")
- Tiché API selhání (chyba načítání dat v komponentě) → toast přes Sonner, ne pád celé stránky
- `ErrorPage` (již existuje) → pro chyby zachycené React Routerem přes `errorElement`

## Mimo rozsah

- Logování chyb na server (Sentry apod.) — není součástí 0.5
- Per-feature error stavy (loading/error v konkrétní komponentě) — řeší každá feature sama

## Kontext

Vrstvení error handlingu v aplikaci:

```
GlobalErrorBoundary        ← zachytí vše co propadne níže
  └── RouterProvider
        ├── errorElement (IkarosLayout)   ← loader/action chyby
        ├── errorElement (WorldLayout)    ← loader/action chyby
        └── komponenty → API chyba → toast (Sonner)
```

`GlobalErrorBoundary` sedí jako nejvyšší wrapper v `main.tsx`, nad `RouterProvider`.
