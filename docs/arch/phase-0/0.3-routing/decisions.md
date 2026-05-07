# Technická rozhodnutí

## Data Router místo JSX Router

**Rozhodnutí:** `createBrowserRouter` + `RouterProvider` (React Router v7 Data Router).

**Důvod:** Podporuje `loader` pattern pro auth check — loader běží před renderem, redirect nastane bez bliknutí UI. JSX Router by vyžadoval PrivateRoute wrapper komponentu.

**Alternativy:** `BrowserRouter` + `<Routes>` (odmítnuto — bez loader pattern).

**Dopad:** `main.tsx` používá `RouterProvider`, ne `BrowserRouter + App`.

---

## `authLoader` čte přímo z localStorage

**Rozhodnutí:** Loader čte `localStorage.getItem('ikaros.jwt')` + `JSON.parse()`.

**Důvod:** Loadery běží mimo React kontext — Jotai atomy nejsou dostupné. Jotai `atomWithStorage` ukládá hodnoty jako JSON, proto je nutný `JSON.parse`.

**Alternativy:** Jotai store getter mimo React (odmítnuto — fragile, tight coupling).

**Dopad:** Pokud se změní klíč nebo encoding tokenu v `authStore.ts`, musí se aktualizovat i `authLoader`.

---

## `RoleGuard` s `roles: UserRole[]`

**Rozhodnutí:** `RoleGuard` přijímá pole povolených rolí, ne `minRole` číslo.

**Důvod:** Systém rolí není čistě hierarchický — specializovaní správci (diskuzí, galerie, článků) mají horizontální práva, ne nižší úroveň v hierarchii. `minRole` by pustil dovnitř role které nemají přístup.

**Alternativy:** `minRole: UserRole` (odmítnuto — selhává pro specializované role).

**Dopad:** Každá admin route musí explicitně vyjmenovat povolené role.

---

## Kompletní stub stránky od začátku (Option A)

**Rozhodnutí:** Stub stránky pro všechny routes (fáze 0–13) vytvořeny v 0.3.

**Důvod:** Router.tsx slouží jako živá mapa celé aplikace. Layouty mají hardcoded nav linky — bez stubů by klikaly do 404. Stubs jsou levné, výhoda (přehled) převyšuje nevýhodu (mrtvý kód).

**Alternativy:** Přidávat routes postupně per-fáze (odmítnuto — 404 na nav linkách, rozptýlená mapa).

---

## `p()` helper pro Suspense wrapper

**Rozhodnutí:** Helper funkce `p(Comp)` vrací `<Suspense fallback={<Spinner center />}><Comp /></Suspense>`.

**Důvod:** Eliminuje opakování Suspense wrapperu u každé route, lazy komponenty jsou definovány na úrovni modulu.

**Dopad:** Všechny page komponenty musí mít `export default`.
