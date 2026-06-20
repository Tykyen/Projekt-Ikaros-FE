---
name: deep-link
aliases: [deep-link, deeplink, URL parametr, hluboký odkaz]
category: ui
related: [[konverzace], [wikilink], [stranka]]
status: draft
---

# Deep-link

**TL;DR:** URL přímo na konkrétní entitu/stav přes query parametry, např. `/svet/xyz/chat?konverzace=123&zprava=456`.

## Detail

Deep-link je adresa, která po otevření rovnou navede na konkrétní místo v aplikaci (otevře danou [[konverzace|konverzaci]], odscrolluje na zprávu, otevře stránku). Používá se mj. v push notifikacích chatu (BE dá URL do payloadu, FE `WorldChatRoom` čte `?konverzace=`).

## Kde se objevuje

- v dokumentaci: [13-komunikace-sveta.md](docs/funkce/13-komunikace-sveta.md)
- v UI: odkazy z notifikací, sdílené odkazy

## Nepleť s

- **[[wikilink]]** — odkaz uvnitř obsahu; deep-link je URL adresa.
