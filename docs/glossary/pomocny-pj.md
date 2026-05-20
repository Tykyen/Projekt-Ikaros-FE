---
name: pomocny-pj
aliases: [PomocnyPJ, asistent PJ]
category: role-a-prava
related: [[pan-jeskyne]], [[world-role]]
status: draft
---

# Pomocný PJ

**TL;DR:** Světová role mezi hráčem a [[pan-jeskyne]] — pomáhá vést svět, ale nemá plné PJ pravomoci.

## Detail

`WorldRole.PomocnyPJ = 4` — o stupeň pod plným [[pan-jeskyne]] (5). Při smazání nebo banu PJ může logika handoveru promovat Pomocného PJ na plnou PJ roli.

Stejně jako PJ je čistě [[world-role]] — neexistuje na platformové úrovni.

## Kde se objevuje

- v kódu (FE):
  - [src/shared/types/index.ts](../../src/shared/types/index.ts) — `WorldRole.PomocnyPJ = 4`
  - [src/features/world/pages/WorldSettingsPage/lib/worldRoles.ts](../../src/features/world/pages/WorldSettingsPage/lib/worldRoles.ts)
  - [src/shared/ui/WorldRoleIcon/WorldRoleIcon.tsx](../../src/shared/ui/WorldRoleIcon/WorldRoleIcon.tsx) — Shield ikona
- v kódu (BE):
  - backend/src/modules/worlds/interfaces/world-membership.interface.ts
  - backend/src/modules/users/helpers/pj-handover.helper.ts — promo logika
- v UI:
  - Members page (Shield ikona)
  - Chat presence panel (grupuje se s PJ)

## Nepleť s

- **[[pan-jeskyne]]** — plný PJ má všechna oprávnění; Pomocný PJ je nižší stupeň.
- **Korektor** (WorldRole=3) — redakční role, ne herní.
