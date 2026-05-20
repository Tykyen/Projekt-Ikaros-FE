---
name: ctenar
aliases: [Čtenář, reader, world reader]
category: role-a-prava
related: [[world-role]]
status: draft
---

# Čtenář

**TL;DR:** Pasivní světová role (`WorldRole.Ctenar = 1`) — vidí obsah [[svet|světa]], ale nepřispívá ani needituje.

## Detail

Čtenář je „divák" — má přístup ke stránkám a obsahu světa (mimo skryté [[akj-urovne|AKJ úrovně]]), ale nemůže nic upravovat, psát do herních kanálů ani plnit herní akce.

⚠️ **Stav TBD** — podle nápovědy je role „v přípravě" a nemá ještě plně reálné chování.

## Kde se objevuje

- v kódu (FE):
  - [src/shared/types/index.ts](../../src/shared/types/index.ts) — `WorldRole.Ctenar = 1`
  - [src/shared/ui/WorldRoleIcon/WorldRoleIcon.tsx](../../src/shared/ui/WorldRoleIcon/WorldRoleIcon.tsx) — Eye ikona
- v kódu (BE):
  - backend/src/modules/worlds/interfaces/world-membership.interface.ts
- v UI:
  - World Settings → Members tab (Eye ikona)

## Nepleť s

- **[[hrac]]** — aktivní účastník hry; Čtenář jen pozoruje.
- **[[zadatel]]** — uchazeč, ještě není členem; Čtenář už schválený byl.
