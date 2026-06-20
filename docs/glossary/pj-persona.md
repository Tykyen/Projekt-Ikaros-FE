---
name: pj-persona
aliases: [PJ persona, persona vedení, unified persona, individual persona]
category: chat
related: [[npc-mod], [pan-jeskyne], [pomocny-pj], [konverzace]]
status: draft
---

# PJ persona (chat)

**TL;DR:** Jak se vedení podepisuje v [[konverzace|chatu]] — buď anonymně jako „PJ" (unified), nebo pod vlastním jménem per role (individual).

## Detail

PJ persona (6.8) řídí identitu vedení ve zprávách:
- **unified** — vedení vystupuje anonymně jako „PJ" (render-time, default-on od role ≥ [[pomocny-pj|PomocnyPJ]]),
- **individual** — každý člen vedení píše pod svým jménem.

[[npc-mod|NPC override]] má vždy přednost před personou.

## Kde se objevuje

- v dokumentaci: [13-komunikace-sveta.md](docs/funkce/13-komunikace-sveta.md)
- v UI: identita zpráv vedení v chatu

## Nepleť s

- **[[npc-mod]]** — psaní za konkrétní NPC; persona řeší podpis vedení obecně.
