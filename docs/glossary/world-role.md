---
name: world-role
aliases: [světová role, world-scoped role]
category: role-a-prava
related: [[globalni-role]], [[pan-jeskyne]], [[svet]]
status: draft
---

# Světová role (world role)

**TL;DR:** Role, která existuje jen v rámci jednoho konkrétního světa — mimo něj neplatí.

## Detail

Jeden uživatel může mít v různých světech různé světové role (např. PJ v jednom světě, hráč ve druhém). World role je uložená v [[world-membership]] entitě.

**Enum `WorldRole` má 6 hodnot:** Zadatel (0), Ctenar (1), Hrac (2), Korektor (3), [[pomocny-pj]] (4), [[pan-jeskyne]] (5).

Světové role **nezasahují do platformového obsahu** — ten řídí pouze [[globalni-role]].

📚 **D-053 cleanup** — historické hodnoty rolí se postupně sjednocují FE↔BE. Viz [docs/arch/phase-1/_side-tasks/spec-d053-role-architecture-cleanup.md](../arch/phase-1/_side-tasks/spec-d053-role-architecture-cleanup.md).

## Kde se objevuje

- v kódu (FE):
  - [src/shared/types/index.ts](../../src/shared/types/index.ts) — `enum WorldRole`
  - [src/features/world/pages/WorldSettingsPage/lib/worldRoles.ts](../../src/features/world/pages/WorldSettingsPage/lib/worldRoles.ts) — `ROLE_LABEL`, `ALL_ROLES`
  - [src/shared/ui/WorldRoleIcon/WorldRoleIcon.tsx](../../src/shared/ui/WorldRoleIcon/WorldRoleIcon.tsx)
  - [src/features/world/chat/lib/types.ts](../../src/features/world/chat/lib/types.ts) — `ChannelPresenceUser.worldRole`
- v kódu (BE):
  - backend/src/modules/worlds/interfaces/world-membership.interface.ts — `enum WorldRole`
  - backend/src/modules/worlds/schemas/world-membership.schema.ts
  - backend/src/modules/chat/interfaces/chat-channel.interface.ts — `allowedRoles: WorldRole[]`
- v dokumentaci:
  - [docs/arch/phase-3/spec-3.6a-role-matrix.md](../arch/phase-3/spec-3.6a-role-matrix.md) — role matrix
  - [docs/arch/phase-1/_side-tasks/spec-d053-role-architecture-cleanup.md](../arch/phase-1/_side-tasks/spec-d053-role-architecture-cleanup.md)
- v UI:
  - Ikona u jména člena (Members page)
  - World Settings → Members dropdown
  - Chat presence panel (grupování podle role)

## Nepleť s

- **[[globalni-role]]** — působí nad celou platformou; world role jen uvnitř jednoho světa.
