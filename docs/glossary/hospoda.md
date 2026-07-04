---
name: hospoda
aliases: [Putyka, Hospoda, Dimenzionální Putyka, global chat, globální chat, platformový chat, Camp]
category: chat
related: [[kanal], [konverzace], [vlastni-emote]]
status: draft
---

# Putyka

**TL;DR:** Platformový veřejný chat napříč celou platformou — veřejná klábosna mimo konkrétní [[svet|svět]]. Dříve „Hospoda"; interní klíč místnosti zůstává `hospoda`.

## Detail

Putyka (plný název „Dimenzionální Putyka") je globální (platformový) chat dostupný všem uživatelům, nezávisle na světě. Doplňují ji atmosférické roleplay místnosti „Camp I.–III." se sdíleným prostředím. Podporuje textové emotikony (`:)` → 🙂) a [[vlastni-emote|globální emoty]].

Přejmenováno z „Hospoda" na „Putyka" na žádost testerů — změnil se jen zobrazený název; interní `RoomKey`, WS eventy (`chat:hospoda:*`) i notifikační kategorie zůstávají `hospoda` (kontrakt s BE).

## Kde se objevuje

- v dokumentaci: [05-komunikace-platformy.md](docs/funkce/05-komunikace-platformy.md)
- v UI: globální chat platformy (levý panel „Chat" → „Putyka")

## Nepleť s

- **[[kanal]] / [[konverzace]]** — chat uvnitř konkrétního světa; Putyka je platformová.
