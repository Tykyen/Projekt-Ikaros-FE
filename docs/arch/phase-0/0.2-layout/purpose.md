# Účel

Definuje tři shell layouty které obalují všechny stránky aplikace a zajišťují konzistentní navigaci a strukturu.

## Odpovědnosti

- `IkarosLayout` — 3-sloupcový shell (header, sidebar, main, right panel) pro Ikaros platformu
- `WorldLayout` — světový shell (EXIT, název světa, dropdown nav, full-width main) pro jednotlivé světy
- `AuthLayout` — prázdný card layout pro login a registraci
- `WorldContext` provider — sdílí `worldId`, `world`, `isPJ`, `userRole`, `loading` do celého světového stromu
- Responsive chování — desktop 3 sloupce → tablet 2 → mobil drawer

## Mimo rozsah

- Obsah jednotlivých stránek (patří do `pages/`)
- Světová specifická navigace nad rámec shell struktury

## Kontext

Layouty jsou použity v `src/router.tsx` jako parent routes. Každý layout renderuje `<Outlet />` kde se zobrazují child pages. Exportovány přes `src/components/layout/index.ts`.
