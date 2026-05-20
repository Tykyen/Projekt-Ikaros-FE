---
name: svet
aliases: [world]
category: svet
related: [[pan-jeskyne]], [[world-role]]
status: draft
---

# Svět

**TL;DR:** Samostatná instance hry / komunity uvnitř platformy Ikaros — má vlastní hráče, role, obsah i dashboard.

## Detail

Svět má vlastní [[world-role]] (vč. [[pan-jeskyne]]) a vlastní dashboard. Úvodní strana světa má tři sloupce: akce / novinky / oblíbené stránky.

Platforma Ikaros hostí více světů — uživatel může být napříč nimi v různých rolích, ale jeho [[globalni-role]] zůstává jedna.

## Kde se objevuje

- v kódu (FE):
  - [src/shared/types/index.ts](../../src/shared/types/index.ts) — `interface World`
  - [src/app/layout/WorldLayout/WorldLayout.tsx](../../src/app/layout/WorldLayout/WorldLayout.tsx) — shell pro stránky světa
  - [src/features/world/context/WorldContext.tsx](../../src/features/world/context/WorldContext.tsx) — `worldId`, `worldSlug`, `isPJ`
  - [src/app/router.tsx](../../src/app/router.tsx) — routing `/svet/:worldSlug/...`
  - [src/features/world/pages/WorldDashboardPage/WorldDashboardPage.tsx](../../src/features/world/pages/WorldDashboardPage/WorldDashboardPage.tsx)
- v kódu (BE):
  - backend/src/modules/worlds/interfaces/world.interface.ts
  - backend/src/modules/worlds/schemas/world.schema.ts
  - backend/src/modules/worlds/worlds.service.ts
  - backend/src/database/seed/matrix-world.seed.ts — speciální [[matrix-svet]]
- v dokumentaci:
  - [docs/arch/phase-0/0.3-routing/routing.md](../arch/phase-0/0.3-routing/routing.md)
  - [docs/arch/phase-1/spec-1.2e-theme-sync.md](../arch/phase-1/spec-1.2e-theme-sync.md)
- v UI:
  - `/svet` — Worlds page (karty světů)
  - WorldLayout: sidenav + content
  - World nav: Dashboard, Chat, Members, News, Settings, Pages

## Nepleť s

- **platforma Ikaros** — nadřazená vrstva nad všemi světy; svět je její instance.
