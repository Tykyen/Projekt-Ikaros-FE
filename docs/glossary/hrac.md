---
name: hrac
aliases: [Hráč, player, world player]
category: role-a-prava
related: [[world-role]]
status: draft
---

# Hráč

**TL;DR:** Aktivní účastník hry ve [[svet|světě]] (`WorldRole.Hrac = 2`) — typický „základní" člen.

## Detail

Hráč má plnou účast ve hře vedené [[pan-jeskyne|PJ]]: čte herní obsah (mimo skryté [[akj-urovne|AKJ úrovně]]), píše do herních kanálů, vede postavu, plní akce.

Většina členů světa je v této roli; speciální role ([[korektor]], [[pomocny-pj]], [[pan-jeskyne]]) jsou volitelně nad ní.

## Kde se objevuje

- v kódu (FE):
  - [src/shared/types/index.ts](../../src/shared/types/index.ts) — `WorldRole.Hrac = 2`
  - [src/shared/ui/WorldRoleIcon/WorldRoleIcon.tsx](../../src/shared/ui/WorldRoleIcon/WorldRoleIcon.tsx) — User ikona
- v kódu (BE):
  - backend/src/modules/worlds/interfaces/world-membership.interface.ts
- v UI:
  - World Settings → Members tab (User ikona)

## Nepleť s

- **[[ctenar]]** — pasivní; Hráč aktivně hraje.
- **[[zadatel]]** — pre-vstupní; Hráč je už člen.
