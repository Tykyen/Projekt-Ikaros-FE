---
name: postava
aliases: [Character, charakter, hráčská postava, PC, player character]
category: herni-mechaniky
related: [[npc], [bestie], [lokace], [subdokument-postavy], [staty-systemu]]
status: draft
---

# Postava

**TL;DR:** Jednotná entita `Character` reprezentující hráčskou postavu (PC) — má vlastníka (hráče) a sadu subdokumentů (deník, finance, výbava, kalendář, poznámky).

## Detail

Postava je centrální herní entita světa. Datový model `Character` je **sdílený** pro tři varianty: hráčskou postavu (PC, má `userId` vlastníka), [[npc]] (vede ho PJ, bez `userId`) a [[lokace]] (`kind: 'location'`, drží jen kalendář). Postava je od kroku 9.1 sjednocená se [[stranka|stránkou]] — Page je primární, Character drží 5 [[subdokument-postavy|subdokumentů]].

Hráčská postava má kompletní výbavu subdokumentů: [[denik-postavy|deník]], [[financni-ucet|finance]], inventář, kalendář, poznámky a [[staty-systemu|staty dle herního systému]].

## Kde se objevuje

- v dokumentaci: [12-postavy-bestiar-ekonomika.md](docs/funkce/12-postavy-bestiar-ekonomika.md), [11-stranky-wiki-informace.md](docs/funkce/11-stranky-wiki-informace.md)
- v UI: stránka postavy ve světě, token na [[takticka-mapa|taktické mapě]]

## Nepleť s

- **[[npc]]** — postava bez hráče-vlastníka, vede ji PJ.
- **[[bestie]]** — katalogová šablona tvora, nemá subdokumenty ani deník.
- **[[lokace]]** — Character `kind:'location'`, jen kalendář.
