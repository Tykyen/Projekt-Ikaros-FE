---
name: npc
aliases: [NPC, Non-Player Character, nehráčská postava, isNpc]
category: herni-mechaniky
related: [[postava], [bestie], [pavucina]]
status: draft
---

# NPC

**TL;DR:** Nehráčská postava (`Character` s `isNpc: true`, bez vlastníka-hráče), kterou ovládá [[pan-jeskyne|PJ]] — má stejné subdokumenty a deník jako hráčská [[postava]].

## Detail

NPC je plnohodnotná [[postava]] vedená vypravěčem, ne hráčem. Sdílí datový model `Character`, takže má i [[denik-postavy|deník]], [[subdokument-postavy|subdokumenty]] a [[staty-systemu|staty]]. Tím se liší od [[bestie]], která je jen katalogová šablona bez deníku.

V chatu může vedení psát „za NPC" přes [[npc-mod|NPC mód]]. V příběhu NPC vystupují jako uzly [[pavucina|pavučiny vztahů]].

📚 3-tier rozlišení: **PC** (hráčská postava) / **NPC** (postava PJ) / **[[bestie]]** (šablona tvora). `NpcTemplate` byl zrušen, sjednoceno na `Character` + `Bestie`.

## Kde se objevuje

- v dokumentaci: [12-postavy-bestiar-ekonomika.md](docs/funkce/12-postavy-bestiar-ekonomika.md)
- v UI: token modal varianta NPC na [[takticka-mapa|mapě]], stránka NPC

## Nepleť s

- **[[postava]]** — hráčská postava (PC) s vlastníkem.
- **[[bestie]]** — šablona tvora bez subdokumentů/deníku.
