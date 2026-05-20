---
name: ikarus
aliases: [Ikarus role]
category: role-a-prava
related: [[globalni-role]], [[superadmin]]
status: draft
---

# Ikarus (role)

**TL;DR:** Globální role č. 9 — TBD: význam a oprávnění čekají na finalizaci v D-053.

## Detail

⚠️ **Definice TBD** — role figuruje v `enum UserRole` (FE i BE), ale konečný význam a oprávnění se ladí v rámci [D-053 cleanup](../arch/phase-1/_side-tasks/spec-d053-role-architecture-cleanup.md).

Pravděpodobně designovaná pro správce platformy s nižší pravomocí než [[superadmin]], ale nad běžnými uživateli. Doplnit, až bude rozhodnuto.

## Kde se objevuje

- v kódu (FE):
  - [src/shared/types/index.ts](../../src/shared/types/index.ts) — `UserRole.Ikarus = 9`
- v kódu (BE):
  - backend/src/modules/users/interfaces/user.interface.ts — `enum UserRole`
- v dokumentaci:
  - [docs/arch/phase-1/_side-tasks/spec-d053-role-architecture-cleanup.md](../arch/phase-1/_side-tasks/spec-d053-role-architecture-cleanup.md)

## Nepleť s

- **Ikaros (platforma)** — celá platforma; Ikarus s `-us` je role.
- **[[superadmin]]** — nejvyšší globální role; Ikarus je nižší.
