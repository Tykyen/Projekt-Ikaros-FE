---
name: lokace
aliases: [location, místo, lokace-postava]
category: herni-mechaniky
related: [[postava], [stranka], [kalendar-sveta]]
status: draft
---

# Lokace

**TL;DR:** [[stranka|Stránka]] typu místo navázaná na `Character` s `kind:'location'` — má jen kalendářový subdokument, žádné finance ani výbavu.

## Detail

Lokace je speciální varianta [[postava|postavy]] reprezentující místo (město, hostinec, dungeon vstup…). Page typu Lokace má `characterRef` na `Character` s `kind:'location'`, který drží pouze [[kalendar-sveta|kalendářový]] subdokument — na rozdíl od hráčské postavy nemá finance, inventář ani bojové staty.

Slouží k provázání obsahu (wiki popis místa) s herním časem/událostmi na daném místě.

## Kde se objevuje

- v dokumentaci: [11-stranky-wiki-informace.md](docs/funkce/11-stranky-wiki-informace.md), [12-postavy-bestiar-ekonomika.md](docs/funkce/12-postavy-bestiar-ekonomika.md)
- v UI: stránka typu Lokace

## Nepleť s

- **[[postava]]** — má plnou sadu subdokumentů.
- **[[typ-stranky]]** — Lokace je jeden z typů stránky.
