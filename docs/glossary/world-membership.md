---
name: world-membership
aliases: [WorldMembership, členství ve světě]
category: role-a-prava
related: [[svet]], [[world-role]], [[theme-adjust]]
status: draft
---

# World membership

**TL;DR:** Entita propojující uživatele × [[svet]] × [[world-role]] — drží, kdo je členem kterého světa a v jaké roli.

## Detail

World membership je separátní entita od `User` — uživatel může být členem **více světů** současně, v každém s jinou rolí. Drží také per-uživatel × per-svět nastavení vzhledu ([[theme-adjust]], `themeUserOverrides`).

## Kde se objevuje

- v kódu (BE):
  - backend/src/modules/worlds/interfaces/world-membership.interface.ts — interface + `enum WorldRole`
  - backend/src/modules/worlds/schemas/world-membership.schema.ts — Mongoose schéma
- v kódu (FE):
  - [src/features/world/context/WorldContext.tsx](../../src/features/world/context/WorldContext.tsx) — `userRole`, `isPJ` (odvozené z membership)
- v UI:
  - World Settings → Members tab (správa členů, role, vyřazení)

## Nepleť s

- **[[world-role]]** — samotná enum role; membership ji jen drží + váže na uživatele a svět.
- **`User` entita** — globální profil; world membership je per-svět záznam navíc.
