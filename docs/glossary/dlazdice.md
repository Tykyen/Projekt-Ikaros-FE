---
name: dlazdice
aliases: [tile, card]
category: ui
related: [[svet]]
status: draft
---

# Dlaždice

**TL;DR:** Modulární UI blok v dashboardu (světa nebo platformy) — typicky ohraničený box s nadpisem a obsahem, který se skládá do sloupců.

## Detail

Dlaždice je základní stavební prvek dashboardových layoutů. Příklad: úvodní strana světa má tři sloupce, v nich dlaždice „akce" / „novinky" / „oblíbené stránky".

Dlaždice se chová responzivně — na mobilu se sloupce skládají pod sebe a dlaždice zabírá plnou šířku.

## Kde se objevuje

- v kódu (FE):
  - [src/features/world/pages/WorldDashboardPage/WorldDashboard/components/DashTile.tsx](../../src/features/world/pages/WorldDashboardPage/WorldDashboard/components/DashTile.tsx) — ikona + label + badge
  - [src/features/world/pages/WorldDashboardPage/WorldDashboard/WorldDashboard.tsx](../../src/features/world/pages/WorldDashboardPage/WorldDashboard/WorldDashboard.tsx)
  - [src/features/ikaros/pages/DashboardPage/components/WorldCard.tsx](../../src/features/ikaros/pages/DashboardPage/components/WorldCard.tsx)
- v kódu (BE):
  - žádné výskyty (UI komponenta je čistě FE-side). V BE existuje pojem „tile" v dungeon editoru (backend/src/modules/dungeon-maps/dungeon-maps.controller.ts), ale jde o **jiný** koncept (tile-based grid).
- v dokumentaci:
  - [docs/arch/phase-5/spec-5.2-world-dashboard.md](../arch/phase-5/spec-5.2-world-dashboard.md)
- v UI:
  - Úvodka světa: DashTile (Hráči, Chat) + sloupce (Akce, Novinky, Oblíbené)
  - Global Dashboard: WorldCard (grid karet do světů)

## Nepleť s

- **sloupec** — kontejner pro několik dlaždic; dlaždice je dovnitř.
- **karta v seznamu** — opakující se prvek v listu (např. uživatel v seznamu); dlaždice je samostatný modulární blok.
