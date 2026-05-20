---
name: globalni-role
aliases: [platform-role, platformová role]
category: role-a-prava
related: [[world-role]], [[superadmin]]
status: draft
---

# Globální role

**TL;DR:** Role, která působí nad celou platformou Ikaros — nezávisle na konkrétním světě.

## Detail

Globální role rozhoduje o platformovém obsahu (Administrace, správa uživatelů, skiny, nápověda, …). Patří sem mimo jiné [[superadmin]] a [[ikarus]].

Globální a world role se **nikdy nemíchají v jednom selectoru** — jsou to oddělené koncepty.

⚠️ **FE/BE nesoulad — D-053 cleanup probíhá:** Frontend má **6** globálních rolí (Superadmin, Admin, Ikarus, Správce článků, Správce galerie, Správce diskuzí). Backend `enum UserRole` má historicky **12** hodnot a redukuje se. Stav viz [docs/arch/phase-1/_side-tasks/spec-d053-role-architecture-cleanup.md](../arch/phase-1/_side-tasks/spec-d053-role-architecture-cleanup.md).

## Kde se objevuje

- v kódu (FE):
  - [src/shared/types/index.ts](../../src/shared/types/index.ts) — `enum UserRole`
  - [src/shared/types/userRoleLabels.ts](../../src/shared/types/userRoleLabels.ts) — labels a ikony
  - [src/features/users/components/shared/RoleChip.tsx](../../src/features/users/components/shared/RoleChip.tsx)
  - [src/features/admin/components/RoleGuard.tsx](../../src/features/admin/components/RoleGuard.tsx) — route guard
- v kódu (BE):
  - backend/src/modules/users/interfaces/user.interface.ts — `enum UserRole` (12 hodnot, D-053 cleanup)
  - backend/src/common/decorators/roles.decorator.ts — `@Roles(...)` decorator
  - backend/src/common/guards/roles.guard.ts — `RolesGuard`
- v dokumentaci:
  - [docs/arch/phase-1/_side-tasks/spec-d053-role-architecture-cleanup.md](../arch/phase-1/_side-tasks/spec-d053-role-architecture-cleanup.md)
- v UI:
  - Administrace → Uživatelé (sloupec Role, filtr)
  - RoleChip / RoleStar v kartách uživatelů

## Nepleť s

- **[[world-role]]** — role v rámci konkrétního světa (např. [[pan-jeskyne]]), do platformového obsahu nezasahuje.
