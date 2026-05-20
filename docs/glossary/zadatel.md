---
name: zadatel
aliases: [Žadatel, applicant, world applicant]
category: role-a-prava
related: [[world-role]], [[zpracovat-tab]]
status: draft
---

# Žadatel

**TL;DR:** Světová role č. 0 (`WorldRole.Zadatel`) — uchazeč o vstup do [[svet|světa]], čeká na schválení [[pan-jeskyne|PJ]].

## Detail

Žadatel zatím **není plnohodnotným členem světa**. Po podání žádosti čeká, až ji PJ (nebo [[pomocny-pj]]) schválí přes [[zpracovat-tab]]. Po schválení mu bude přidělena vyšší role ([[ctenar]], [[hrac]], …).

⚠️ **Stav TBD** — podle nápovědy je role „v přípravě" a nemá ještě plně reálné chování.

## Kde se objevuje

- v kódu (FE):
  - [src/shared/types/index.ts](../../src/shared/types/index.ts) — `WorldRole.Zadatel = 0`
  - [src/shared/ui/WorldRoleIcon/WorldRoleIcon.tsx](../../src/shared/ui/WorldRoleIcon/WorldRoleIcon.tsx) — Hourglass ikona
- v kódu (BE):
  - backend/src/modules/worlds/interfaces/world-membership.interface.ts
- v UI:
  - World Settings → Members tab (Hourglass ikona)

## Nepleť s

- **[[ctenar]] / [[hrac]] / [[korektor]] / [[pomocny-pj]] / [[pan-jeskyne]]** — schválené role; Žadatel je „pre-vstupní" stav.
