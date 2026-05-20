---
name: pan-jeskyne
aliases: [PJ, gamemaster, GM]
category: role-a-prava
related: [[svet]], [[world-role]]
status: draft
---

# Pán jeskyně (PJ)

**TL;DR:** Hráč, který vede konkrétní svět — řídí příběh, sezení a herní mechaniky uvnitř toho světa.

## Detail

PJ je **world-scoped** role (existuje jen v rámci konkrétního světa, ne nad platformou). Jeden uživatel může být PJ v jednom světě a obyčejný hráč v jiném.

Do platformové (globální) role nepatří — Ikaros platforma nezná koncept PJ na úrovni nad světem.

## Kde se objevuje

- v kódu (FE):
  - [src/shared/types/index.ts](../../src/shared/types/index.ts) — `WorldRole.PJ = 5`
  - [src/features/world/pages/WorldSettingsPage/lib/worldRoles.ts](../../src/features/world/pages/WorldSettingsPage/lib/worldRoles.ts) — label + Crown ikona
  - [src/shared/ui/WorldRoleIcon/WorldRoleIcon.tsx](../../src/shared/ui/WorldRoleIcon/WorldRoleIcon.tsx) — vizualizace
  - [src/features/world/context/WorldContext.tsx](../../src/features/world/context/WorldContext.tsx) — flag `isPJ`
- v kódu (BE):
  - backend/src/modules/worlds/interfaces/world-membership.interface.ts — `enum WorldRole.PJ = 5`
  - backend/src/modules/users/helpers/pj-handover.helper.ts — předání PJ při banu/smazání
  - backend/src/modules/worlds/schemas/world-membership.schema.ts
- v dokumentaci:
  - [docs/arch/phase-1/_side-tasks/spec-d053-role-architecture-cleanup.md](../arch/phase-1/_side-tasks/spec-d053-role-architecture-cleanup.md)
- v UI:
  - Crown ikona vedle jména člena (sidebar, Members page)
  - World Settings → Members (správa PJ)
  - Chat presence panel (vidí jen PJ)

## Nepleť s

- **[[superadmin]]** — globální role nad celou platformou; PJ je jen v rámci jednoho světa.
- **[[globalni-role]]** — platformové role; PJ tam **nepatří**.
