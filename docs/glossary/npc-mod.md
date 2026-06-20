---
name: npc-mod
aliases: [NPC mód, NPC mode, psaní za NPC, NPC chat]
category: chat
related: [[npc], [konverzace], [pan-jeskyne]]
status: draft
---

# NPC mód (chat)

**TL;DR:** Režim, ve kterém vedení píše zprávy v [[konverzace|chatu]] „za [[npc|NPC]]" — override jména a avataru.

## Detail

NPC mód umožní [[pan-jeskyne|PJ]]/[[pomocny-pj|PomocnyPJ]] psát zprávy pod identitou NPC (override jméno + avatar) místo svého jména.

Souvisí s PJ personou v chatu (6.8): vedení se renderuje jako „PJ" (render-time, default-on od role ≥ PomocnyPJ), přičemž **NPC override má přednost** před personou.

## Kde se objevuje

- v dokumentaci: [13-komunikace-sveta.md](docs/funkce/13-komunikace-sveta.md)
- v UI: přepínač identity v chatu světa

## Nepleť s

- **[[neviditelny-mod]]** — skrytí online stavu; NPC mód mění identitu zpráv.
