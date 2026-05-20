---
name: superadmin
aliases: [super-admin]
category: role-a-prava
related: [[globalni-role]]
status: draft
---

# Superadmin

**TL;DR:** Nejvyšší globální role nad celou platformou Ikaros — má přístup ke všemu napříč světy.

## Detail

Primárním Superadminem je **Tyky** (tykytanjunior@gmail.com), nasazený přes seed skript. Heslo se nikdy neukládá do repozitáře ani konfigurace.

## Kde se objevuje

- v kódu (FE):
  - [src/shared/types/index.ts](../../src/shared/types/index.ts) — `UserRole.Superadmin = 1`
  - [src/shared/ui/RoleStar/RoleStar.tsx](../../src/shared/ui/RoleStar/RoleStar.tsx) — žlutá hvězdička + label
  - [src/features/admin/components/RoleGuard.tsx](../../src/features/admin/components/RoleGuard.tsx) — ochrana podle globální role
  - [src/features/admin/pages/PlatformAdminPage.tsx](../../src/features/admin/pages/PlatformAdminPage.tsx)
- v kódu (BE):
  - backend/src/modules/users/interfaces/user.interface.ts — `enum UserRole.Superadmin = 1`
  - backend/src/modules/users/schemas/user.schema.ts — User schéma s `role`
  - backend/src/database/seed/matrix-world.seed.ts — seed prvního Superadmina (Tyky)
  - backend/src/modules/admin/admin.service.ts — hierarchie adminů
- v UI:
  - Žlutá hvězdička v profilu (User Card, Audit Tab)
  - Administrace → Uživatelé (filtr a akce)

## Nepleť s

- **[[pan-jeskyne]]** — world-scoped role uvnitř jednoho světa; Superadmin je platformová.
- **[[globalni-role]]** — Superadmin je **jedna z** globálních rolí, ne synonymum.
