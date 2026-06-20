---
name: denik-postavy
aliases: [deník, diary, deník postavy, personalDiary]
category: herni-mechaniky
related: [[subdokument-postavy], [staty-systemu], [postava]]
status: draft
---

# Deník postavy

**TL;DR:** [[subdokument-postavy|Subdokument]] postavy se dvěma vrstvami — vyprávěcí deník (zápisky) a per-systémová listina statů (sheet).

## Detail

Deník je hlavní „karta" [[postava|postavy]]. Drží:
- **vyprávěcí část** — chronologické zápisky o postavě,
- **listinu statů** — render hodnot dle [[herni-system|herního systému]] do TipTap editoru (schéma řízené per-systémově, viz [[staty-systemu]]).

Schéma deníku jde per-postava přepsat (osobní override). Deník je dostupný i z [[token|tokenu]] na [[takticka-mapa|mapě]] (token diary tab).

## Kde se objevuje

- v dokumentaci: [12-postavy-bestiar-ekonomika.md](docs/funkce/12-postavy-bestiar-ekonomika.md)
- v UI: záložka Deník na stránce postavy, deník v token modalu

## Nepleť s

- **Deník PJ** — `WorldGmNotes`, world-level poznámky vypravěče, ne deník konkrétní postavy.
- **[[staty-systemu]]** — samotná data statů; deník je jejich render + vyprávění.
